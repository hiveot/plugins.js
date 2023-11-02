// ZWaveJSBinding.ts holds the entry point to the zwave binding along with its configuration
import type {TranslatedValueID, ZWaveNode} from "zwave-js";
import {InterviewStage} from "zwave-js";
import {parseNode} from "./parseNode.js";
import {ParseValues} from "./ParseValues.js";
import {ZWAPI} from "./ZWAPI.js";
import {HubClient} from "@hivelib/hubclient/HubClient";
import {parseController} from "./parseController.js";
import {logVid} from "./logVid.js";
import {getPropID} from "./getPropID.js";
import {ActionTypes, EventTypes, PropTypes} from "@hivelib/vocab/vocabulary";
import type {IBindingConfig} from "./BindingConfig.js";
import fs from "fs";
import {ThingValue} from "@hivelib/things/ThingValue";


// ZWaveBinding maps ZWave nodes to Thing TDs and events, and handles actions to control node inputs.
export class ZwaveJSBinding {
    // id: string = "zwave";
    hc: HubClient;
    zwapi: ZWAPI;
    // the last received values for each node by deviceID
    lastValues = new Map<string, ParseValues>(); // nodeId: ValueMap
    // the last published values for each node by deviceID
    // publishedValues = new Map<string, ParseValues>();
    vidCsvFD: number | undefined
    // only publish events when a value has changed
    publishOnlyChanges: boolean = false
    config: IBindingConfig


    // @param hapi: connectd Hub API to publish and subscribe
    // @param vidLogFile: optional csv file to write discovered VID and metadata records
    constructor(hc: HubClient, config: IBindingConfig) {
        this.hc = hc;
        this.config = config
        // zwapi handles the zwavejs specific details
        this.zwapi = new ZWAPI(
            this.handleNodeUpdate.bind(this),
            this.handleValueUpdate.bind(this),
            this.handleNodeStateUpdate.bind(this),
        );
    }

    handleActionRequest(tv: ThingValue): string {
            let actionLower = tv.name.toLowerCase()
            let targetNode: ZWaveNode | undefined
            let node = this.zwapi.getNodeByDeviceID(tv.thingID)
            if (node == undefined) {
                console.error("handleActionRequest: ZWave node for thingID", tv.thingID,"does not exist")
                return ""
            }
            console.info("action:" + tv.name)
            // controller specific commands (see parseController)
            switch (actionLower) {
                case "begininclusion":
                    this.zwapi.driver.controller.beginInclusion().then()
                    break;
                case "stopinclusion":
                    this.zwapi.driver.controller.stopInclusion().then()
                    break;
                case "beginexclusion":
                    this.zwapi.driver.controller.beginExclusion().then()
                    break;
                case "stopexclusion":
                    this.zwapi.driver.controller.stopExclusion().then()
                    break;
                case "beginhealingnetwork":
                    this.zwapi.driver.controller.beginHealingNetwork()
                    break;
                case "stophealingnetwork":
                    this.zwapi.driver.controller.stopHealingNetwork()
                    break;
                case "getNodeNeighbors": // param nodeID
                    targetNode = this.zwapi.getNodeByDeviceID(tv.thingID)
                    if (targetNode) {
                        this.zwapi.driver.controller.getNodeNeighbors(targetNode.id).then();
                    }
                    break;
                case "healNode": // param nodeID
                    targetNode = this.zwapi.getNodeByDeviceID(tv.thingID)
                    if (targetNode) {
                        this.zwapi.driver.controller.healNode(targetNode.id).then();
                    }
                    break;
                case "removeFailedNode": // param nodeID
                    targetNode = this.zwapi.getNodeByDeviceID(tv.thingID)
                    if (targetNode) {
                        this.zwapi.driver.controller.removeFailedNode(targetNode.id).then();
                    }
                    break;
                // Special management actions that are accessible by writing configuration updates that are not VIDs
                // case PropTypes.Name.toLowerCase():  // FIXME: what is this. set name ???
                //     node.name = params;
                //     break;
                case "checklifelinehealth":
                    node.checkLifelineHealth().then()
                    break;
                case ActionTypes.Ping.toLowerCase():
                    node.ping().then((success) => {
                        this.hc.pubEvent(tv.thingID, ActionTypes.Ping, success ? "success" : "fail")
                    })
                    break;
                case "refreshinfo":
                    // do not use when node interview is not yet complete
                    if (node.interviewStage == InterviewStage.Complete) {
                        node.refreshInfo({waitForWakeup: true}).then()
                    }
                    break;
                case  "refreshvalues":
                    node.refreshValues().then()
                    break;
                default:
                    // VID based configuration and actions
                    //  currently propertyIDs are also accepted.
                    for (let vid of node.getDefinedValueIDs()) {
                        let propID = getPropID(vid)
                        if (propID.toLowerCase() == actionLower) {
                            this.zwapi.setValue(node, vid, tv.data)
                            break;
                        }
                    }
            }
        return ""
    }

    // Handle update of one of the node state flags
    // This emits a corresponding event
    handleNodeStateUpdate(node: ZWaveNode, newState: string) {
        let thingID = this.zwapi.getDeviceID(node.id)

        // NOTE: the names of these events and state MUST match those in the TD event enum. See parseNode.
        switch (newState) {
            case "alive":
            case "dead":
            case "awake":
            case "sleeping": {
                this.hc.pubEvent(thingID, EventTypes.Status, newState)
            }
                break;
            case "interview completed":
            case "interview failed":
            case "interview started": {
                this.hc.pubEvent(thingID, "interview", newState)
            }
                break;
        }
    }

    // Handle discovery or update of a node.
    // This publishes the TD and its property values
    handleNodeUpdate(node: ZWaveNode) {
        console.log("handleNodeUpdate:node:", node.id);
        let thingTD = parseNode(this.zwapi, node, this.vidCsvFD, this.config.maxNrScenes);

        if (node.isControllerNode) {
            parseController(thingTD, this.zwapi.driver.controller)
        }
        // republish the TD and its values
        this.hc.pubTD(thingTD)

        let newValues = new ParseValues(node);
        let lastNodeValues = this.lastValues.get(thingTD.id)
        let diffValues = newValues
        if (lastNodeValues) {
            diffValues = lastNodeValues.diffValues(newValues)
        }
        this.hc.pubProperties(thingTD.id, diffValues.values)
        this.lastValues.set(thingTD.id, newValues);

    }

    // Handle update of a node's value.
    // This publishes an event if the value changed or 'publishOnlyChanges' is false
    // @param node: The node whos values have updated
    // @param vid: zwave value id
    // @param newValue: the updated value
    handleValueUpdate(node: ZWaveNode, vid: TranslatedValueID, newValue: unknown) {
        let deviceID = this.zwapi.getDeviceID(node.id)
        let propID = getPropID(vid)
        let valueMap = this.lastValues.get(deviceID);
        // update the map of recent values
        let lastValue = valueMap?.values[propID]
        if (valueMap && (lastValue !== newValue || !this.publishOnlyChanges)) {
            valueMap.values[propID] = newValue
            //
            let serValue = JSON.stringify(newValue)
            this.hc.pubEvent(deviceID, propID, serValue)
        }
    }

    // periodically publish the properties that have updated
    // publishPropertyUpdates() {
    //     for (let [deviceID, valueMap] of this.lastValues) {
    //         let node = this.zwapi.getNodeByDeviceID(deviceID)
    //         if (node) {
    //             let publishedValues = this.publishedValues.get(deviceID)
    //             let diffValues = publishedValues ? valueMap.diffValues(publishedValues) : valueMap;
    //             this.hapi.pubProperties(deviceID, diffValues)
    //         } else {
    //             // node no longer exist. Remove it.
    //             this.lastValues.delete(deviceID)
    //         }
    //     }
    // }

    // subscribe to actions
     subActions() {
         let sub = this.hc.subActions("", this.handleActionRequest)
    }

    // Starts and run the binding. This does not return until Stop is called.
    // address of the Hub API.
    async start() {
        console.log("startup");

        // optional logging of discovered VID
        if (this.config.vidCsvFile) {
            this.vidCsvFD = fs.openSync(this.config.vidCsvFile, "w+", 0o640)
            logVid(this.vidCsvFD)
        }
        this.subActions()
        // await this.hapi.subConfig(this.handleConfig)
        await this.zwapi.connect(this.config);
    }

    // Stop the binding and disconnect from the ZWave controller
    async stop() {
        console.log("Shutting Down...");
        await this.zwapi.disconnect();
        if (this.vidCsvFD) {
            fs.close(this.vidCsvFD)
        }
        process.exit(0);
    }
}