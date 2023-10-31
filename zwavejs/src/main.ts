#!/usr/bin/env node
import "./lib/hubapi.js";
import {env, exit} from "process";
import {HubClient, NewHubClient} from "@hivelib/hubclient/HubClient"
import {loadCerts, parseCommandlineConfig} from "./BindingConfig.js";
import {ZwaveJSBinding} from "./ZWaveJSBinding.js";
import path from "path";
import {locateHub} from "@hivelib/hubclient/locateHub";
import fs from "fs";


async function main() {

//--- Step 1: load config
    const BINDING_NAME = "zwavejs"
// optional override or preset of gateway on first use
    let appConfig = parseCommandlineConfig(BINDING_NAME)
    // FIXME: use bindingID from config
    let [clientCertPem, clientKeyPem, caCertPem] = loadCerts(BINDING_NAME, appConfig.certsDir)
    // When running from a pkg'ed binary, zwavejs must have a writable copy for device config. Use the cache folder
    // if set in app config.
    console.log("cache dir=", appConfig.cacheDir)
    if (appConfig.cacheDir) {
        let hasEnv = env.ZWAVEJS_EXTERNAL_CONFIG
        if (!hasEnv || hasEnv == "") {
            env.ZWAVEJS_EXTERNAL_CONFIG = path.join(appConfig.cacheDir, "config")
        }
    }

//--- Step 2: Connect to the Hub
    let clientID = appConfig.agentID
    let keyPath = path.join(appConfig.certsDir,clientID+".key")
    let tokenPath = path.join(appConfig.certsDir,clientID+".token")
    let serKey = fs.readFileSync(keyPath).toString()
    let token = fs.readFileSync(tokenPath).toString()

    let core = ""
    if (!appConfig.hubURL) {
        let uc = await locateHub()
        appConfig.hubURL = uc.hubURL
        core = uc.core
    }
    let hc = NewHubClient(appConfig.hubURL,clientID,caCertPem,core)
    await hc.connectWithToken(serKey,token)

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