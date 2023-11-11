
// MqttTransport
import { IHubTransport, ISubscription } from "../IHubTransport";
import * as mqtt from 'mqtt';
import * as os from "os";
import { IHiveKey } from "@keys/IHiveKey";
import { ECDSAKey } from "@keys/ECDSAKey";
import { IPublishPacket } from 'mqtt';


export class MqttTransport implements IHubTransport {
    // expect mqtt://addr:port/
    fullURL: string
    clientID: string
    caCertPem: string
    instanceID: string = ""
    inboxTopic: string = ""

    // application handler of connection status change
    connectHandler: null | ((connected: boolean, err: Error) => void) = null;
    // application handler of incoming messages
    messageHandler: null | ((topic: string, payload: string) => void) = null;
    // application handler of incoming request-response messages
    requestHandler: null | ((topic: string, payload: string) => string) = null;

    // myKeys:IHiveKey
    // https://github.com/mqttjs/MQTT.js/
    mcl: mqtt.MqttClient | null = null

    // map of correlationID to handler receiving a reply or timeout error
    // TODO: expire correlation IDs after X seconds
    replyHandlers: { [index: string]: (corrID: string, reply: string) => void };

    constructor(
        fullURL: string, clientID: string, caCertPem: string) {

        this.fullURL = fullURL
        this.clientID = clientID
        this.caCertPem = caCertPem
        this.replyHandlers = {}
    }

    public addressTokens(): { sep: string, wc: string, rem: string } {
        return { sep: "/", wc: "+", rem: "#" }
    }

    // connect and subscribe to the inbox
    public async connectWithPassword(password: string): Promise<void> {
        // let urlParts = new URL(this.fullURL)
        let p = new Promise<void>((resolve, reject) => {

            // console.log("connectWithPassword; url:", this.fullURL, "; clientID:", this.clientID)

            let timestamp = Date.now().toString() // msec since epoch
            let rn = Math.random().toString(16).substring(2, 8)
            this.instanceID = this.clientID + "-" + os.hostname + "-" + timestamp + "-" + rn
            // see https://github.com/mqttjs/MQTT.js/ for options
            let opts: mqtt.IClientOptions = {
                password: password,
                ca: this.caCertPem,
                clientId: this.instanceID,
                protocolVersion: 5, // MQTT 5 is required for rpc
                username: this.clientID,
                rejectUnauthorized: (this.caCertPem != ""),
                properties: {
                    userProperties: {
                        "clientID": this.clientID
                    }
                }

            }

            this.mcl = mqtt.connect(this.fullURL, opts)

            this.mcl.on("connect", (packet: any) => {
                console.log("MQTT client connected to:", this.fullURL)
                // subscribe to inbox; server only allows inbox subscription with the clientID
                // to prevent subscribing to other client's inboxes.
                this.inboxTopic = "_INBOX/" + this.instanceID
                if (this.mcl) {
                    let inboxSub = this.mcl.subscribe(this.inboxTopic)
                    console.log("subscribed to ", this.inboxTopic)
                }
                resolve()
            })
            this.mcl.on("disconnect", (args: any) => {
                console.log("MQTT server disconnected:")
            })
            this.mcl.on("error", (err: Error) => {
                console.error("MQTT error: ", err.message)
                reject(err)
            })
            this.mcl.on("message",
                (topic: string, payload: Buffer, packet: IPublishPacket) => {
                    // console.log("on message. topic:", topic)
                    this.onRawMessage(topic, payload, packet)
                })
            this.mcl.on("offline", () => {
                console.error("Connection lost")
            })
            // this.mcl.on("packetreceive", (packet: mqtt.Packet) => {
            //     console.error("packetReceive: cmd:", packet.cmd)
            // })


        })
        return p
    }

    public async connectWithToken(key: IHiveKey, token: string): Promise<void> {
        // TODO: encrypt token with server public key so a MIM won't be able to get the token
        return this.connectWithPassword(token)
    }

    // this mqtt transport uses ECDSA keys
    public createKeyPair(): IHiveKey {
        let kp = new ECDSAKey().initialize()
        return kp
    }

    public disconnect(): void {
        if (this.mcl != null) {
            this.mcl.end()
            this.mcl = null
        }
    }

    // handle incoming mqtt message.
    // This determines the type of message and passes it on to the corresponding handlers.
    //  * INBOX message: The handler registered to the correlationID will be invoked.
    //  * Message with replyTo address: the RequestHandler will be invoked and its result is sent to the replyTo address.
    //  * Message with no replyTo address: The MessageHandler will be invoked.
    onRawMessage(topic: string, payload: Buffer, packet: mqtt.IPublishPacket): void {
        // intercept INBOX replies
        let payloadStr = payload.toString()
        let cordata = packet.properties?.correlationData
        let corid = cordata?.toString() || ""
        try {
            if (corid != "") {
                // this is a response to a request.
                // find the reply handler for the correlation ID.
                let handler = this.replyHandlers[corid]
                handler(corid, payloadStr)
                return
            } else if (packet.properties?.responseTopic) {
                let err: Error | null = null
                let reply: string = ""
                // this is a request that asks for a reponse
                if (this.requestHandler) {
                    try {
                        reply = this.requestHandler(topic, payloadStr)
                    } catch (e: any) {
                        err = Error("ERROR: exception:", e)
                    }
                } else {
                    err = Error("No handler for topic:" + topic)
                }
                this.pubReply(reply, err, packet)
            } else {
                // this is a message without response
                if (this.messageHandler) {
                    this.messageHandler(topic, payloadStr)
                }
            }
        } catch (e) {
            console.error("exception handling message. topic:", topic, ", err:", e)
        }
    }

    public async pub(address: string, payload: string): Promise<void> {
        if (this.mcl) {
            this.mcl.publish(address, payload)
        }
        return
    }
    // send a reply to a request
    public async pubReply(payload: string, err: Error | null, request: IPublishPacket) {
        if ((!this.mcl) || (!request.properties?.correlationData) || !request.properties.responseTopic) {
            let err = Error("pubReply without a proper request packet")
            console.error(err)
            throw err
        }
        let corid = request.properties?.correlationData
        let opts: mqtt.IClientPublishOptions = {
            properties: {
                responseTopic: request.properties?.responseTopic,
                correlationData: corid,
            }
        }
        // typescript doesn't recognize that opts.properties is already set
        if (err && (!!opts.properties)) {
            let userProp = { error: err.message };
            opts.properties.userProperties = userProp;
        }
        let replyTo = request.properties?.responseTopic
        this.mcl.publish(replyTo, payload, opts, (err) => {
            if (err) {
                // failed to send a reply
                console.error("failed to send reply. err=", err)
                throw (err)
            } else {
                console.log('Request sent with correlation ID:', corid)
            }
        })
        return
    }

    public async pubRequest(address: string, payload: string): Promise<string> {

        let p = new Promise<string>((resolve, reject) => {
            let rn = Math.random().toString(16).substring(2, 8)
            let corid = Date.now().toString(16) + "." + rn

            let opts = {
                properties: {
                    responseTopic: this.inboxTopic,
                    correlationData: Buffer.from(corid)
                }
            }
            this.mcl ? this.mcl.publish(
                address, payload, opts, (err) => {
                    if (err) {
                        console.log(err)
                        reject()
                        throw (err)
                    } else {
                        console.log('Request sent with correlation ID:', corid)
                    }
                }) : "";
            // If the onMessage handler receives a message with this correlation ID
            // then it invokes the resolve() function with the reply payload.
            let h = function (corrID: string, payload: string): void {
                console.log("invoking reply handler")
                resolve(payload)
            }
            this.replyHandlers[corid] = h.bind(this)
        })
        return p
    }

    // set a handler
    public setOnConnect(handler: () => void): void {
        if (this.mcl) {
            this.mcl.on("connect", handler)
            this.mcl.on("reconnect", handler)
        }
    }

    public setOnDisconnect(handler: (err: Error | null) => void): void {
        if (this.mcl) {
            this.mcl.on("disconnect", (packet: mqtt.IDisconnectPacket) => {
                let reason: string = packet.reasonCode?.toString() || ""
                if (packet.reasonCode != 0) {
                    let err = new Error(reason + ":" + packet.properties?.reasonString)
                    handler(err)
                } else {
                    handler(null)
                }

            })
        }
    }

    // Set the callback of connect/disconnect updates
    public set onConnect(handler: (connected: boolean, err: Error | null) => void) {
        this.connectHandler = handler
    }

    // Set the handler of incoming messages
    public set onMessage(handler: (topic: string, payload: string) => void) {
        this.messageHandler = handler
    }

    // Set the handler of incoming requests-response calls.
    // The result of the handler is sent as a reply.
    // Intended for handling actions and RPC requests.
    public set onRequest(handler: (topic: string, payload: string) => string) {
        this.requestHandler = handler
    }

    // subscribe to a topic
    public async subscribe(topic: string): Promise<void> {
        let p = new Promise<void>((resolve, reject) => {
            if (!this.mcl) {
                throw ("no server connection");
            }
            // this.mcl.subscribe(topic, opts, (err, granted) => {
            this.mcl.subscribe(topic, (err, granted) => {
                // remove registration if subscription fails
                if (err) {
                    console.error("sub failed: " + err);
                    reject(err)
                } else {       // all good
                    console.log("sub granted: " + granted);
                    resolve()
                }
            })
        })
        return p;

    }

    unsubscribe(address: string) {
        if (this.mcl) {
            this.mcl.unsubscribe(address);
        }
    }
}

// Create a new MQTT transport using websockets over SSL
//
// fullURL schema supports: mqtt, mqtts, tcp, tls, ws, wss, wxs, alis
//
//
// @param fullURL is the websocket address: wss://address:port/path
// @param clientID is the client's connection ID
// @param caCertPem is the pem encoded CA certificate, if available. Use "".
// @param onMessage is the message handler for subscriptions
// export function NewMqttTransport(fullURL:string, clientID:string, caCertPem:string,
//                                  onMessage:(topic:string,msg:string)=>void): MqttTransport {
//     //
//     // caCertPool := x509.NewCertPool()
//     // if caCert != nil {
//     //     caCertPool.AddCert(caCert)
//     // }
//     // tlsConfig := &tls.Config{
//     //     RootCAs:            caCertPool,
//     //         InsecureSkipVerify: caCert == nil,
//     // }
//
//
//     let tp = new MqttTransport(fullURL,clientID,caCertPool,onMessage)
//     return tp
// }