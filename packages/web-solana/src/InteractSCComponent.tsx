import { useMemo } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';
import { useWallet } from '@solana/wallet-adapter-react';
import * as anchor from '@coral-xyz/anchor';
import idl from './anchor/idl.json';
import { useState } from 'react';
import utils from './utils';
import nacl from 'tweetnacl';
import crypto from 'node:crypto';
import Utils from '@thesis/common/utils/utils';
//import { set } from '@coral-xyz/anchor/dist/cjs/utils/features';

const programID = new PublicKey(idl.address);
const network = 'https://api.devnet.solana.com';
const opts = anchor.AnchorProvider.defaultOptions();

function InteractSCComponent() {
    const wallet = useWallet();
    const connected = wallet.connected;
    const idlString = JSON.stringify(idl);
    const parsedIdl = JSON.parse(idlString);
    const programStateKey = new PublicKey('EdbiCwD55i6aeoWhzpu8YCwNoEW6rAgARJyUU511K6jG');
    const connection = useMemo(() => new Connection(network, 'confirmed'), []);

    //Changes in the use
    const [transactionMessage, setTransactionMessage] = useState<string>('');
    const [showTextBox, setShowTextBox] = useState<boolean>(false);
    const [hideTextBox, setHideTextBox] = useState<boolean>(false);
    const [m4String, setm4String] = useState<string>('');
    const [blockNumber, setBlockNumber] = useState<string>('');

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
            if (!connected) {
                console.log('Wallet not connected, prompting connection...');
                await wallet.connect(); // Prompt user to connect wallet
            }

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
            setBlockNumber(latestBlockhash.blockhash.toString());
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
        const bridgeInfo = await utils.getData();

        //console.log(`bridgeInfo: ${bridgeInfo}`);

        const m3 =
            '\n m3 = (' +
            bridgeInfo +
            ' + piL + ' +
            'IDpCN = 2MCuBFEEWXHAqKMeZa9GUHLiRiMXqWPR5zmc9TEARUo4 + ' +
            Date.now() +
            ')';
        console.log(`M3: ${m3}`);
        const encodedM3 = new TextEncoder().encode(m3);

        if (!wallet.signMessage) {
            throw new Error('Wallet does not support message signing');
        }
        const rawSignM3 = await wallet.signMessage(encodedM3);
        const signM3 = Buffer.from(rawSignM3).toString('hex');
        //console.log(`Signed M3: ${signM3}`);
        const m4 = 'm4 = (' + signM3 + ' + ' + m3 + ') \n';
        setm4String(m4);
        //Verify the signature
        const verify = nacl.sign.detached.verify(encodedM3, rawSignM3, wallet.publicKey.toBuffer());

        if (!verify) {
            console.log('Signature not verified');
            return;
        }
        const program = getProgram();
        const messageRequest = 'messageGetInfo';
        await handleTransaction(async () =>
            program.methods
                .getTransferInfo(messageRequest, m4)
                .accounts({
                    programState: programStateKey,
                    signer: wallet.publicKey!
                })
                .rpc()
        );
        setTransactionMessage(m3);
        //Goes to the acknowledgement view
        setShowTextBox(true);
    };

    //Get the acknowledge
    const getAcknowledge = async () => {
        //console.log(`m4String: ${m4String}`);
        const m4Hash = crypto.createHash('sha256').update(m4String).digest('hex');
        console.log(`M4 Hash: ${m4Hash}`);
        const mACK =
            '\n Received message from A, with hash ' +
            m4Hash +
            ' + ' +
            Utils.createNonce() +
            ' + ' +
            Date.now();
        console.log(`AcINB: ${mACK}`);
        const encodedMAK = new TextEncoder().encode(mACK);
        if (!wallet.signMessage) {
            throw new Error('Wallet does not support message signing');
        }
        const rawSignmACK = await wallet.signMessage(encodedMAK);
        const signmACK = Buffer.from(rawSignmACK).toString('hex');
        //console.log(`Signed mAK: ${signmACK}`);

        const mACK1 = 'mAK = (' + signmACK + ' + ' + mACK + ')';
        console.log(`mAK: ${mACK1}`);
        const z2 =
            '"proof": {"a": ["0x5a","0x4b"],"b": [["0x58","0x42"],["0x89","0xb3"]],"c": ["0x07","0xa7"]}';
        const mACK2 = '\n mAK2 = (' + mACK1 + ' + z2 = ' + z2 + ')';
        console.log(`mAK2: ${mACK2}`);

        const encodedMACK2 = new TextEncoder().encode(mACK2);
        const rawSignmACK2 = await wallet.signMessage(encodedMACK2);
        const signmACK2 = Buffer.from(rawSignmACK2).toString('hex');
        //console.log(`Signed mAK2: ${signmACK2}`);

        const mACK3 = 'mAK3 = (' + signmACK2 + ' + ' + mACK2 + ')';

        //Verify the signature
        const verify2 = nacl.sign.detached.verify(
            encodedMACK2,
            rawSignmACK2,
            wallet.publicKey.toBuffer()
        );

        if (!verify2) {
            console.log('Signature not verified');
            return;
        }
        const program = getProgram();
        const messageRequest = 'messageAcknowledge';
        await handleTransaction(async () =>
            program.methods
                .getAcknowledge(messageRequest, mACK)
                .accounts({
                    programState: programStateKey,
                    signer: wallet.publicKey!
                })
                .rpc()
        );

        const m5 = 'm5 = (' + mACK3 + ' + b2 = ' + blockNumber + ') \n';
        console.log(`m5: ${m5}`);
        //Update to the bridge
        utils.updateData(m5);
        setHideTextBox(true);
        setShowTextBox(false);
    };

    //Finish the protocol
    const finishProtocol = async () => {
        //Force to change back to pcn wallet
        //await wallet.disconnect();
        // Obtain the data from the bridge about ethereum.
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

    //console.log(wallet);

    const handleFunctions = async () => {
        startProtocol().then(() => {
            alert('Protocol started successfully');
            console.log('Protocol started');
            // Wait 10 seconds before requesting trasnsfer info
            setTimeout(() => {
                getTransferInfo()
                    .then(() => {
                        alert('Transfer info received');
                        console.log('Transfer info received');
                    })
                    .catch((err) => {
                        console.log('Error getting transfer info', err);
                    });
            }, 2000);
        });
    };

    const handleAcknowldgeAndFinish = async () => {
        // Wait 5 seconds before `getAcknowledge`
        setTimeout(() => {
            getAcknowledge().then(() => {
                // Wait 10 seconds before finishing protocol.
                setTimeout(() => {
                    finishProtocol().then(() => {
                        console.log('Finished protocol');
                    });
                }, 7000);
            });
        }, 7000);
    };

    const colorLevels = ['#FF0000', '#00FF00', '#FFFF00', '#FF33FF', '#FF00FF']; // Different colors for each nesting level

    const formatTransactionMessageWithColors = (message) => {
        let level = 0; // Keep track of nesting depth

        return message.split('').map((char, index) => {
            if (char === '(') {
                const color = colorLevels[level % colorLevels.length]; // Cycle through colors
                level++;
                return (
                    <span key={index} style={{ color }}>
                        {char}
                    </span>
                );
            } else if (char === ')') {
                level--;
                const color = colorLevels[level % colorLevels.length]; // Match closing parenthesis to the correct level color
                return (
                    <span key={index} style={{ color }}>
                        {char}
                    </span>
                );
            }
            return char; // Return other characters as-is
        });
    };

    return (
        <div>
            {connected ? (
                showTextBox ? (
                    <div>
                        <p>
                            You have received the following message:
                            <strong
                                style={{
                                    display: 'block',
                                    marginTop: '10px',
                                    padding: '5px',
                                    borderRadius: '2px',
                                    wordBreak: 'break-word'
                                }}
                            >
                                {formatTransactionMessageWithColors(transactionMessage)}
                            </strong>
                        </p>
                        <p>Press OK to acknowledge you received it.</p>
                        <button
                            onClick={() => {
                                handleAcknowldgeAndFinish();
                            }}
                            style={{
                                padding: '10px 20px',
                                fontSize: '16px',
                                cursor: 'pointer',
                                marginTop: '10px'
                            }}
                        >
                            OK
                        </button>
                    </div>
                ) : hideTextBox ? (
                    <div>
                        <h1>Message acknowledged and sent to the bridge</h1>
                        <p>Protocol has finished.</p>
                    </div>
                ) : (
                    <>
                        <div id="text-info" className="hero">
                            <h2>Prototype for the information transfer bridge protocol</h2>
                            <p>Initiate the protocol by pressing the Start Protol button.</p>
                        </div>
                        <div style={{ marginTop: '20px' }}>
                            <button
                                onClick={() => {
                                    handleFunctions();
                                }}
                            >
                                Start Protocol
                            </button>
                        </div>
                    </>
                )
            ) : (
                <p>Please connect your wallet to interact</p>
            )}
        </div>
    );
}

export default InteractSCComponent;
