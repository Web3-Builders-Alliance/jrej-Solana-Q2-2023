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
    const { nft } = await metaplex.nfts().create({
        name: 'Generug #1',
        symbol: 'GNRG',
        sellerFeeBasisPoints: 500,
        uri: 'https://arweave.net/qF9H_BBdjf-ZIR90_z5xXsSx8WiPB3-pHA8QTlg1oeI',
        creators: [
            {
                address: keypair.publicKey,
                share: 100,
            },
        ],
        isMutable: true,
    });
    console.log(`Success! Check out your NFT here: 
    https://explorer.solana.com/address/${nft.address}?cluster=devnet`);
})()