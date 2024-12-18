import { Connection, Commitment } from '@solana/web3.js';
import { Idl, Program, AnchorProvider } from '@coral-xyz/anchor';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
//import config from '@thesis/common/config';

import idl from './anchor/idl.json';

// Define network and program ID
const network = 'https://api.devnet.solana.com';
const opts: { preflightCommitment: Commitment } = { preflightCommitment: 'processed' };
//const programID = new PublicKey(idl.address); // Get program ID from IDL

function ProgramInteraction() {
    //const programID = new PublicKey(config.smartContractBSolanaAddress); // Get program ID from config
    const wallet = useWallet(); // Access the wallet
    const { publicKey, signTransaction, signAllTransactions, connected } = wallet;

    // Ensure the wallet is connected before proceeding
    if (!connected || !publicKey || !signTransaction || !signAllTransactions) {
        return <div>Please connect your wallet.</div>;
    }

    // Set up Solana connection and Anchor provider
    const connection = new Connection(network, opts.preflightCommitment);
    if (!signTransaction || !signAllTransactions) {
        return <div>Please connect your wallet.</div>;
    }
    const provider = new AnchorProvider(
        connection,
        { publicKey, signTransaction, signAllTransactions },
        opts
    ); // Wallet adapter passed directly
    const program = new Program(idl as unknown as Idl, provider); // Initialize the program

    // Function to call the "hello" instruction
    const sayHello = async () => {
        try {
            const tx = await program.methods.hello().rpc(); // Call the instruction
            console.log('Transaction signature:', tx);
            alert(`Transaction successful! Signature: ${tx}`);
        } catch (err) {
            console.error('Transaction failed:', err);
            alert(`Transaction failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
    };

    return (
        <div>
            <WalletMultiButton />
            <button onClick={sayHello}>Say Hello</button>
        </div>
    );
}

export default ProgramInteraction;
