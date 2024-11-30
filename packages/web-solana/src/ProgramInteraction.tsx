import React from 'react';
import { Commitment, Connection } from '@solana/web3.js';
import { Idl, Program, AnchorProvider, Wallet } from '@coral-xyz/anchor';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

// Import the IDL
import idl from './anchor/idl.json';

const idlTyped = idl as unknown as Idl;
//const programID = new PublicKey('DWx8BzghjiypNmRDyeeCZGo66RKrJiXBZf6BXZLpd7Dn');
const network = 'https://api.devnet.solana.com';
const opts: { preflightCommitment: Commitment } = {
    preflightCommitment: 'processed'
};

function ProgramInteraction() {
    const { publicKey, signTransaction, signAllTransactions } = useWallet();
    if (!publicKey || !signTransaction || !signAllTransactions) {
        return <div>Please connect your wallet.</div>;
    }
    const wallet = {
        publicKey,
        signTransaction,
        signAllTransactions
    } as Wallet;

    const connection = new Connection(network, opts.preflightCommitment);
    const provider = new AnchorProvider(connection, wallet, opts);
    const program = new Program(idlTyped, provider);

    const sayHello = async () => {
        if (!wallet.publicKey) {
            alert('Please connect your wallet!');
            return;
        }

        try {
            const tx = await program.methods.hello().rpc();
            console.log('Transaction signature:', tx);
            alert('Transaction successful! Signature: ' + tx);
        } catch (err) {
            console.error('Transaction error:', err);
            if (err instanceof Error) {
                alert('Transaction failed: ' + err.message);
            } else {
                alert('Transaction failed');
            }
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
