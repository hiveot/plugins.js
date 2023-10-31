import * as elliptic from 'elliptic';
const EC = elliptic.ec;
let ed25519 = new EC('ed25519')

import * as rs from 'jsrsasign';
const rsu = require('jsrasign-util')

// CreateECDSAKeys creates an asymmetric key set.
// See also: https://github.com/indutny/elliptic
// This returns the private key and a base64 encoded public key string.
// see also: https://safecurves.cr.yp.to/
export function createEd25519Keys():{privKey:elliptic.ec.KeyPair, pubKey:string} {
    let kp = ed25519.genKeyPair()

    let pubKey = kp.getPublic().encodeCompressed("hex")
    //
    // let kp = rs.KEYUTIL.generateKeyPair("EC","secp256r1")
    //
    // var prvKey = kp.prvKeyObj;
    // var pubKey = kp.pubKeyObj;
    // var prvKeyPEM, pubKeyPEM;
    //  prvKeyPEM = rs.KEYUTIL.getPEM(prvKey, "PKCS1PRV");
    // pubKeyPEM = rs.KEYUTIL.getPEM(pubKey);
    return {privKey:kp, pubKey:pubKey}
}


// MarshalEd25519 serializes the Ed25519 key for storage.
export function marshalEd25519(privKey:elliptic.ec.KeyPair): string {
    let privEnc = privKey.getPrivate().toString("hex")
    return privEnc
}

// UnmarshalEd25519 deserializes the Ed25519 key and returns a key-pair
export function unmarshalEd25519(encKey:string): elliptic.ec.KeyPair {
    let kp = ed25519.keyFromPrivate(encKey)
    return kp
}


// MarshalEd25519 serializes the Ed25519 key for storage.
export function MarshalEd25519Pub(privKey:elliptic.ec.KeyPair): string {
    let pubEnc = privKey.getPublic().encodeCompressed("hex")
    return pubEnc
}

