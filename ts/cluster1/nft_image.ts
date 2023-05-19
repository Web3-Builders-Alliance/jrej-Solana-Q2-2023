import { Keypair, Connection, Commitment } from "@solana/web3.js";
import wallet from "../wba-wallet.json"
import { Metaplex, keypairIdentity, bundlrStorage, toMetaplexFile } from "@metaplex-foundation/js";
import { readFile } from "fs/promises"

// Import our keypair from the wallet file
const keypair = Keypair.fromSecretKey(new Uint8Array(wallet));

//Create a Solana devnet connection
const commitment: Commitment = "confirmed";
const connection = new Connection("https://api.devnet.solana.com", commitment);
const metaplex = Metaplex.make(connection)
    .use(keypairIdentity(keypair))
    .use(bundlrStorage({
        address: 'https://devnet.bundlr.network',
        providerUrl: "https://api.devnet.solana.com",
        timeout: 60000,
    }));

(async () => {
    const image = await readFile('../images/generug.png');
    const metaplexImage = toMetaplexFile(image, 'generug.png');
    const imageUri = await metaplex.storage().upload(metaplexImage);
    console.log(`imageUri: ${imageUri}`);
})()