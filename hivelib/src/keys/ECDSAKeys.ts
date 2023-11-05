
// ECDSA keys implementation using nodeJS
import {IHiveKeys} from "@hivelib/keys/IHiveKeys.js";
import crypto from "crypto";

export class ECDSAKeys implements IHiveKeys{
    privKey: crypto.KeyObject | undefined
    pubKey: crypto.KeyObject | undefined

    constructor() {
    }

    // createKey create a new public and private ecdsa or ed25519 key pair.
    // ecdsa equates to secp256k1
    public createKey():void|Promise<void>{
            let kp = crypto.generateKeyPairSync("ec", {
                namedCurve: "secp256k1"
            })
            this.privKey = kp.privateKey
            this.pubKey = kp.publicKey
    }

    // importPrivateFromPEM reads the key-pair from the PEM private key
    // This throws an error if the PEM is not a valid key
    public importPrivateFromPEM(privatePEM:string):void{
        // cool! crypto does all the work
        this.privKey = crypto.createPrivateKey(privatePEM)
        this.pubKey = crypto.createPublicKey(privatePEM)
    }

    // importPublicFromPEM reads the public key from the PEM data.
    // This throws an error if the PEM is not a valid public key
    public importPublicFromPEM(publicPEM:string):void{
        this.pubKey = crypto.createPublicKey(publicPEM)
    }

    // exportPrivateToPEM returns the PEM encoded private key if available
    public exportPrivateToPEM():string{
        if (!this.privKey) {
            throw("private key not created or imported")
        }
        let privPEM =  this.privKey.export( {
            format:"pem", // pem, der or jwk
            type:"pkcs8",  // or sec1
        })
        return privPEM.toString()
    }

    // exportPublicToPEM returns the PEM encoded public key if available
    public exportPublicToPEM(): string {
        if (!this.pubKey) {
            throw("public key not created or imported")
        }
        let pubPEM =  this.pubKey.export( {
            format:"pem", // pem, der or jwk
            type:"spki",
        })
        return pubPEM.toString()
    }

    // return the signature of a message signed using this key
    // this requires a private key to be created or imported
    public sign(message:Buffer):Buffer {
        if (!this.privKey) {
            throw("private key not created or imported")
        }
        let sigBuf = crypto.sign("sha256",message,this.privKey)
        return sigBuf
    }

    // verify the signature of a message using this key's public key
    // this requires a public key to be created or imported
    // returns true if the signature is valid for the message
    public verify(signature:Buffer, message:Buffer):boolean {
        if (!this.pubKey) {
            throw("public key not created or imported")
        }
        let isValid = crypto.verify("sha256",message,this.pubKey,signature)
        return isValid
    }
}
