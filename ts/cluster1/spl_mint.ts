import { Keypair, PublicKey, Connection, Commitment } from "@solana/web3.js";
import { getOrCreateAssociatedTokenAccount, mintTo } from '@solana/spl-token';
import wallet from "../wba-wallet.json"

// Import our keypair from the wallet file
const keypair = Keypair.fromSecretKey(new Uint8Array(wallet));

//Create a Solana devnet connection
const commitment: Commitment = "confirmed";
const connection = new Connection("https://api.devnet.solana.com", commitment);

const token_decimals = 1_000_000n;

// Mint address
const mint = new PublicKey("ESaQmvDbgHtRHMRGatFMk2Xwj6e1zv2fVfHG3vRaDYHB");

(async () => {
    try {
        const ATA = await getOrCreateAssociatedTokenAccount(connection, keypair, mint, keypair.publicKey);
        const mintSignature = await mintTo(connection, keypair, mint, ATA.address, keypair.publicKey, token_decimals);
        console.log(`tx id: ${mintSignature}`);
    } catch (error) {
        console.log(`Oops, something went wrong: ${error}`);
    }
})()