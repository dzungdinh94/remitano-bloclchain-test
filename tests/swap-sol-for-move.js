const anchor = require("@project-serum/anchor");
const { default: NodeWallet } = require("@project-serum/anchor/dist/cjs/nodewallet");
const { createInitializeMintInstruction,
  TOKEN_PROGRAM_ID,
  MINT_SIZE,
  getMinimumBalanceForRentExemptMint,
  getMint,
  createMint,
  getAccount,
  createAssociatedTokenAccount,
  mintToChecked,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction, } = require('@solana/spl-token')
const {
  PublicKey,
  Connection,
  Keypair,
  Transaction,
  SystemProgram,

} = require('@solana/web3.js');
const bs58 = require('bs58');

const userSolAccount = Keypair.fromSecretKey(
  bs58.decode(
    "38MCdGw7DJ7kocE4ZiRCx4vfFkERCYxHCaaei8uY87tnnmkjpPfjuNPRKqkaJvhWax8eLG6mzg22xKuTou2PmgjE"
  )
);


describe("swap-sol-for-move", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.SwapSolForMove;

  let contractSolAccount;
  let userMoveTokenAccount;
  let mintAuthority;
  before(async () => {
    // Create SOL accounts for user and contract
    // userSolAccount = anchor.web3.Keypair.generate();
    contractSolAccount = anchor.web3.Keypair.generate();
    mintAuthority = anchor.web3.Keypair.generate()
    const lamports = await program.provider.connection.getMinimumBalanceForRentExemption(
      MINT_SIZE
    );
    userMoveTokenAccount = await getAssociatedTokenAddress(
      mintAuthority.publicKey,
      userSolAccount.publicKey,
    );

    const mint_tx = new anchor.web3.Transaction().add(
      // Use anchor to create an account from the mint key that we created
      anchor.web3.SystemProgram.createAccount({
        fromPubkey: userSolAccount.publicKey,
        newAccountPubkey: mintAuthority.publicKey,
        space: MINT_SIZE,
        programId: TOKEN_PROGRAM_ID,
        lamports,
      }),
      // Fire a transaction to create our mint account that is controlled by our anchor wallet
      createInitializeMintInstruction(
        mintAuthority.publicKey, 0, userSolAccount.publicKey, userSolAccount.publicKey
      ),
      // Create the ATA account that is associated with our mint on our anchor wallet
      createAssociatedTokenAccountInstruction(
        userSolAccount.publicKey, userMoveTokenAccount, userSolAccount.publicKey, mintAuthority.publicKey
      )
    );
    await anchor.AnchorProvider.env().sendAndConfirm(mint_tx, [mintAuthority, userSolAccount]);
  });

  it("Swaps SOL to MOVE tokens", async () => {
    let userSolBalance = await provider.connection.getBalance(userSolAccount.publicKey);
    let contractSolBalance = await provider.connection.getBalance(contractSolAccount.publicKey);
    let moveTokenAccount = await program.provider.connection.getParsedAccountInfo(userMoveTokenAccount)
    console.log("User SOL balance ", userSolBalance)
    console.log("Contract SOL balance ", contractSolBalance)
    console.log("Move token SOL balance ", moveTokenAccount.value.data.parsed.info.tokenAmount.amount)
    const saleAmount = 0.2 * anchor.web3.LAMPORTS_PER_SOL;
    await program.methods.swapSolForMove(new anchor.BN(saleAmount)).accounts({
      userSolAccount: userSolAccount.publicKey,
      userMoveAccount: userMoveTokenAccount,
      moveMint: mintAuthority.publicKey,
      tokenProgram: TOKEN_PROGRAM_ID,
      contractSolAccount: contractSolAccount.publicKey,
      system_program: SystemProgram.programId,
    })
      .signers([userSolAccount, contractSolAccount])
      .rpc()


    // // Check the user's SOL and MOVE balances
    userSolBalance = await provider.connection.getBalance(userSolAccount.publicKey);
    contractSolBalance = await provider.connection.getBalance(contractSolAccount.publicKey);
    moveTokenAccount = await program.provider.connection.getParsedAccountInfo(userMoveTokenAccount)

    console.log("User SOL balance ", userSolBalance)
    console.log("Contract SOL balance ", contractSolBalance)
    console.log("Move token SOL balance ", moveTokenAccount.value.data.parsed.info.tokenAmount.amount)

  });
});