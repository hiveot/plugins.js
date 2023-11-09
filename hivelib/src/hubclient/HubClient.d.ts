import type { ThingTD } from '../things/ThingTD.js';
import { IHubTransport, ISubscription } from "./transports/IHubTransport.js";
import { ThingValue } from "../things/ThingValue.js";
import { IHiveKey } from "@keys/IHiveKey";
export declare class HubClient {
    tp: IHubTransport;
    cid: string;
    isInitialized: boolean;
    status: 'disconnected' | 'authenticated' | 'connected';
    statusMessage: string;
    constructor(transport: IHubTransport, clientID: string);
    _makeAddress(msgType: string, agentID: string, thingID: string, name: string, clientID: string): string;
    _splitAddress(addr: string): {
        msgType: string;
        agentID: string;
        thingID: string;
        name: string;
        senderID: string;
        err: Error | null;
    };
    get clientID(): string;
    get connectionStatus(): {
        status: string;
        message: string;
    };
    connectWithToken(kp: IHiveKey, jwtToken: string): Promise<void>;
    connectWithPassword(password: string): Promise<void>;
    connectionStatusHandler(isConnected: boolean): void;
    createKeyPair(): IHiveKey;
    disconnect(): Promise<void>;
    pubAction(agentID: string, thingID: string, name: string, payload: string): Promise<string | null>;
    pubEvent(thingID: string, eventName: string, payload: string): Promise<void>;
    pubProperties(thingID: string, props: {
        [key: string]: any;
    }): Promise<void>;
    pubRPCRequest(agentID: string, capability: string, methodName: string, req: any): Promise<any>;
    pubTD(td: ThingTD): Promise<void>;
    subActions(thingID: string, handler: (msg: ThingValue) => string): Promise<ISubscription | null>;
    subEvents(agentID: string, thingID: string, eventID: string, handler: (msg: ThingValue) => void): Promise<ISubscription | null>;
}
export declare function NewHubClientFromTransport(transport: IHubTransport, clientID: string): HubClient;
export declare function NewHubClient(url: string, clientID: string, caCertPem: string, core: string): HubClient;
//# sourceMappingURL=HubClient.d.ts.map