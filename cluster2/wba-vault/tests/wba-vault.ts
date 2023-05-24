import * as anchor from "@coral-xyz/anchor";
import { ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, createMint, getOrCreateAssociatedTokenAccount, mintTo } from '@solana/spl-token';
import { WbaVault, IDL } from "../target/types/wba_vault";
import wallet from '../wallet.json';
const { web3 } = anchor;

describe("wba-vault", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const keypair = anchor.web3.Keypair.fromSecretKey(new Uint8Array(wallet));
  const connection = new web3.Connection("http://localhost:8899");
  const commitment = "confirmed";

  const provider = new anchor.AnchorProvider(connection, new anchor.Wallet(keypair), { commitment });

  const programId = new web3.PublicKey("Gss8LX9bLNVB9e37eUrtqouWMGeuqNTUyJEhCkYZNhVK");
  const program = new anchor.Program<WbaVault>(IDL, programId, provider);

  const confirmTransaction = async (signature: string) => {
    const latestBlockhash = await provider.connection.getLatestBlockhash();
    await provider.connection.confirmTransaction(
      {
        signature,
        ...latestBlockhash,
      },
      commitment
    );
  }

  it("aidrop", async () => {
    const signature = await provider.connection.requestAirdrop(keypair.publicKey, 4 * web3.LAMPORTS_PER_SOL);
    await confirmTransaction(signature);
  })

  const vaultState = web3.Keypair.generate();
  console.log(`vaultState keypair: ${vaultState.publicKey.toBase58()}`);

  const vault_auth_seeds = [Buffer.from("auth"), vaultState.publicKey.toBuffer()];
  const vaultAuth = web3.PublicKey.findProgramAddressSync(vault_auth_seeds, program.programId)[0];

  const vault_seeds = [Buffer.from("vault"), vaultAuth.toBuffer()];
  const vault = web3.PublicKey.findProgramAddressSync(vault_seeds, program.programId)[0];

  it("Is initialized!", async () => {
    const signature = await program.methods
      .initialize()
      .accounts({
        owner: keypair.publicKey,
        vaultState: vaultState.publicKey,
        vaultAuth,
        vault,
        systemProgram: web3.SystemProgram.programId,
      })
      .signers([
        keypair,
        vaultState,
      ]).rpc();

    await confirmTransaction(signature);
  });

  it("can deposit", async () => {
    const txhash = await program.methods
      .deposit(new anchor.BN(0.1 * web3.LAMPORTS_PER_SOL))
      .accounts({
        owner: keypair.publicKey,
        vaultState: vaultState.publicKey,
        vaultAuth,
        vault,
        systemProgram: web3.SystemProgram.programId,
      })
      .signers([
        keypair,
      ]).rpc();

    const balance = await provider.connection.getBalance(keypair.publicKey);
    console.log(`Current balance: ${balance}`);

    console.log(`Success! Check out your TX here: 
        https://explorer.solana.com/tx/${txhash}?cluster=devnet`);
  });

  it("can withdraw", async () => {
    const txhash = await program.methods
      .withdraw(new anchor.BN(0.1 * web3.LAMPORTS_PER_SOL))
      .accounts({
        owner: keypair.publicKey,
        vaultState: vaultState.publicKey,
        vaultAuth,
        vault,
        systemProgram: web3.SystemProgram.programId,
      })
      .signers([
        keypair,
      ]).rpc();

    const balance = await provider.connection.getBalance(keypair.publicKey);
    console.log(`Current balance: ${balance}`);

    console.log(`Success! Check out your TX here: 
        https://explorer.solana.com/tx/${txhash}?cluster=devnet`);
  });

  let mint: anchor.web3.PublicKey;
  
  it("can deposit spl", async () => {
    mint = await createMint(
      connection,
      keypair,
      keypair.publicKey,
      null,
      6
    );
    console.log(`Mint: ${mint.toBase58()}`);

    const ata = await getOrCreateAssociatedTokenAccount(
      connection,
      keypair,
      mint,
      keypair.publicKey
    );

    const mintTx = await mintTo(
      connection,
      keypair,
      mint,
      ata.address,
      keypair,
      100 * 1000000,
    )
    await confirmTransaction(mintTx);
    console.log(`mintTx: ${mintTx}`);

    const ownerAta = await getOrCreateAssociatedTokenAccount(connection, keypair, mint, keypair.publicKey);
    const vaultAta = await getOrCreateAssociatedTokenAccount(connection, keypair, mint, vaultAuth, true);

    const txhash = await program.methods
      .depositSpl(new anchor.BN(1 * 1000000))
      .accounts({
        owner: keypair.publicKey,
        vaultState: vaultState.publicKey,
        vaultAuth,
        systemProgram: web3.SystemProgram.programId,
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
  });

  it("can withdraw spl", async () => {  
    const ownerAta = await getOrCreateAssociatedTokenAccount(connection, keypair, mint, keypair.publicKey);
    const vaultAta = await getOrCreateAssociatedTokenAccount(connection, keypair, mint, vaultAuth, true);

    const txhash = await program.methods
      .withdrawSpl(new anchor.BN(1 * 1000000))
      .accounts({
        owner: keypair.publicKey,
        vaultState: vaultState.publicKey,
        vaultAuth,
        systemProgram: web3.SystemProgram.programId,
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
  });
});

