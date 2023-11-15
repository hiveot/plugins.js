import type { IZWaveConfig } from "./ZWAPI.js";
import fs from "fs";
import crypto from "crypto";
import path from "path";
import os from "os";
import { NodeEnvironment } from "@hivelib/appenv/NodeEnvironment.js";
import { homedir } from 'os';


// This binding's service configuration  
export class BindingConfig extends NodeEnvironment implements IZWaveConfig {
    // zwave keys
    S2_Unauthenticated: string = ""
    S2_Authenticated: string = ""
    S2_AccessControl: string = ""
    S2_Legacy: string = ""
    //
    zwPort: string | undefined          // controller port: ""=auto, /dev/ttyACM0, ...
    zwLogFile: string | undefined       // driver logfile if any
    // driver log level, "" no logging
    zwLogLevel: "error" | "warn" | "info" | "verbose" | "debug" | "" = "warn"
    //
    cacheDir: string | undefined          // alternate storage directory
    //

    // logging of discovered value IDs to CSV. Intended for testing
    vidCsvFile: string | undefined

    // maximum number of scenes. Default is 10.
    // this reduces it from 255 scenes, which produces massive TD documents.
    // For the case where more than 10 is needed, set this to whatever is needed.
    maxNrScenes: number = 10

    constructor(clientID: string) {
        let homeDir = ""
        let withFlags = true
        super(clientID, homeDir, withFlags)
    }
}



// Generate and a default configuration yaml file for the binding.
export function saveDefaultConfig(
    configPath: string, bindingName: string, gateway: string, certsDir: string, logsDir: string, cacheDir: string) {

    let bindingID = bindingName + "-" + os.hostname()
    let ConfigText = "# HiveOT " + bindingName + " binding configuration file\n" +
        "# Generated: " + new Date().toString() + "\n" +
        "\n" +
        "# Binding ID used for publications. \n" +
        "# Multiple instances must use different IDs. Default is binding-hostname\n" +
        "agentID: " + bindingID + "\n" +
        "\n" +
        "# Gateway connection protocol, address, port. Default is automatic\n" +
        "#gateway: wss://127.0.0.1:9884/ws\n" +
        "\n" +
        "# Optionally write discovered value ID's to a csv file. Intended for troubleshooting.\n" +
        "#vidCsvFile: " + path.join(logsDir, "zwinfo.csv") + "\n" +
        "\n" +
        "# ZWave S2 security keys. 16 Byte hex strings\n" +
        "# Keep these secure to protect your network:\n" +
        "S2_Unauthenticated: " + crypto.randomBytes(16).toString("hex") + "\n" +
        "S2_Authenticated: " + crypto.randomBytes(16).toString("hex") + "\n" +
        "S2_AccessControl: " + crypto.randomBytes(16).toString("hex") + "\n" +
        "S2_Legacy: " + crypto.randomBytes(16).toString("hex") + "\n" +
        "\n" +
        "# Serial port of ZWave USB controller. Default is automatic.\n" +
        "#zwPort: /dev/ttyACM0\n" +
        "\n" +
        "# Optional logging of zwavejs driver\n" +
        "# error, warn, http, info, verbose, or debug\n" +
        "#zwLogFile: " + path.join(logsDir, "zwavejs-driver.log") + "\n" +
        "zwLogLevel: warn\n" +
        "\n" +
        "# Location where the ZWavejs driver stores its data\n" +
        "cacheDir: " + path.join(cacheDir, bindingName) + "\n" +
        "\n" +
        "# Limit max nr of scenes to reduce TD document size. Default is 10\n" +
        "#maxNrScenes: 10\n"
    fs.writeFileSync(configPath, ConfigText, { mode: 0o644 })
}
