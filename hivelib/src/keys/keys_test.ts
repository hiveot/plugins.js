
// test1: generate, export and import an ECDSA key pair

import {ECDSAKeys} from "./ECDSAKeys.js";
import {Ed25519Keys} from "./Ed25519Keys.js";

async function test1() {
    const message = "hello world"

    let keys1 = new Ed25519Keys()
    // let keys1 = new EcdsaKeys()
    keys1.createKey()

    let privPEM = keys1.exportPrivateToPEM()
    let pubPEM = keys1.exportPublicToPEM()

    // let keys2 = new EcdsaKeys()
    let keys2 = new Ed25519Keys()
    keys2.importPrivateFromPEM(privPEM)
    keys2.importPublicFromPEM(pubPEM)

    let msgBuf = Buffer.from(message)
    let signature = keys1.sign(msgBuf)
    let verified =keys2.verify(signature,msgBuf)
    if (!verified) {
        throw("test failed")
    }
    console.log("test successful")
}


test1()