import { useMemo } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';
import { useWallet } from '@solana/wallet-adapter-react';
import * as anchor from '@coral-xyz/anchor';
import idl from './anchor/idl.json';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

// Make sure this matches how your IDL defines the program address
const programID = new PublicKey(idl.address);
const network = 'https://api.devnet.solana.com';
const opts = anchor.AnchorProvider.defaultOptions();

function ProgramInteraction() {
    const wallet = useWallet();
    const idlString = JSON.stringify(idl);
    const parsedIdl = JSON.parse(idlString);
    const programStateKey = new PublicKey('EdbiCwD55i6aeoWhzpu8YCwNoEW6rAgARJyUU511K6jG');
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

    // Start Protocol
    const startProtocol = async () => {
        const program = getProgram();
        const messageRequest = 'messageStart';
        await handleTransaction(async () =>
            program.methods
                .startProtocol(messageRequest)
                .accounts({
                    programState: programStateKey,
                    signer: wallet.publicKey!
                })
                .rpc()
        );
    };

    // Get Transfer Info
    const getTransferInfo = async () => {
        const program = getProgram();
        const messageRequest = 'messageGetInfo';
        const transactionMessage = 'signedMessage';
        await handleTransaction(async () =>
            program.methods
                .getTransferInfo(messageRequest, transactionMessage)
                .accounts({
                    programState: programStateKey,
                    signer: wallet.publicKey!
                })
                .rpc()
        );
    };

    //Get Acknowledgement
    const getAcknowledge = async () => {
        const program = getProgram();
        const messageRequest = 'messageAcknowledge';
        const transactionMessage = 'signedMessage';
        await handleTransaction(async () =>
            program.methods
                .getAcknowledge(messageRequest, transactionMessage)
                .accounts({
                    programState: programStateKey,
                    signer: wallet.publicKey!
                })
                .rpc()
        );
    };

    const finishProtocol = async () => {
        const program = getProgram();
        const messageRequest = 'messageFinish';
        await handleTransaction(async () =>
            program.methods
                .finishProtocol(messageRequest)
                .accounts({
                    programState: programStateKey,
                    signer: wallet.publicKey!
                })
                .rpc()
        );
    };

    return (
        <div>
            <WalletMultiButton />
            {wallet.publicKey ? (
                <div>
                    <button onClick={startProtocol}>Start Protocol</button>
                    <button onClick={getTransferInfo}>Get Transfer Info</button>
                    <button onClick={getAcknowledge}>Get Acknowledge</button>
                    <button onClick={finishProtocol}>Finish Protocol</button>
                </div>
            ) : (
                <p>Please connect your wallet to interact with the program.</p>
            )}
        </div>
    );
}

export default ProgramInteraction;
