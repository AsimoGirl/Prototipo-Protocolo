import utils from './utils';
import { EventCatcher } from './eventCatcher';

import config from '../data/config.json';

import { MetaMaskSDK } from '@metamask/sdk';
import { ethers, BrowserProvider } from 'ethers';
import Utils from '@thesis/common/utils/utils';
import TestContractABI from '@thesis/web-ethereum/smartContracts/ProtocolActionsABI.json';

import type { MetaMaskSDKOptions } from '@metamask/sdk';

export class Metamask {
    private sdk: MetaMaskSDK;
    public mainAccount?: string;
    private provider: BrowserProvider;
    private accounts: string[] = [];
    private currentAccountIndex = 0;
    private connectedCallback?: () => void;
    public eventCatcher: EventCatcher = new EventCatcher();
    public m6: string = '';

    //colors
    public colorLevels: string[] = ['#FF0000', '#00FF00', '#FFFF00', '#FF33FF', '#FF8000']; // Different colors for each nesting level

    public contract: ethers.Contract | null = null;

    public constructor(options?: MetaMaskSDKOptions) {
        this.sdk = new MetaMaskSDK(options);
        this.provider = new BrowserProvider(window.ethereum!);
    }

    //Connects to the metamask wallet
    public async connect(): Promise<void> {
        try {
            if (!window.ethereum) return alert('Please install MetaMask!');
            let accounts: string[] = (await window.ethereum.request({
                method: 'eth_requestAccounts',
                params: []
            })) as string[];
            if (accounts.length === 0) return alert('No accounts found!');
            this.accounts = accounts; // Store all accounts
            this.mainAccount = accounts[0]; // Default to the first account
            this.provider = new BrowserProvider(window.ethereum!); // Reinitialize with updated accounts
            this.connectedCallback?.();
            //console.log(`Available accounts: ${accounts}`);
            //console.log(`Connected to: ${this.mainAccount}`);
        } catch (error) {
            console.error('Error connecting to MetaMask:', error);
        }
    }

    // Switch to the next account
    public switchAccount(): void {
        if (this.accounts.length < 2) {
            console.warn('No additional accounts to switch to.');
            return;
        }

        this.currentAccountIndex = (this.currentAccountIndex + 1) % this.accounts.length;
        this.mainAccount = this.accounts[this.currentAccountIndex];

        //console.log(`Switched to account: ${this.mainAccount}`);
        this.provider = new BrowserProvider(window.ethereum!); // Update the provider with the new account
        this.contract = null; // Reset the contract so it uses the new account's signer
    }

    // Ensure the correct signer is used
    private async getSigner(): Promise<ethers.Signer> {
        const signer = await this.provider.getSigner(this.mainAccount);
        return signer;
    }

    private async createContract(): Promise<ethers.Contract> {
        if (!this.contract) {
            const signer = await this.provider.getSigner();
            this.contract = new ethers.Contract(
                config.SMART_CONTRACT_A_ETHEREUM_ADDRESS,
                TestContractABI,
                signer
            );
        }
        return this.contract;
    }

    //Sign a message
    public async signMessage(message: string): Promise<string> {
        try {
            let signer = await this.provider.getSigner(),
                signature = await signer.signMessage(message),
                signerAccount = await signer.getAddress();
            //console.log(`This is the signature: ${signature} and the address: ${signerAccount}`);
            return signature;
        } catch (e) {
            console.log(`An error ${e} has occurred while signing the message: ${message}`);
            return '';
        }
    }

    //Verify a message
    public async verifyMessage(
        message: string,
        signature: string,
        signerAddress: string
    ): Promise<boolean> {
        signerAddress = signerAddress.toLowerCase();

        try {
            const messageSigner = ethers.verifyMessage(message, signature).toLowerCase();
            if (messageSigner !== signerAddress) {
                console.log(`The message ${message} has not been verified by ${signerAddress}`);
                return false;
            }
            console.log(
                `The message ${message} has been verified by ${signerAddress} with the signature ${signature}`
            );
            return true;
        } catch (e) {
            console.log(`An error has occurred while verifying the message: ${message}`);
            return false;
        }
    }

    //Recover the elements of a signature
    public recoverElementsSignature(
        signature: string,
        messageToSign: string
    ): { messageHash: string; v: number; r: string; s: string } {
        let r = signature.slice(0, 66),
            s = `0x${signature.slice(66, 130)}`,
            v = parseInt(signature.slice(130, 132), 16),
            messageHash = ethers.hashMessage(messageToSign);
        return { messageHash, v, r, s };
    }

    //Gives the elements of the signature needed for the smart contract
    public async getValuesSignatures(signedMessage: string, messageReq: string) {
        let { messageHash, r, s, v } = this.recoverElementsSignature(signedMessage, messageReq),
            recAdd = ethers.recoverAddress(messageHash, signedMessage);
        console.log({ messageHash, r, s, v });
        console.log(`This is the recovered address: ${recAdd}`);
        console.log(ethers.id(messageReq));
    }

    public onConnected(callback: () => void): void {
        this.connectedCallback = callback;
    }

    // Function to show the pop-up window
    public showPopup(message: string) {
        const width = 400,
            height = 200,
            left = screen.width / 2 - width / 2,
            top = screen.height / 2 - height / 2,
            popupWindow = window.open(
                '', // URL, leave empty for a custom message
                'popupWindow', // Window name
                `width=${width},height=${height},top=${top},left=${left}` // Window features
            );

        if (popupWindow) {
            popupWindow.document.write(`
            <html>
                <head>
                    <title>Task Complete</title>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            background-color: #121212; /* Dark background */
                            margin: 0;
                            padding: 0;
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            height: 100%;
                            color: #FFFFFF; /* Light text */
                        }
                        .popup-container {
                            text-align: center;
                            background-color: #1E1E1E; /* Slightly lighter dark background for the container */
                            border-radius: 10px;
                            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
                            padding: 20px;
                            max-width: 90%;
                            width: 300px;
                        }
                        .popup-container h2 {
                            margin-top: 0;
                            color: #FFFFFF; /* Title color */
                        }
                        .popup-container p {
                            color: #AAAAAA; /* Light gray for the message text */
                            font-size: 14px;
                            margin: 15px 0;
                        }
                        .popup-container button {
                            background-color: #007BFF; /* Blue button */
                            color: #ffffff;
                            border: none;
                            padding: 10px 20px;
                            border-radius: 5px;
                            font-size: 14px;
                            cursor: pointer;
                            transition: background-color 0.3s ease;
                        }
                        .popup-container button:hover {
                            background-color: #0056b3; /* Darker blue on hover */
                        }
                    </style>
                </head>
                <body>
                    <div class="popup-container">
                        <h2>Task Complete!</h2>
                        <p>${message}</p>
                        <button id="closePopup">Close</button>
                    </div>
                </body>
            </html>
        `);

            popupWindow.document.getElementById('closePopup')?.addEventListener('click', () => {
                popupWindow.close();
            });
        } else alert('Pop-up blocked. Please allow pop-ups for this site.');
    }

    // Start the protocol (User pCN)
    public async startProtocol() {
        let signedMessage = await this.signMessage('startProtocol'),
            //console.log(`This is the signed message: ${signedMessage}`);
            //Gives the elements of the signature needed for the smart contract
            { messageHash, v, r, s } = this.recoverElementsSignature(
                signedMessage,
                'startProtocol'
            );
        try {
            const contract = await this.createContract();
            //console.log('Contract:', contract);
            //console.log('Signer:', contract.runner);
            //console.log('Function:', contract.interface.getFunction('startProtocol'));

            let messageReqEncode = Utils.utf8Encode('messageStart');
            const tx = await contract.startProtocol(messageReqEncode, messageHash, v, r, s);
            console.log('Transaction StartProtocol sent:', tx);
            // Wait for the transaction to be mined
            let receipt = await tx.wait(),
                //console.log('Transaction mined:', receipt);
                messageWindow = `The transaction has been mined with the hash: ${receipt.hash} in the block with number ${receipt.blockNumber} and hash ${receipt.blockHash}`;
            alert(messageWindow);
            console.log('Start Protocol transaction:', messageWindow);
            //this.showPopup(messageWindow);
        } catch (e) {
            console.log(`An error has occurred while sending the transaction: ${e}`);
        }
    }

    //Tool to create a signed message according to the protocol (User A)
    public async createSignedMessage(destination: string, userMesage: string) {
        this.switchAccount();
        //Creates the json of the message
        let messageReq = `A wants to send the message '${userMesage}' to B with adress ${destination} + ${Utils.createNonce()} + ${Date.now()}`;
        console.log(`ReqINA: ${messageReq}`);
        let signedMessage = await this.signMessage(messageReq),
            mI = `mI = (${signedMessage} + ${messageReq})\n`;
        console.log(`mI: ${mI}`);
        const z1 =
            '"proof": {"a": ["0x11","0x1f"],"b": [["0x29","0x14"],["0x23","0x20"]],"c": ["0x03","0x1a"]}';
        let m1 = `m1 = (${mI} + z1 = ${z1}) \n`;
        console.log(`m1: ${m1}`);
        let signedMessage2 = await this.signMessage(m1),
            m2 = `m2 = (${signedMessage2} + ${m1}) \n`;
        console.log(`m2: ${m2}`);
        //Gives the elements of the signature needed for the smart contract
        let { messageHash, v, r, s } = this.recoverElementsSignature(signedMessage2, m1);

        try {
            const contract = await this.createContract();
            let messageReqEncode = Utils.utf8Encode('messageGetInfo'),
                transMessageEncode = Utils.utf8Encode(m1);
            const tx = await contract.getTransferInfo(
                messageReqEncode,
                transMessageEncode,
                messageHash,
                v,
                r,
                s
            );
            console.log('Transaction getTransferInfo sent:', tx);
            // Wait for the transaction to be mined
            let receipt = await tx.wait(),
                //console.log('Transaction mined:', receipt);
                messageToBridge = `${m2} + b1 = ${receipt.blockHash}`,
                messageWindow = `The transaction has been mined with the hash: ${receipt.hash} in the block with number ${receipt.blockNumber} and hash ${receipt.blockHash}`;
            //Updating data to the bridge
            utils.updateData(messageToBridge);
            alert(messageWindow);
            console.log('Get Transfer Info transaction:', messageWindow);
            //this.showPopup(messageWindow);
        } catch (e) {
            console.log(`An error has occurred while sending the transaction: ${e}`);
        }
        setTimeout(() => {
            this.getAcknowledgement();
        }, 80000);
    }

    //Tool to get the acknowledgement  according to the protocol (User pCN)
    public async getAcknowledgement() {
        this.switchAccount();
        this.eventCatcher.listenForAnyEvent();
        let m5 = await utils.getData(),
            //console.log(`m5: ${m5}`);
            signedM5 = await this.signMessage(m5);
        this.m6 = `m6 = (${signedM5} + ${m5}) \n`;
        console.log(`m6: ${this.m6}`);
        this.createUIForAcknowledge(this.m6);

        let { messageHash, v, r, s } = this.recoverElementsSignature(signedM5, m5);

        // Validate parameters before sending the transaction
        if (!ethers.isHexString(messageHash, 32)) {
            console.error('Invalid messageHash: Must be a 32-byte hex string');
            return;
        }
        if (!ethers.isHexString(r, 32) || !ethers.isHexString(s, 32)) {
            console.error('Invalid r or s: Must be 32-byte hex strings');
            return;
        }
        if (v !== 27 && v !== 28) {
            console.error('Invalid v: Must be 27 or 28');
            return;
        }

        try {
            const contract = await this.createContract();
            //console.log('Contract:', contract);
            //console.log('Signer:', contract.runner);
            //console.log('Function Fragment:', contract.interface.getFunction('getAcknowledge'));
            let messageReqEncode = Utils.utf8Encode('messageAcknowledge'),
                transMessageEncode = Utils.utf8Encode(this.m6);
            //console.log('messageReqEncode:', messageReqEncode);
            //console.log('transMessageEncode:', transMessageEncode);
            //console.log('messageHash:', messageHash);
            //console.log('v:', v);
            //console.log('r:', r);
            //console.log('s:', s);
            const tx = await contract.getAcknowledge(
                messageReqEncode,
                transMessageEncode,
                messageHash,
                v,
                r,
                s
            );
            console.log('Transaction getAcknowledge sent:', tx);
            // Wait for the transaction to be mined
            const receipt = await tx.wait();
            //console.log('Transaction mined:', receipt);
            let messageWindow = `The transaction has been mined with the hash: ${receipt.hash} in the block with number ${receipt.blockNumber} and hash ${receipt.blockHash}`;
            //this.showPopup(messageWindow);
            alert(messageWindow);
            console.log('Get Transfer Info transaction:', messageWindow);
        } catch (e) {
            console.log(`An error has occurred while sending the transaction: ${e}`);
        }
    }

    public formatTransactionMessageWithColors = (message: string): string => {
        let level = 0; // Track the current nesting depth
        const result: string[] = []; // Store formatted characters

        for (const char of message)
            if (char === '(') {
                const color = this.colorLevels[level % this.colorLevels.length]; // Use color corresponding to the current level
                result.push(`<span style="color: ${color}">${char}</span>`);
                level++; // Increment AFTER assigning the color
            } else if (char === ')') {
                level--; // Decrement BEFORE assigning the color
                if (level < 0) {
                    console.error('Unbalanced parentheses detected in message!');
                    level = 0; // Reset level to avoid breaking further
                }
                const color = this.colorLevels[level % this.colorLevels.length]; // Use color corresponding to the current level
                result.push(`<span style="color: ${color}">${char}</span>`);
            } else result.push(char); // Non-parenthesis characters remain unchanged

        // Check for any unclosed parentheses at the end
        if (level > 0) console.error('Unbalanced parentheses detected at the end of the message!');

        return result.join(''); // Join the array back into a string
    };

    public createUIForAcknowledge = (transactionMessage: string): void => {
        const container = document.createElement('div');
        container.id = 'acknowledge-container';
        container.style.textAlign = 'left';
        container.style.padding = '20px';
        container.style.maxWidth = '1100px';
        container.style.margin = '0 auto';
        container.style.fontFamily = 'Arial, sans-serif';

        // Message content
        const messageContent = document.createElement('div');
        messageContent.style.marginBottom = '20px';
        messageContent.style.lineHeight = '1.6';
        messageContent.style.fontSize = '14px'; // Smaller text size
        messageContent.style.backgroundColor = '#1E1E1E'; // Slightly lighter background for text
        messageContent.style.padding = '15px';
        messageContent.style.borderRadius = '5px'; // Rounded corners for block
        messageContent.style.whiteSpace = 'pre-wrap'; // Preserve line breaks and wrap text
        messageContent.style.wordBreak = 'break-word'; // Prevent long strings from overflowing

        // Format the transaction message
        messageContent.innerHTML = `
    <p>You have received the following acknowledgement message from B:</p>
    <div>${this.formatTransactionMessageWithColors(transactionMessage)}</div>
  `;
        container.appendChild(messageContent);

        // Instruction text
        const instructionText = document.createElement('p');
        instructionText.style.marginBottom = '20px';
        instructionText.textContent = 'Press OK to acknowledge you received it.';
        container.appendChild(instructionText);

        // OK Button
        const button = document.createElement('button');
        button.textContent = 'OK';
        button.style.padding = '10px 20px';
        button.style.fontSize = '16px';
        button.style.cursor = 'pointer';
        button.style.color = '#fff';
        button.style.border = 'none';
        button.style.borderRadius = '5px';
        button.style.marginTop = '10px';
        button.style.transition = 'background-color 0.3s ease';
        button.style.backgroundColor = '#0056b3';

        button.addEventListener('click', async () => await this.getEndMessage());

        container.appendChild(button);

        // Append container to the body
        document.body.appendChild(container);
    };

    //Shows end messsage (User A)
    public async getEndMessage() {
        this.switchAccount();
        this.eventCatcher.listenForAnyEvent();

        const container = document.getElementById('acknowledge-container');
        if (container) container.remove();

        // Show "Protocol ending" message
        const messageContainer = document.createElement('div');
        messageContainer.id = 'protocolMessage'; // Unique ID for the message
        messageContainer.style.textAlign = 'center';
        messageContainer.style.padding = '20px';
        messageContainer.style.fontFamily = 'Arial, sans-serif';
        messageContainer.style.fontSize = '16px';
        messageContainer.style.marginTop = '20px';

        messageContainer.textContent = 'Thank you ! The protocol is concluding...'; // The message text

        // Append the message container to the body
        document.body.appendChild(messageContainer);

        let m7 = `m7 = (${this.m6} + ${Date.now()} + ${Utils.createNonce()}) \n`;
        console.log(`m7: ${m7}`);
        let signedMessage = await this.signMessage(m7);
        console.log(`This is the signed message: ${signedMessage}`);
        let m8 = `m8 = (${signedMessage} + ${m7}) \n`;
        console.log(`m8: ${m8}`);
        const z3 = '"proof": {"a": ["0x7c","0x9f"],"b": [["0x74","0x30"],["0x23","0xf7"]}';
        let m9 = `m9 = (${m8} + z3 = ${z3}) \n`;
        console.log(`m9: ${m9}`);
        let signedMessageM9 = await this.signMessage(m9),
            //console.log(`This is the signed message: ${signedMessageM9}`);
            m10 = `m10 = (${signedMessageM9} + ${m9}) \n`;
        console.log(`m10: ${m10}`);
        //Gives the elements of the signature needed for the smart contract
        let { messageHash, v, r, s } = this.recoverElementsSignature(signedMessageM9, m9);
        try {
            const contract = await this.createContract();
            let messageReqEncode = Utils.utf8Encode('messageEndMessage');
            const tx = await contract.getEndMessage(messageReqEncode, m9, messageHash, v, r, s);
            console.log('Get End Message Transaction sent:', tx);
            // Wait for the transaction to be mined
            const receipt = await tx.wait();
            //console.log('Transaction mined:', receipt);
            let messageWindow = `The transaction has been mined with the hash: ${receipt.hash} in the block with number ${receipt.blockNumber} and hash ${receipt.blockHash}`;
            alert(messageWindow);
            console.log('Get End Message transaction:', messageWindow);
            //let finalMesage = `${m10} + b3 = ${receipt.blockHash}`;
            console.log(
                `This is the final block: ${receipt.blockHash}, now the protocol will be finished`
            );
            //this.showPopup(messageWindow);
        } catch (e) {
            console.log(`An error has occurred while sending the transaction: ${e}`);
        }
        this.finishProtocol();
    }

    // Finishes the protocol
    public async finishProtocol() {
        this.switchAccount();
        this.eventCatcher.listenForAnyEvent();

        let signedMessage = await this.signMessage('finishProtocol'),
            //console.log(`This is the signed message: ${signedMessage}`);
            //Gives the elements of the signature needed for the smart contract
            { messageHash, v, r, s } = this.recoverElementsSignature(
                signedMessage,
                'finishProtocol'
            );
        try {
            const contract = await this.createContract();
            let messageReqEncode = Utils.utf8Encode('messageFinish');
            const tx = await contract.finishProtocol(messageReqEncode, messageHash, v, r, s);
            console.log('Finish protocol transaction sent:', tx);
            // Wait for the transaction to be mined
            const receipt = await tx.wait();
            //console.log('Transaction mined:', receipt);
            let messageWindow = `The transaction has been mined with the hash: ${receipt.hash} in the block with number ${receipt.blockNumber} and hash ${receipt.blockHash}`;
            console.log('Transaction:', messageWindow);
            //this.showPopup(messageWindow);
            alert(messageWindow);
            console.log('Finish Protocol transaction:', messageWindow);
        } catch (e) {
            console.log(`An error has occurred while sending the transaction: ${e}`);
        }
        const container = document.getElementById('protocolMessage');
        if (container) container.textContent = 'The protocol has concluded successfully!';
    }
}
