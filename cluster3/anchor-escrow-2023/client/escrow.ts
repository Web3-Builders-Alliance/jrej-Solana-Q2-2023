import * as anchor from "@coral-xyz/anchor"
import { BN } from "@coral-xyz/anchor"
import { AnchorEscrow2023, IDL } from "./idl";
import { PublicKey, Commitment, Keypair, SystemProgram, Connection } from "@solana/web3.js"
import { ASSOCIATED_TOKEN_PROGRAM_ID as associatedTokenProgram, TOKEN_PROGRAM_ID as tokenProgram, createMint, createAccount, mintTo, getOrCreateAssociatedTokenAccount, getAccount, Account, getAssociatedTokenAddress, transfer } from "@solana/spl-token"
import { randomBytes } from "crypto"
import { assert } from "chai"
import wallet from './wallet.json';

const maker = Keypair.fromSecretKey(new Uint8Array(wallet));
const taker = new PublicKey('wba953abpL8wMfmX3WEZLd5UauUJJEYujxLar7roT5r');

const commitment: Commitment = "confirmed"
const connection = new Connection("https://api.devnet.solana.com");
const programId = new anchor.web3.PublicKey("3tWcxiouPwVkF8eiWWFPbxV8vayMVaR8BYMRFcz2zFK3");

const provider = new anchor.AnchorProvider(connection, new anchor.Wallet(maker), { commitment });
const program = new anchor.Program<AnchorEscrow2023>(IDL, programId, provider);

const makerMint = new PublicKey('8WJwwjaxcaXg5pf4kgExmBDmSYjqKuE5z3xnMjrmyiVk');
const takerMint = new PublicKey('7moFhYdA6qfuhRXhVmuzZoi4HRo6sRPrdXNwB9yn6RYY');

const seed = new BN(randomBytes(8));

const auth = PublicKey.findProgramAddressSync([Buffer.from("auth")], program.programId)[0];
const escrow = PublicKey.findProgramAddressSync([Buffer.from("escrow"), maker.publicKey.toBytes(), seed.toBuffer().reverse()], program.programId)[0];
const vault = PublicKey.findProgramAddressSync([Buffer.from("vault"), escrow.toBuffer()], program.programId)[0];

let maker_ata: PublicKey; // Maker + maker token
let taker_ata: PublicKey; // Taker + taker token
let maker_receive_ata: PublicKey; // Maker + taker token
let taker_receive_ata: PublicKey; // Taker + maker

const init = async () => {
    let maker_ata = await getAssociatedTokenAddress(makerMint, maker.publicKey, false, tokenProgram);
    let taker_ata = await getAssociatedTokenAddress(takerMint, taker, false, tokenProgram);
    let maker_receive_ata = await getAssociatedTokenAddress(takerMint, maker.publicKey, false, tokenProgram);
    let taker_receive_ata = await getAssociatedTokenAddress(makerMint, taker, false, tokenProgram);

    const signature = await program.methods
        .make(
            seed,
            new anchor.BN(6 * 1e8),
            new anchor.BN(6 * 1e8),
            new anchor.BN(100),
        )
        .accounts({
            maker: maker.publicKey,
            makerAta: maker_ata,
            makerToken: makerMint,
            takerToken: takerMint,
            auth,
            escrow,
            vault,
            tokenProgram,
            associatedTokenProgram,
            systemProgram: SystemProgram.programId
        })
        .signers(
            [
                maker
            ]
        )
        .rpc()

    console.log("TX: ", signature);
}

init();