import { useMemo } from 'react';
import { Connection, PublicKey, Keypair, SystemProgram } from '@solana/web3.js';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import * as anchor from '@coral-xyz/anchor';
import idl from './idl.json';

const programID = new PublicKey(idl.address);
const network = 'https://api.devnet.solana.com';
const opts = anchor.AnchorProvider.defaultOptions();

//Run this function to initialize the program state and then put the value on the env variables
function InitializeSmartContract() {
    const wallet = useWallet();
    const idlString = JSON.stringify(idl);
    const parsedIdl = JSON.parse(idlString);
    const programStateKeypair = Keypair.generate();
    const programStateKey = programStateKeypair.publicKey;
    console.log('Program State Key:', programStateKey);
    const connection = useMemo(() => new Connection(network, 'confirmed'), []);

    // Create the provider with Phantom wallet
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

    // Initialize the Anchor program
    const getProgram = () => {
        if (!provider) {
            alert('Provider not ready. Please connect your wallet.');
            throw new Error('Provider not ready');
        }
        return new anchor.Program(parsedIdl, provider!);
    };

    // Common transaction handler
    const handleTransaction = async (transactionFn: () => Promise<string>) => {
        try {
            const txSignature = await transactionFn();

            console.log('Transaction signature:', txSignature);

            const txInfo = await connection.getTransaction(txSignature, {
                commitment: 'confirmed',
                maxSupportedTransactionVersion: 0
            });

            if (txInfo && txInfo.meta) {
                const logs = txInfo.meta.logMessages;
                if (logs) {
                    const coder = new anchor.BorshCoder(JSON.parse(JSON.stringify(idl)));
                    const eventParser = new anchor.EventParser(programID, coder);
                    const events = eventParser.parseLogs(logs);
                    for (const event of events) {
                        console.log(`Parsed event: ${event.name}`, event.data);
                    }
                }
            }
            const latestBlockhash = await connection.getLatestBlockhash('confirmed');
            await connection.confirmTransaction(
                {
                    signature: txSignature,
                    blockhash: latestBlockhash.blockhash,
                    lastValidBlockHeight: latestBlockhash.lastValidBlockHeight
                },
                'confirmed'
            );

            alert(
                'Transaction completed successfully!, with signature: ' +
                    txSignature +
                    ' and blockhash: ' +
                    latestBlockhash.blockhash +
                    ' and lastValidBlockHeight: ' +
                    latestBlockhash.lastValidBlockHeight
            );
        } catch (err) {
            console.error('Transaction failed:', err);
            alert(`Transaction failed: ${err instanceof Error ? err.message : err}`);
        }
    };

    // Initialize Program State
    const initializeProgram = async () => {
        const program = getProgram();
        await handleTransaction(async () =>
            program.methods
                .initializeProgramState()
                .accounts({
                    programState: programStateKeypair.publicKey,
                    payer: provider!.wallet.publicKey,
                    systemProgram: SystemProgram.programId
                })
                .signers([programStateKeypair])
                .rpc()
        );
    };

    return (
        <div>
            <WalletMultiButton />
            {wallet.publicKey ? (
                <div>
                    <button onClick={initializeProgram}>Initialize Program</button>
                </div>
            ) : (
                <p>Please connect your wallet to interact with the program.</p>
            )}
        </div>
    );
}

export default InitializeSmartContract;
