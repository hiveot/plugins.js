
// Interface of standardized key and signature functions.
// Intended to standardize the maze of crypto methods,algorithms and so on.
export interface IHiveKeys {
    // createKey create a new public and private ecdsa or ed25519 key pair
    createKey():void|Promise<void>

    // importPrivateFromPEM reads the key-pair from the PEM private key
    // This returns an error if the PEM is not a valid key
    importPrivateFromPEM(privatePEM:string):void

    // importPublicFromPEM reads the public key from the PEM data.
    // This returns an error if the PEM is not a valid public key
    importPublicFromPEM(publicPEM:string):void

    // exportPrivateToPEM returns the PEM encoded private key if available
    exportPrivateToPEM():string

    // exportPublicToPEM returns the PEM encoded public key if available
    exportPublicToPEM(): string

    // return the signature of a message signed using this key
    // this requires a private key to be created or imported
    sign(message:Buffer):Buffer

    // verify the signature of a message using this key's public key
    // this requires a public key to be created or imported
    // returns true if the signature is valid for the message
    verify(signature:Buffer, message:Buffer):boolean
}
