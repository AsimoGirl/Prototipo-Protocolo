import { useMemo } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import * as anchor from '@coral-xyz/anchor';
import idl from './anchor/idl.json';

// Make sure this matches how your IDL defines the program address
const programID = new PublicKey(idl.address);
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

        if (!program || !wallet.publicKey) {
            alert('Program or wallet not ready');
            return;
        }

        try {
            /* Code for adding listener (Not as useful)

            const listener = program.addEventListener('HelloEvent', (event, slot, signature) => {
                console.log(`\n[Event Listener] Slot: ${slot}`);
                console.log('Event data:', event);
                console.log('Signature:', signature);
                console.log('Got here');
                listenerFinished = true;
            });

            console.log('listener:', listener); */

            const txSignature = await program.methods.sayHello().rpc();

            console.log('Transaction signature:', txSignature);

            const txInfo = await connection.getTransaction(txSignature, {
                commitment: 'confirmed',
                maxSupportedTransactionVersion: 0
            });

            if (txInfo && txInfo.meta) {
                /* Code to filter logs (may be useful if the event is too big) 
                // Filter and strip only "Program log: " lines
                const prefix = 'Program log: ';
                const excludeMarker = 'Instruction:';

                const programLogs = (txInfo.meta.logMessages || [])
                    // Keep only lines that start with "Program log: "
                    .filter((logLine) => logLine.startsWith(prefix))
                    // Exclude lines that contain "Instruction:"
                    .filter((logLine) => !logLine.includes(excludeMarker))
                    // Strip the "Program log: " prefix so you only get the actual message
                    .map((logLine) => logLine.slice(prefix.length));

                console.log('Filtered program logs:', programLogs); */

                const logs = txInfo.meta.logMessages;
                if (!logs) {
                    console.log('No logs in this transaction');
                    return;
                }

                const coder = new anchor.BorshCoder(parsedIdl);
                const eventParser = new anchor.EventParser(programID, coder);
                const anchorEvents = eventParser.parseLogs(logs);
                for (const event of anchorEvents) {
                    console.log(`Parsed event: ${event.name}`, event.data);
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
