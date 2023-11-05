// mqtt and nats transport testing

import {MqttTransport} from "./mqtttransport/MqttTransport.js";

async function test1() {
    const testClient = "client1"
    const testPass = "pass1"
    let caCertPEM = ""
    let tp =new MqttTransport("",testClient,caCertPEM)

    await tp.connectWithPassword(testPass)
    console.log("Connecting")
    console.log("connected:",tp.mcl?.connected)
    tp.disconnect()
    console.log("Disconnecting")
    console.log("connected:",tp.mcl?.connected)
}



test1()