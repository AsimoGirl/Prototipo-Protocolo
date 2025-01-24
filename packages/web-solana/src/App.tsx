import { useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';
import WalletInteraction from './WalletInteraction'; // Import WalletInteraction component
import ProgramInteraction from './ProgramInteraction'; // Import ProgramInteraction component
import InteractSCComponent from './InteractSCComponent';

import bridgelogo from './assets/bridgelogo.png'; // Import Ethereum logo
import solanaLogo from './assets/solanaLogo.png'; // Import bridge icon

import '@solana/wallet-adapter-react-ui/styles.css'; // Import wallet adapter styles
import './styles.css'; // Import the new global styles

function App() {
    // Define the network and endpoint (Devnet for development, or 'mainnet-beta' for production)
    const network = clusterApiUrl('devnet');
    const wallets = useMemo(() => [new PhantomWalletAdapter()], []);

    return (
        <ConnectionProvider endpoint={network}>
            <WalletProvider wallets={wallets} autoConnect>
                <WalletModalProvider>
                    <div className="main-container">
                        <header>
                            <div className="container">
                                <div className="logo">
                                    <img src={bridgelogo} alt="Bridge Logo" />
                                    <h2>Bridge Protocol Prototype</h2>
                                </div>
                                <div className="logo blockchain">
                                    <img src={solanaLogo} alt="Solana Logo" />
                                </div>
                                <div className="button wallet-connect">
                                    {/* Using WalletMultiButton to connect to Phantom Wallet */}
                                    <WalletMultiButton />
                                </div>
                            </div>
                        </header>
                        <main>
                            <div id="text-info" className="hero">
                                <h2>Prototype for the information transfer bridge protocol</h2>
                                <p>Initiate the protocol by pressing the connect wallet button.</p>
                            </div>
                            <InteractSCComponent />
                        </main>
                    </div>
                </WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );
}

export default App;
