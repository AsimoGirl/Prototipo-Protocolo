import { useMemo } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';
import { useWallet } from '@solana/wallet-adapter-react';
import * as anchor from '@coral-xyz/anchor';
import idl from './anchor/idl.json';
import { useState } from 'react';
import utils from './utils';

// Make sure this matches how your IDL defines the program address
const programID = new PublicKey(idl.address);
const network = 'https://api.devnet.solana.com';
const opts = anchor.AnchorProvider.defaultOptions();

function InteractSCComponent() {
    const wallet = useWallet();
    const connected = wallet.connected;
    const [transactionMessage, setTransactionMessage] = useState<string>('');
    const idlString = JSON.stringify(idl);
    const parsedIdl = JSON.parse(idlString);
    const programStateKey = new PublicKey('EdbiCwD55i6aeoWhzpu8YCwNoEW6rAgARJyUU511K6jG');
    const connection = useMemo(() => new Connection(network, 'confirmed'), []);

    // Create the provider with Phantom wallet
    const provider = useMemo(() => {
        if (!wallet) {
            return null;
        }
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
                    const coder = new anchor.BorshCoder(parsedIdl);
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

    //Start the protocol
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

    //Get the transfer info
    const getTransferInfo = async () => {
        const program = getProgram();

        const bridgeInfo = await fetch('http://127.0.0.1:8080/request?type=solana', {
            method: 'GET'
        });

        const messageRequest = 'messageGetInfo';
        await handleTransaction(async () =>
            program.methods
                .getTransferInfo(messageRequest, bridgeInfo)
                .accounts({
                    programState: programStateKey,
                    signer: wallet.publicKey!
                })
                .rpc()
        );
    };

    //Get the acknowledge
    const getAcknowledge = async () => {
        // Send a request to the bridge to save the data.
        utils.updateData('String I want to save - from solana');

        alert('Saved data to the bridge');

        const program = getProgram();
        const messageRequest = 'messageAcknowledge';
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

    //Finish the protocol
    const finishProtocol = async () => {
        // Obtain the data from the bridge about ethereum.
        const data = await utils.getData();

        console.log(`Data extracted from Ethereum: ${data}`);

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

    console.log(wallet);

    // startProtocol().then((data) => {
    //     console.log('started protocol');
    //     console.log(data);
    // });

    return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
            <h1>Interact with Solana Smart Contract</h1>

            {connected ? (
                <>
                    <div>
                        <label htmlFor="transactionMessage">Transaction Message:</label>
                        <input
                            type="text"
                            id="transactionMessage"
                            value={transactionMessage}
                            onChange={(e) => setTransactionMessage(e.target.value)}
                            placeholder="Enter a message"
                            style={{ marginLeft: '10px', padding: '5px' }}
                        />
                    </div>

                    <div style={{ marginTop: '20px' }}>
                        <button
                            onClick={() => {
                                startProtocol().then(() => {
                                    alert('start protocol finished');

                                    // Wait 4 seconds before requesting trasnsfer info.....
                                    setTimeout(() => {
                                        getTransferInfo().then(() => {
                                            alert('transfer info finished');

                                            // Wait 5 seconds before `getAcknowledge`
                                            setTimeout(() => {
                                                getAcknowledge().then(() => {
                                                    // Wait 5 seconds before finishing protocol.
                                                    setTimeout(() => {
                                                        finishProtocol().then(() => {
                                                            console.log(
                                                                'finished protocol hiihihih'
                                                            );
                                                        });
                                                    }, 5000);
                                                });
                                            }, 5000);
                                        });
                                    }, 4000);
                                });
                            }}
                        >
                            Send Acknowledge
                        </button>
                    </div>
                </>
            ) : (
                <p>Please connect your wallet to interact</p>
            )}
        </div>
    );
}

export default InteractSCComponent;
