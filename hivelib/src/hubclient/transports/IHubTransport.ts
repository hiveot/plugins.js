// ISubscription interface to underlying subscription mechanism
import {IHiveKey} from "@keys/IHiveKey";

export interface ISubscription {
    unsubscribe():void;
}


// IHubTransport defines the interface of the message bus transport used by
// the hub client.
export interface IHubTransport{
    // addressTokens returns the address separator and wildcard tokens used by the transport
    // @result sep is the address separator. eg "." for nats, "/" for mqtt and redis
    // @result wc is the address wildcard. "*" for nats, "+" for mqtt
    // @result rem is the address remainder. "" for nats; "#" for mqtt
    addressTokens(): {sep:string, wc:string, rem: string};

    // ConnectWithPassword connects to the messaging server using password authentication.
    // @param loginID is the client's ID
    // @param password is created when registering the user with the auth service.
    connectWithPassword(password: string): Promise<void>;

    // ConnectWithToken connects to the messaging server using an authentication token
    // and pub/private keys provided when creating an instance of the hub client.
    // @param key is the key generated with createKey.
    // @param token is created by the auth service.
    connectWithToken(key: IHiveKey, token: string): Promise<void>;

    // CreateKeyPair returns a new key for authentication and signing
    // @returns key contains the public/private key pair
    // @returns pubEnc contains the encoded public key
    createKeyPair(): IHiveKey;

    // Disconnect from the message bus
    disconnect():void;

    // set handler for tracking connections
    setOnConnect( handler:()=>void): void;

    setOnDisconnect( handler:()=>void): void;

    // Pub for publications on any address
    // @param address to publish on
    // @param payload with serialized message to publish
    pub(address: string, payload: string): Promise<void>;

    // PubRequest publishes an RPC request and waits for a response.
    // @param address to publish on
    // @param payload with serialized message to publish
    // @returns reply with serialized response message
    pubRequest(address: string, payload: string): Promise<string>;

    // Sub for subscribing to an address.
    // @param address to subscribe to (using addressTokens to construct)
    // @param cb is the callback to invoke when a message is received
    // @returns subscription object that needs to be unsubscribed when done
    sub(address: string, cb: (addr: string, data: string)=>void): ISubscription;

    // SubRequest subscribes to RPC requests and sends the reply to the sender
    // Intended for services.
    //
    // @param address to subscribe to (using addressTokens to construct)
    // @param cb is the callback to invoke when a message is received
    // @returns subscription object that needs to be unsubscribed when done
    subRequest(address: string,
               cb: (addr: string, payload: string)=> string): ISubscription;
}
