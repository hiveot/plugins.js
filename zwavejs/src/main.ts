#!/usr/bin/env node
import { config, env, exit } from "process";
import { NewHubClient } from "@hivelib/hubclient/HubClient"
import { ZwaveJSBinding } from "./ZWaveJSBinding.js";
import path from "path";
import { locateHub } from "@hivelib/hubclient/locateHub";
import fs from "fs";
import { ECDSAKey } from "@hivelib/keys/ECDSAKey";
import { Logger } from "tslog";
import { BindingConfig } from "./BindingConfig";
import * as os from 'os';
const slog = new Logger({ name: "ZWJS" })


async function main() {

    //--- Step 1: load config
    let clientID = "zwavejs-" + os.hostname
    let appConfig = new BindingConfig(clientID)

    // When running from a pkg'ed binary, zwavejs must have a writable copy for device config. 
    // Use the storage folder set in app config.
    slog.info("storage dir", "path", appConfig.storesDir)
    if (appConfig.storesDir) {
        let hasEnv = env.ZWAVEJS_EXTERNAL_CONFIG
        if (!hasEnv || hasEnv == "") {
            env.ZWAVEJS_EXTERNAL_CONFIG = path.join(appConfig.storesDir, "config")
        }
    }

    //--- Step 2: Connect to the Hub
    clientID = appConfig.clientID
    let keyPath = path.join(appConfig.certsDir, clientID + ".key")
    let tokenPath = path.join(appConfig.certsDir, clientID + ".token")
    // let serKey = fs.readFileSync(keyPath).toString()
    let token = fs.readFileSync(tokenPath).toString()
    let myKey = new ECDSAKey().importPrivate(keyPath)

    let core = ""
    if (!appConfig.hubURL) {
        let uc = await locateHub()
        appConfig.hubURL = uc.hubURL
        core = uc.core
    }
    let hc = NewHubClient(appConfig.hubURL, appConfig.clientID, appConfig.caCertPEM, core)
    await hc.connectWithToken(myKey, token)

    //--- Step 3: Start the binding and zwavejs driver
    let binding = new ZwaveJSBinding(hc, appConfig);
    await binding.start();

    //--- Step 4: Wait for  SIGINT or SIGTERM signal to stop
    console.log("Ready. Waiting for signal to terminate")
    for (const signal of ["SIGINT", "SIGTERM"]) {
        process.on(signal, async () => {
            await binding.stop();
            exit(0);
        });
    }
}


main()