import { ECDSAKey } from "@hivelib/keys/ECDSAKey";
import { IHiveKey } from "@hivelib/keys/IHiveKey";
import { IHubTransport } from "../IHubTransport";

export class NatsTransport implements IHubTransport {
    // expect nats://addr:port/ 
    fullURL: string
    clientID: string
    caCertPem: string
    instanceID: string = ""

    // application handler of connection status change
    connectHandler: null | ((connected: boolean, err: Error) => void) = null;
    // application handler of incoming messages
    messageHandler: null | ((topic: string, payload: string) => void) = null;
    // application handler of incoming request-response messages
    requestHandler: null | ((topic: string, payload: string) => string) = null;


    constructor(
        fullURL: string, clientID: string, caCertPem: string) {

        this.fullURL = fullURL
        this.clientID = clientID
        this.caCertPem = caCertPem
    }


    public addressTokens(): { sep: string, wc: string, rem: string } {
        return { sep: ".", wc: "*", rem: ">" }
    }

    // connect and subscribe to the inbox
    public async connectWithPassword(password: string): Promise<void> {
        // TODO
        return
    }


    public async connectWithToken(key: IHiveKey, token: string): Promise<void> {
        // TODO: encrypt token with server public key so a MIM won't be able to get the token
        return this.connectWithPassword(token)
    }

    // the nats transport uses nkey keys
    public createKeyPair(): IHiveKey {
        // TODO: use nkeys
        let kp = new ECDSAKey().initialize()
        return kp
    }

    public disconnect(): void {
        // TODO: 
    }


    public async pubEvent(address: string, payload: string): Promise<void> {
        // TODO
        return
    }



    public async pubRequest(address: string, payload: string): Promise<string> {
        // TODO
        return ""
    }


    // Set the callback of connect/disconnect updates
    public setConnectHandler(handler: (connected: boolean, err: Error | null) => void) {
        this.connectHandler = handler
    }

    // Set the handler of incoming messages
    public setEventHandler(handler: (topic: string, payload: string) => void) {
        this.messageHandler = handler
    }

    // Set the handler of incoming requests-response calls.
    // The result of the handler is sent as a reply.
    // Intended for handling actions and RPC requests.
    public setRequestHandler(handler: (topic: string, payload: string) => string) {
        this.requestHandler = handler
    }

    // subscribe to a NATS subject
    public async subscribe(topic: string): Promise<void> {
        // TODO
    }


    public unsubscribe(address: string) {
        // TODO
    }
}