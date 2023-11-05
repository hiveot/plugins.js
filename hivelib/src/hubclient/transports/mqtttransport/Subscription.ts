import {ISubscription} from "@hivelib/hubclient/transports/IHubTransport.js";
import {IPublishPacket} from "mqtt";

export class Subscription implements ISubscription {
    topic:string
    handler:  {(msg: IPublishPacket):any}
    unsubscribeHandler: {(sub:Subscription):void}
    subscriptionID: number = 0
    constructor(
        topic:string,
        handler: {(msg: IPublishPacket):string|void},
        unsubscribeHandler:{(sub:Subscription):void} )
    {
        this.topic = topic
        this.handler = handler
        this.unsubscribeHandler = unsubscribeHandler
        this.subscriptionID = Date.now().valueOf() + Math.random();
    }
    unsubscribe() {
        if (this.unsubscribeHandler) {
            this.unsubscribeHandler(this)
        }
    }
}
