// ISubscription interface to underlying subscription mechanism
import { IHiveKey } from "@keys/IHiveKey";

export interface ISubscription {
    unsubscribe(): void;
}


// IHubTransport defines the interface of the message bus transport used by
// the hub client.
export interface IHubTransport {
    // addressTokens returns the address separator and wildcard tokens used by the transport
    // @result sep is the address separator. eg "." for nats, "/" for mqtt and redis
    // @result wc is the address wildcard. "*" for nats, "+" for mqtt
    // @result rem is the address remainder. "" for nats; "#" for mqtt
    addressTokens(): { sep: string, wc: string, rem: string };

    // ConnectWithPassword connects to the messaging server using password authentication.
    // @param loginID is the client's ID
    // @param password is created when registering the user with the auth service.
    connectWithPassword(password: string): Promise<void>;

    // ConnectWithToken connects to the messaging server using an authentication token
    // and pub/private keys provided when creating an instance of the hub client.
    // @param key is the key generated with createKey.
    // @param token is created by the auth service.
    connectWithToken(key: IHiveKey, token: string): Promise<void>;

    // CreateKeyPair returns a new key for authentication and signing.
    // @returns key contains the public/private key pair.
    createKeyPair(): IHiveKey;

    // Disconnect from the message bus.
    disconnect(): void;

    // Pub for publications on any address and returns immediately.
    // @param address to publish on
    // @param payload with serialized message to publish
    pub(address: string, payload: string): Promise<void>;

    // PubRequest publishes an RPC request and waits for a response.
    // @param address to publish on
    // @param payload with serialized message to publish
    // @returns reply with serialized response message
    pubRequest(address: string, payload: string): Promise<string>;

    // set handler that is notified of changes in connection status and an error in 
    // case of an  unintentional disconnect.
    // 
    // This handler is intended for updating presentation of the connection status.
    // Do not call connectXyz() in this handler, as a reconnect attempt will be made 
    // after a short delay. If a connection is re-established then the onConnect
    // handler will be invoked.
    //
    //  connected is true if a connection is established or false if disconnected.
    //  err contains the error in case of an unintentional disconnect. It is null
    //   if the disconnect is intentional, eg a clal to disconnect() was made.
    //
    // If a reconnect is to take place with a different password or token then 
    // call disconnect(), followed by connectWithXyz().
    set onConnect(handler: (connected: boolean, err: Error | null) => void)


    // Set the handler for incoming event-type messages.
    //
    set onMessage(handler: (addr: string, payload: string) => void)

    // Set the handler for incoming request-response message.
    //
    // The result of the handler will be sent as a reply.
    // This requires MQTT v5.
    set onRequest(handler: (addr: string, payload: string) => string)

    // Add the subscription of a given address.
    // The message or request handler will be invoked when a message on this
    // address is received.
    // @param address to add to subscriptions
    subscribe(address: string): Promise<void>;

    // unsubscribe removes the address from the subscription list
    // @param address to remove from subscriptions
    unsubscribe(address: string): void;
}
