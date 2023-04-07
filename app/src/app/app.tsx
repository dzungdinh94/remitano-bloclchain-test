import './app.module.scss';
import { useState } from 'react';
import { Connection, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { Program, AnchorProvider, web3, BN, Idl } from '@project-serum/anchor';
import idl from './idl.json';

import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import {
  useWallet,
  WalletProvider,
  ConnectionProvider,
} from '@solana/wallet-adapter-react';
import {
  WalletModalProvider,
  WalletMultiButton,
} from '@solana/wallet-adapter-react-ui';
import '@solana/wallet-adapter-react-ui/styles.css';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import bs58 from 'bs58';
const wallets = [
  new PhantomWalletAdapter(),
];

const { SystemProgram, Keypair } = web3;
/* create an account  */

const programID = new PublicKey(idl.metadata.address);
const userSolAccount = Keypair.fromSecretKey(
  bs58.decode(
    '38MCdGw7DJ7kocE4ZiRCx4vfFkERCYxHCaaei8uY87tnnmkjpPfjuNPRKqkaJvhWax8eLG6mzg22xKuTou2PmgjE'
  )
);

function App() {
  const wallet = useWallet();
  const [amount, setAmount] = useState(0);
  async function getProvider() {

    const network = 'https://api.testnet.solana.com';
    const connection = new Connection(network, 'processed');

    const provider = new AnchorProvider(connection, wallet, {
      preflightCommitment: 'processed'
    });
    return provider;
  }

  async function swap() {
    const provider = await getProvider();
    const contractSolAccount = Keypair.generate();
    const program = new Program(idl as Idl, programID, provider);
    try {
      const userMoveTokenAccount = new PublicKey(
        '4auj6wuQFPA1J3cbTR6ScPnwajcZ62ianq4qzTy6824y'
      );
      const mint = new PublicKey(
        'BUg8vfHQJYrPR82XCurFLSE6A1yLwGwgkphxWwPQn7DH'
      );

      /* interact with the program via rpc */
      const resp = await program.methods
        .swapSolForMove(new BN(amount * LAMPORTS_PER_SOL))
        .accounts({
          userSolAccount: userSolAccount.publicKey,
          userMoveAccount: userMoveTokenAccount,
          moveMint: mint,
          tokenProgram: TOKEN_PROGRAM_ID,
          contractSolAccount: contractSolAccount.publicKey,
          system_program: SystemProgram.programId,
        })
        .signers([contractSolAccount])
        .rpc();
      console.log(resp);
      // const account = await program.account.baseAccount.fetch(baseAccount.publicKey);
      // console.log('account: ', account);
      setAmount(0);
    } catch (err) {
      console.log('Transaction error: ', err);
    }
  }

  if (!wallet.connected) {
    /* If the user's wallet is not connected, display connect wallet button. */
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          marginTop: '100px',
        }}
      >
        <WalletMultiButton />
      </div>
    );
  } else {
    return (
      <div className="App">
        <main>
          <h1>Swap SOL for MOVE 🪙</h1>
          <div className="input-container">
            <input
              placeholder="Amount of SOL"
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
            />
            <button onClick={swap}>Swap</button>
          </div>
        </main>
      </div>
    );
  }
}

/* wallet configuration as specified here: https://github.com/solana-labs/wallet-adapter#setup */
const AppWithProvider = () => (
  <ConnectionProvider endpoint="https://api.testnet.solana.com">
    <WalletProvider wallets={wallets} autoConnect>
      <WalletModalProvider>
        <App />
      </WalletModalProvider>
    </WalletProvider>
  </ConnectionProvider>
);

export default AppWithProvider;
