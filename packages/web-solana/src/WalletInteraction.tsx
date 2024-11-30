import React, { useCallback, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
//import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import Utils from '@thesis/common/utils/utils';
//import { PublicKey, Keypair } from '@solana/web3.js';
import nacl from 'tweetnacl';

const WalletInteraction: React.FC = () => {
    const { publicKey, signMessage, connected } = useWallet();

    // State to store user inputs
    const [destinationAddress, setDestinationAddress] = useState<string>('');
    const [operation, setOperation] = useState<string>('');
    const [message, setMessage] = useState<string>('');
    const [signature, setSignature] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);

    // Function to handle signing the composed message
    const handleSignMessage = useCallback(async () => {
        if (!publicKey || !signMessage) {
            console.log('No wallet or signMessage function available');
            return;
        }

        // Create a composite message
        //const compositeMessage = `Address: ${destinationAddress}, Operation: ${operation}, Message: ${message}`;
        const compositeMessage = Utils.embedMessage(destinationAddress, operation, message);
        try {
            setLoading(true); // Show loading state
            console.log('Composite Message:', compositeMessage);
            const encodedMessage = new TextEncoder().encode(compositeMessage.toString());
            const signedMessage = await signMessage(encodedMessage);
            setSignature(Buffer.from(signedMessage).toString('hex'));
            console.log('Signature:', signedMessage);
            console.log(
                nacl.sign.detached.verify(encodedMessage, signedMessage, publicKey.toBuffer())
            );
        } catch (error) {
            console.error('Error signing message:', error);
        } finally {
            setLoading(false); // Hide loading state
        }
    }, [publicKey, signMessage, destinationAddress, operation, message]);

    return (
        <div>
            {connected ? (
                <>
                    <div id="destination-input" className="input-container">
                        <input
                            type="text"
                            value={destinationAddress}
                            onChange={(e) => setDestinationAddress(e.target.value)}
                            placeholder="Enter the destination address"
                        />
                    </div>
                    <div id="operation-input" className="input-container">
                        <input
                            type="text"
                            value={operation}
                            onChange={(e) => setOperation(e.target.value)}
                            placeholder="Enter the operation or the type of message you want to make."
                        />
                    </div>
                    <div id="message-input" className="input-container">
                        <input
                            type="text"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Enter a message you'd like to embed."
                        />
                    </div>
                    <button id="connect-button" onClick={handleSignMessage}>
                        Start the information exchange protocol
                    </button>
                    {signature && <p>Message Signature: {signature}</p>}
                    {loading && (
                        <div id="loading-window" className="loading-window-container">
                            <div className="loading-window-content">
                                <div className="spinner"></div>
                                <p>Your request is being processed, please wait...</p>
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <p>Please connect your wallet to interact</p>
            )}
        </div>
    );
};

export default WalletInteraction;
