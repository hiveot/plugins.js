
// Interface of standardized key and signature functions.
// Intended to standardize the maze of crypto methods,algorithms and so on.
export interface IHiveKeys {
    // createKey create a new public and private ecdsa or ed25519 key pair
    createKey():void|Promise<void>

    // exportPrivateToPEM returns the encoded private key if available
    // This the encoding depends on the key used.
    //  key type ecdsa, rsa use PEM encoding
    //  key type ed25519 encodes it to base64
    //  key type nkeys encodes when generating its seed
    exportPrivate():string

    // exportPublicToPEM returns the encoded public key if available
    exportPublic(): string

    // importPrivate reads the key-pair from the previously exported private key
    importPrivate(privateEnc:string):void

    // importPublic reads the public key from the PEM data.
    // This returns an error if the PEM is not a valid public key
    importPublic(publicEnc:string):void

    // return the signature of a message signed using this key
    // this requires a private key to be created or imported
    sign(message:Buffer):Buffer

    // verify the signature of a message using this key's public key
    // this requires a public key to be created or imported
    // returns true if the signature is valid for the message
    verify(signature:Buffer, message:Buffer):boolean
}
