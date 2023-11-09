// mqtt and nats transport testing

import { MqttTransport } from "@hivelib/hubclient/transports/mqtttransport/MqttTransport";
import {env, exit} from "process";
import * as process from "process";

let tp: MqttTransport

async function test1() {

    process.on("uncaughtException",(err:any)=>{
        console.error("uncaughtException",err)
    })

    const testClient = "test"
    const testPass = "testpass"
    let caCertPEM = ""
    //running instance
    tp =new MqttTransport("mqtts://127.0.0.1:8883",testClient,caCertPEM)

    await tp.connectWithPassword(testPass)

    console.log("publishing hello world")
    await  tp.pub("event/test/testthing/event1/test","hello world")

    // tp.sub("event/test/#",(ev)=>{
    //     console.log("rx ev",ev)
    // })

    console.log("publishing hello world2")
    await  tp.pub("event/test/testthing/event2/test","hello world2")

    await waitForSignal()

    await new Promise(resolve => setTimeout(resolve, 5000));

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
    } catch(e) {
        console.error("Error: ",e)
    }

}

test1()