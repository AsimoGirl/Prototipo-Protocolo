import { useMemo } from 'react';
import { Connection } from '@solana/web3.js';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import * as anchor from '@coral-xyz/anchor';
import idl from './anchor/idl.json';

// Make sure this matches how your IDL defines the program address
// const programID = new PublicKey(idl.address);
const network = 'https://api.devnet.solana.com';
const opts = anchor.AnchorProvider.defaultOptions();

function ProgramInteraction() {
    const wallet = useWallet();
    const idlString = JSON.stringify(idl);
    const parsedIdl = JSON.parse(idlString);
    const connection = useMemo(() => new Connection(network, 'confirmed'), []);

    const provider = useMemo(() => {
        if (!wallet) return null;
        return new anchor.AnchorProvider(
            connection,
            {
                publicKey: wallet.publicKey!,
                signTransaction: wallet.signTransaction!,
                signAllTransactions: wallet.signAllTransactions!
            },
            opts
        );
    }, [connection, wallet]);

    const sayHello = async () => {
        const program = new anchor.Program(parsedIdl, provider!);

        //const program = anchor.workspace.HelloWorld as anchor.Program<HelloWorld>;

        if (!program || !wallet.publicKey) {
            alert('Program or wallet not ready');
            return;
        }

        try {
            console.log('Calling the "hello" instruction via Anchor RPC');

            // Check your IDL for required accounts. Adjust as needed.
            const txSignature = await program.methods.initialize().rpc();

            console.log('Transaction signature:', txSignature);

            const latestBlockhash = await connection.getLatestBlockhash('confirmed');
            await connection.confirmTransaction(
                {
                    signature: txSignature,
                    blockhash: latestBlockhash.blockhash,
                    lastValidBlockHeight: latestBlockhash.lastValidBlockHeight
                },
                'confirmed'
            );

            alert('Transaction completed successfully!');
        } catch (err) {
            console.error('Transaction failed:', err);
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            alert(`Transaction failed: ${errorMessage}`);
        }
    };

    return (
        <div>
            <WalletMultiButton />
            {wallet.publicKey ? (
                <button onClick={sayHello}>Say Hello</button>
            ) : (
                <p>Please connect your wallet to interact with the program.</p>
            )}
        </div>
    );
}

export default ProgramInteraction;
