// mqtt and nats transport testing

import { NewHubClient } from "@hivelib/hubclient/HubClient";
import process from "node:process";
import { Logger } from "tslog";

const slog = new Logger({ name: "TTT" })

async function test1() {

    process.on("uncaughtException", (err: Error) => {
        console.error("uncaughtException", err)
    })

    const url = "mqtts://127.0.0.1:8883"
    const testClient = "test"
    const testPass = "testpass"
    let caCertPEM = ""
    //running instance
    // tp = new MqttTransport("mqtts://127.0.0.1:8883", testClient, caCertPEM)
    let hc = NewHubClient(url, testClient, caCertPEM)
    await hc.connectWithPassword(testPass)

    slog.info("publishing hello world")
    await hc.pubEvent("testthing", "event1", "hello world")

    // tp.sub("event/test/#",(ev)=>{
    //     console.log("rx ev",ev)
    // })

    slog.info("publishing hello world2")
    await hc.pubEvent("testthing", "event2", "hello world2")

    await waitForSignal()

    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log("Disconnecting...")
    hc.disconnect()
}

async function waitForSignal() {

    //--- Step 4: Wait for  SIGINT or SIGTERM signal to stop
    console.log("Ready. Waiting for signal to terminate")
    try {
        for (const signal of ["SIGINT", "SIGTERM"]) {

            await process.on(signal, async () => {
                console.log("signal received!: ", signal)
                // await hc.disconnect();
                // exit(0);
            });
        }
    } catch (e) {
        console.error("Error: ", e)
    }

}

test1()