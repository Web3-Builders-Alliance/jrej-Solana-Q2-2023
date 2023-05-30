import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Escrow } from "../target/types/escrow";
import wallet from '../../../wallet.json';
import wallet2 from '../../../wallet2.json';
import { ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, createMint, getOrCreateAssociatedTokenAccount, mintTo } from '@solana/spl-token';

describe("escrow", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.Escrow as Program<Escrow>;
  const keypair = anchor.web3.Keypair.fromSecretKey(new Uint8Array(wallet));
  const keypair2 = anchor.web3.Keypair.fromSecretKey(new Uint8Array(wallet2));

  const commitment = "confirmed";
  const connection = new anchor.web3.Connection("http://localhost:8899");
  const provider = new anchor.AnchorProvider(connection, new anchor.Wallet(keypair), { commitment });

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

  it("airdrop", async () => {
    const signatureA = await provider.connection.requestAirdrop(keypair.publicKey, 4 * anchor.web3.LAMPORTS_PER_SOL);
    await confirmTransaction(signatureA);
    const signatureB = await provider.connection.requestAirdrop(keypair2.publicKey, 4 * anchor.web3.LAMPORTS_PER_SOL);
    await confirmTransaction(signatureB);

  })

  const vaultAuthoritySeeds = [Buffer.from("authority")];
  const vaultAuthority = anchor.web3.PublicKey.findProgramAddressSync(vaultAuthoritySeeds, program.programId)[0];
  const vault = anchor.web3.Keypair.generate();

  let mintA: anchor.web3.PublicKey;
  let mintB: anchor.web3.PublicKey;

  const seed = Date.now().toString();
  console.log(`seed: ${seed}`);

  it("mints token A to owner 1", async () => {
    mintA = await createMint(
      connection,
      keypair,
      keypair.publicKey,
      null,
      6
    );
    console.log(`Mint: ${mintA.toBase58()}`);

    const ownerAtaTokenA = await getOrCreateAssociatedTokenAccount(
      connection,
      keypair,
      mintA,
      keypair.publicKey
    );

    const mintTxA = await mintTo(
      connection,
      keypair,
      mintA,
      ownerAtaTokenA.address,
      keypair,
      100 * 1000000,
    );

    await confirmTransaction(mintTxA);
    console.log(`mintTx: ${mintTxA}`);
  })

  it("mints token B to owner 2", async () => {
    mintB = await createMint(
      connection,
      keypair2,
      keypair2.publicKey,
      null,
      6
    );
    console.log(`Mint: ${mintB.toBase58()}`);

    const owner2AtaTokenB = await getOrCreateAssociatedTokenAccount(
      connection,
      keypair2,
      mintB,
      keypair2.publicKey
    );

    const mintTxB = await mintTo(
      connection,
      keypair2,
      mintB,
      owner2AtaTokenB.address,
      keypair2,
      100 * 1000000,
    );

    await confirmTransaction(mintTxB);
    console.log(`mintTx: ${mintTxB}`);
  })

  it("initializes", async () => {
    const vaultAtaTokenA = await getOrCreateAssociatedTokenAccount(connection, keypair, mintA, keypair.publicKey, true);
    const vaultAtaTokenB = await getOrCreateAssociatedTokenAccount(connection, keypair, mintB, keypair.publicKey, true);
    const escrowSeed = new anchor.BN(2);
    const escrowState = anchor.web3.PublicKey.findProgramAddressSync([Buffer.from("state"), escrowSeed.toBuffer()], program.programId)[0];

    await program.methods
      .initialize(seed, new anchor.BN(2), new anchor.BN(3))
      .accounts({
        initializer: keypair.publicKey,
        mintA,
        vault_authority: vaultAuthority,
        vault: vault.publicKey,
        initializer_deposit_token_account: vaultAtaTokenA.address,
        initializer_receive_token_account: vaultAtaTokenB.address,
        escrowState,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([
        keypair,
        vault,
      ])
      .rpc();
  })
});
