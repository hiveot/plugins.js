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
    console.log("hello")
    //--- Step 1: load config
    let clientID = "zwavejs-" + os.hostname
    let appConfig = new BindingConfig(clientID)


    //--- temp for development. move to yaml
    // appConfig.clientID = "test"
    // appConfig.clientToken = "testpass"
    // appConfig.S2_AccessControl
    // appConfig.S2_Unauthenticated = "610c372ac0d54f5695829c1a676792f9"
    // appConfig.S2_Authenticated = "27c6abe46b61f9037f70071b283bae7a"
    // appConfig.S2_AccessControl = "322b716ab9784f336746722037b41cbe"
    // appConfig.S2_Legacy = "3919AC57ECB692D7A84E36F39196F765"
    // appConfig.hubURL = "mqtts://localhost:8883"
    //---

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
    let core = ""
    if (!appConfig.hubURL) {
        let uc = await locateHub()
        appConfig.hubURL = uc.hubURL
        core = uc.core
    }
    let hc = NewHubClient(appConfig.hubURL, appConfig.loginID, appConfig.caCertPEM, core)

    // need a key to connect, load or create it
    // note that the HubClient determines the key type
    let kp = hc.createKeyPair()
    if (appConfig.clientKey) {
        kp.importPrivate(appConfig.clientKey)
    } else {
        fs.writeFileSync(appConfig.keyFile, kp.exportPrivate())
    }
    await hc.connectWithToken(kp, appConfig.loginToken)

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