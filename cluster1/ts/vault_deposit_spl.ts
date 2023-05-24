import { Connection, Keypair, SystemProgram, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { Program, Wallet, AnchorProvider, Address, BN } from "@project-serum/anchor";
import { WbaVault, IDL } from "../programs/wba_vault";
import wallet from "../wba-wallet.json";
import { ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, createMint, getOrCreateAssociatedTokenAccount } from '@solana/spl-token';

const keypair = Keypair.fromSecretKey(new Uint8Array(wallet));
const connection = new Connection("https://api.devnet.solana.com");

const provider = new AnchorProvider(connection, new Wallet(keypair), { commitment: "confirmed" });
const program = new Program<WbaVault>(IDL, "D51uEDHLbWAxNfodfQDv7qkp8WZtxrhi3uganGbNos7o" as Address, provider);

const vaultState = new PublicKey('Ui1XeJzektwqCFc8qEwD5JbGLM6CFzgr9s6mWEYza6y');

const vault_auth_seeds = [Buffer.from("auth"), vaultState.toBuffer()];
const vaultAuth = PublicKey.findProgramAddressSync(vault_auth_seeds, program.programId)[0];

const token_decimals = 1_000_000n;
const mint = new PublicKey("ESaQmvDbgHtRHMRGatFMk2Xwj6e1zv2fVfHG3vRaDYHB");

(async () => {
    try {
        const ownerAta = await getOrCreateAssociatedTokenAccount(connection, keypair, mint, keypair.publicKey);
        const vaultAta = await getOrCreateAssociatedTokenAccount(connection, keypair, mint, vaultAuth, true);

        const txhash = await program.methods
            .depositSpl(new BN(1n * token_decimals))
            .accounts({
                owner: keypair.publicKey,
                vaultState: vaultState,
                vaultAuth,
                systemProgram: SystemProgram.programId,
                ownerAta: ownerAta.address,
                vaultAta: vaultAta.address,
                tokenMint: mint,
                tokenProgram: TOKEN_PROGRAM_ID,
                associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            })
            .signers([
                keypair,
            ]).rpc();
        console.log(`Success! Check out your TX here: 
        https://explorer.solana.com/tx/${txhash}?cluster=devnet`);
    } catch (e) {
        console.error(`Oops, something went wrong: ${e}`)
    }
})();