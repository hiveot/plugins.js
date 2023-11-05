
// MqttTransport
import {IHubTransport, ISubscription} from "../IHubTransport.js";
import * as mqtt from 'mqtt';
import * as os from "os";
import {IHiveKeys} from "@hivelib/keys/IHiveKeys.js";
import {ECDSAKeys} from "@keys/ECDSAKeys.js";
import {Subscription} from "@hivelib/hubclient/transports/mqtttransport/Subscription.js";


export class MqttTransport implements IHubTransport{
    // expect mqtt://addr:port/
    fullURL:string
    clientID:string
    caCertPem:string
    instanceID:string = ""
    inboxTopic:string=""
    myKeys:IHiveKeys
    // https://github.com/mqttjs/MQTT.js/
    mcl: mqtt.MqttClient|null=null

    // map of correlationID to handler receiving a reply or timeout error
    // TODO: expire correlation IDs after X seconds
    requestHandlers: {[index:string]: (reply: string)=>void};

    // map of subscription ID to subscriptions
    subscriptions:Array<Subscription>;

    constructor(fullURL:string,clientID:string,caCertPem:string) {
        this.fullURL=fullURL
        this.clientID=clientID
        this.caCertPem=caCertPem
        this.myKeys = new ECDSAKeys()
        this.requestHandlers = {}
        this.subscriptions = new Array<Subscription>()
    }

    public addressTokens(): {sep:string, wc:string, rem: string} {
        return {sep:"/", wc:"+", rem:"#"}
    }

    public async connectWithPassword(password: string): Promise<void> {
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
        this.mcl.on("error", (err)=>{
            console.error("error: ",err)
        })

        // subscribe to inbox
        this.inboxTopic = "_INBOX/"+this.instanceID
        this.mcl.subscribe(this.inboxTopic)
        return
    }

    public connectWithToken(serializedKP: string, token: string): Promise<void> {
        // TODO: encrypt token with server public key so a MIM won't be able to get the token
        return this.connectWithPassword(token)
    }

    public createKeyPair(): {privPEM:string, pubPEM:string} {
        this.myKeys.createKey()
        let privPEM = this.myKeys.exportPrivateToPEM()
        let pubPEM = this.myKeys.exportPrivateToPEM()
        return {privPEM,pubPEM}
    }

    public disconnect():void {
        if (this.mcl != null) {
            this.mcl.end()
            this.mcl = null
        }
    }

    // handle incoming mqtt message
    onMessage(topic: string, payload: Buffer, packet: mqtt.IPublishPacket): void {
        // lookup the topic subscription
        for (let i=0; i < this.subscriptions.length; i++) {
            let s = this.subscriptions[i]
            if ((s.topic == topic) && !(!s.handler)) {
                // fixme: split requests from events???
                let reply = s.handler(packet)
            }
        }
    }

    public set onConnect(handler: ()=>void) {
        if (this.mcl) {
            this.mcl.on("connect", handler)
            this.mcl.on("reconnect", handler)
        }
    }

    public set onDisconnect(handler: ()=>void) {
        if (this.mcl) {
            this.mcl.on("disconnect", handler)
        }
    }

    public async pub(address: string, payload: string): Promise<void> {
        if (this.mcl) {
             this.mcl.publish(address, payload)
        }
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
            let messageId = this.mcl?this.mcl.publish(
                address, payload, opts, (err) => {
                    if(err){
                        console.log(err)
                        reject()
                        throw(err)
                    }else{
                        console.log('Request Message Sent: ', messageId)
                    }
                }):"";
            // FIXME: should requestHandlers invoke the resolve method?
            // FIXME: how is reject passed?
            // the promise resolves when a reply is received or rejects on timeout
            this.requestHandlers[cID] = resolve
        })
        return p
    }

    // subscribe to a topic
    public sub(topic: string,
               handler: (topic:string,data:string)=>void):ISubscription {
        // mqtt.js doesn't support subscription specific callbacks so we need to
        // build a subscription list and handle it ourselves.

        let replyHandler = (request: mqtt.IPublishPacket):void=> {
            handler(request.topic, request.payload.toString())
        }
        let subscription = new Subscription(
           topic, replyHandler, this.unsubscribe);

        this.subscriptions.push(subscription)

        let opts :mqtt.IClientSubscribeOptions = {
            qos:1,
            properties:{
                subscriptionIdentifier: subscription.subscriptionID,
            },
        }
        if (!this.mcl) {
            throw("no server connection");
        }
        this.mcl.subscribe(topic, opts, (err, granted) => {
            // remove registration if subscription fails
            if (err) {
                console.error("sub failed: " + err);
                this.subscriptions.pop();
            } else {
                // all good
            }
        })
        return subscription;
    }

    // subRequest subscribes to a request and sends the reply to the reply-to address
    // in the request. This requires MQTT 5.
    public subRequest(address: string,
               requestHandler: (addr: string, payload: string)=> string): ISubscription {

        let opts :mqtt.IClientSubscribeOptions = {
            qos:1,
        }
        if (!this.mcl) {
            throw("no server connection");
        }
        this.mcl.subscribe(address, opts)

        // handling this request differs in that the result is sent back to
        // the sender on its reply-to inbox address

        // the reply handler invokes the request handler and sends
        // response as a reply.
        let replyHandler = (request: mqtt.IPublishPacket):void=>{
            let replyData = ""
            let replyErr: Error|null = null
            try {
                // first invoke the handler and get a reply
                // if the handler blows up then send an error reply
                replyData = requestHandler(request.topic, request.payload.toString())
            } catch (err:any) {
                console.error("subRequest exception: "+err)
                replyErr = err
            }

            // enforce user properties
            let userProp = request.properties?.userProperties||{}
            let replyOpts:mqtt.IClientPublishOptions = {
                qos:1,
                retain:false,
                properties: {
                    // if correlationData is missing then bye bye
                    correlationData: request.properties?.correlationData,
                    userProperties: userProp,
                    contentType: request.properties?.contentType,
                    messageExpiryInterval: request.properties?.messageExpiryInterval,
                }
            }
            if (replyErr) {
                userProp["error"] = replyErr.toString()
            }
            // publish the reply to the response topic
            let responseTopic = request.properties?.responseTopic
            let correlationID = request.properties?.correlationData
            // if correlationData or reply-to address are missing then there is no reply
            if (!!correlationID && !!responseTopic && this.mcl) {
                this.mcl.publish(responseTopic, replyData, replyOpts)
            }
        };
        let subscription = new Subscription(address, replyHandler, this.unsubscribe)

        this.subscriptions.push(subscription)


        return subscription
    }
unsubscribe(sub:Subscription) {
    // not expecting many subscriptions here so this is fast enough
    for (let i =0; i < this.subscriptions.length; i++) {
        let s = this.subscriptions[i];

        if (s.topic == sub.topic) {
            if (this.mcl) {
                this.mcl.unsubscribe(s.topic);
            }
            delete this.subscriptions[i];
            break
        }
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