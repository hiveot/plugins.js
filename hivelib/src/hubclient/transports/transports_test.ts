// mqtt and nats transport testing

import { MqttTransport } from "@hivelib/hubclient/transports/mqtttransport/MqttTransport";
import { env, exit } from "process";
import * as process from "process";

let tp: MqttTransport

async function test1() {
    let lastMsg = ""
    process.on("uncaughtException", (err: any) => {
        console.error("uncaughtException", err)
    })

    const testClient = "test"
    const testPass = "testpass"
    let caCertPEM = ""
    //running instance
    tp = new MqttTransport("mqtts://127.0.0.1:8883", testClient, caCertPEM)

    tp.onMessage = (topic: string, payload: string) => {
        console.log("onMessage:", topic)
        lastMsg = payload
    }
    tp.onRequest = (topic: string, payload: string) => {
        console.log("onRequest:", topic)
        lastMsg = payload
        return payload
    }

    await tp.connectWithPassword(testPass)
    await tp.subscribe("event/+/+/#")

    console.log("publishing hello world")
    await tp.pub("event/test/testthing/event1/test", "hello world")

    await waitForSignal()

    console.log("publishing hello world2")
    let reply = await tp.pubRequest("event/test/testthing/event2/test", "hello world2")
    if (reply != "hello world2") {
        console.error("wrong reply received")
    } else {
        console.log("SUCCESS!, received reply")
    }

    if (lastMsg == "") {
        console.error("no message received")
    }
    await new Promise(resolve => setTimeout(resolve, 1200000));

    console.log("Disconnecting...")
    tp.disconnect()
}

async function waitForSignal() {

    //--- Step 4: Wait for  SIGINT or SIGTERM signal to stop
    console.log("Ready. Waiting for signal to terminate")
    try {
        for (const signal of ["SIGINT", "SIGTERM"]) {

            await process.on(signal, async () => {
                console.log("signal received!: ", signal)
                await tp.disconnect();
                exit(0);
            });
        }
    } catch (e) {
        console.error("Error: ", e)
    }

}

test1()