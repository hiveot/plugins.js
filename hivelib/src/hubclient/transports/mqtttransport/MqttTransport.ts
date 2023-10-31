
// MqttTransport
import {IHubTransport, ISubscription} from "@hivelib/hubclient/transports/IHubTransport";
import * as mqtt from 'mqtt';
import {createEd25519Keys,  marshalEd25519} from "@hivelib/certs/Keys";
import * as os from "os";
import {IPublishPacket} from "mqtt";
import {IClientPublishOptions} from "mqtt/src/lib/client";


export class Subscription implements ISubscription {
    topic:string
    handler: (msg: IPublishPacket)=>string|void
    unsubscribe: ()=>void
    subscriptionID: number
}

export class MqttTransport implements IHubTransport{
    // expect mqtt://addr:port/
    fullURL:string
    clientID:string
    caCertPem:string
    instanceID:string = ""
    inboxTopic:string=""
    // https://github.com/mqttjs/MQTT.js/
    mcl: mqtt.MqttClient=null
    public onConnected:()=>void
    public onDisconnected:()=>void

    // map of correlationID to handler receiving a reply or timeout error
    // TODO: expire correlation IDs after X seconds
    requestHandlers: {[index:string]: Promise<string>};

    subscriptions= new Array<Subscription>();

    constructor(fullURL:string,clientID:string,caCertPem:string) {
        this.fullURL=fullURL
        this.clientID=clientID
        this.caCertPem=caCertPem
    }

    public addressTokens(): {sep:string, wc:string, rem: string} {
        return {sep:"/", wc:"+", rem:"#"}
    }

    public connectWithPassword(password: string): Promise<void> {
        // let urlParts = new URL(this.fullURL)
        let timestamp = Date.now().toString() // msec since epoch
        let rn = Math.random().toString(16).substring(2,8)
        this.instanceID = this.clientID + "-"+os.hostname+"-"+timestamp+"-"+rn
        // see https://github.com/mqttjs/MQTT.js/ for options
        let opts:mqtt.IClientOptions = {
            password:password,
            ca: this.caCertPem,
            clientId: this.instanceID,
            protocolVersion: 5, // MQTT 5 is required for rpc
            username: this.clientID,
            properties: {
                userProperties: {
                    "clientID": this.clientID
                }
            }
            // host: urlParts.host,
            // port: parseInt(urlParts.port),
            // path: urlParts.pathname
        }
        this.mcl = mqtt.connect(this.fullURL,opts)
        this.mcl.on("message", this.onMessage)
        this.mcl.on("connect", this.onConnected)
        this.mcl.on("reconnect", this.onConnected)
        this.mcl.on("disconnect", this.onDisconnected)

        // subscribe to inbox
        this.inboxTopic = "_INBOX/"+this.instanceID
        this.mcl.subscribe(this.inboxTopic)
        return
    }
    public connectWithToken(serializedKP: string, token: string): Promise<void> {
        // TODO: encrypt token with server public key so a MIM won't be able to get the token
        return this.connectWithPassword(token)
    }

    public createKeyPair(): {serializedKP:string, pubKey:string} {
        let keys = createEd25519Keys()
        let serializedKP = marshalEd25519(keys.privKey)
        return {serializedKP:serializedKP,pubKey:keys.pubKey}
    }

    public disconnect():void {
        if (this.mcl != null) {
            this.mcl.end()
            this.mcl = null
        }
    }

    // handle incoming mqtt message
    onMessage(topic: string, payload: Buffer, packet: IPublishPacket): void {
        // lookup the topic subscription
        for (let i=0; i < this.subscriptions.length; i++) {
            let s = this.subscriptions[i]
            if (s.topic == topic) {
                s.handler(packet)
            }
        }
    }

    public set onConnect(handler: ()=>void) {
        this.onConnected = handler
    }

    public set onDisconnect(handler: ()=>void) {
        this.onDisconnected = handler
    }

    public pub(address: string, payload: string): Promise<void> {
        this.mcl.publish(address, payload)
        return
    }
    public async pubRequest(address: string, payload: string): Promise<string> {
        let p = new Promise<string>((resolve, reject)=>{
            let rn = Math.random().toString(16).substring(2,8)
            let cID = Date.now().toString(16)+"."+rn

            let opts = {
                properties: {
                    responseTopic: this.inboxTopic,
                    correlationData: Buffer.from('correlation data')
                }}
            let messageId = this.mcl.publish(
                address, payload, opts, (err) => {
                    if(err){
                        console.log(err)
                        throw(err)
                    }else{
                        console.log('Request Message Sent: ', messageId)
                    }
                })
            // the promise resolves when a reply is received or rejects on timeout
            this.requestHandlers[cID] = p
        })
        return p
    }

    // subscribe to a topic
    // mqtt.js doesn't support subscription callbacks so we need to build a subscription
    // list and handle it ourselves.
    public  sub(topic: string, handler: (topic:string,data:string)=>void):ISubscription {
        let subscriptionID = Date.now().valueOf() + Math.random()
        let subscription = new Subscription()

        subscription.subscriptionID = subscriptionID
        subscription.topic = topic
        subscription.unsubscribe = ()=>{
            // TODO: use subscription ID
            if (topic in this.subscriptions) {
                this.mcl.unsubscribe(topic)
                delete this.subscriptions[topic]
            }
        }
        // this handler passes the received message to the give handler
        subscription.handler=(msg:IPublishPacket):void=>{
            try {
                handler(msg.topic, msg.payload.toString())
            } catch {}
        };
        this.subscriptions[topic] = subscription

        let opts :mqtt.IClientSubscribeOptions = {
            qos:1,
            properties:{
                subscriptionIdentifier: subscriptionID,
            },
        }
        this.mcl.subscribe(topic, opts, (err,granted)=>{
            // remove registration if subscription fails
            if (err) {
                console.error("sub failed: "+err)
                delete this.subscriptions[topic]
            } else {
                // all good
            }
        })
        return subscription

    }

    // subRequest subscribes to a request and sends the reply to the reply-to address
    // in the request. This requires MQTT 5.
    public subRequest(address: string,
               handler: (addr: string, payload: string)=> string): ISubscription {

        let subscriptionID = Date.now().valueOf() + Math.random()
        let subscription = new Subscription()
        subscription.subscriptionID = subscriptionID
        subscription.topic = address;
        subscription.unsubscribe = ()=>{
            if (address in this.subscriptions) {
                this.mcl.unsubscribe(address)
                delete this.subscriptions[address]
            }
        }
        // this handler sends the result to the reply-to address
        subscription.handler=(msg:IPublishPacket):string=>{
            try {
                let reply = handler(msg.topic, msg.payload.toString())
                let replyOpts:IClientPublishOptions = {
                    qos:1,
                    retain:false,
                    properties: {
                        correlationData: msg.properties.correlationData,
                        userProperties:msg.properties.userProperties,
                        contentType: msg.properties.contentType,
                        messageExpiryInterval: msg.properties.messageExpiryInterval,
                    }
                }
                this.mcl.publish(msg.properties.responseTopic, reply,replyOpts)
            } catch (err) {
                console.error("subRequest exception: "+err)
            }
            return ""
        };
        this.subscriptions[address] = subscription

        let opts :mqtt.IClientSubscribeOptions = {
            qos:1,
        }
        this.mcl.subscribe(address, opts)

        return subscription
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