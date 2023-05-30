import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Escrow } from "../target/types/escrow";

describe("escrow", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.Escrow as Program<Escrow>;
  const wallet = anchor.Wallet.local();

  const commitment = "confirmed";
  const connection = new anchor.web3.Connection("http://localhost:8899");
  const provider = new anchor.AnchorProvider(connection, wallet, { commitment });

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
    const signature = await provider.connection.requestAirdrop(wallet.publicKey, 4 * anchor.web3.LAMPORTS_PER_SOL);
    await confirmTransaction(signature);
  })
});
