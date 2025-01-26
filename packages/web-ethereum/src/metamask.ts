import utils from './utils';

import config from '../data/config.json';

import { MetaMaskSDK } from '@metamask/sdk';
import { ethers, BrowserProvider } from 'ethers';
import Utils from '@thesis/common/utils/utils';
import TestContractABI from '@thesis/web-ethereum/smartContracts/TestContractABI.json';

import type { MetaMaskSDKOptions } from '@metamask/sdk';

export class Metamask {
    private sdk: MetaMaskSDK;
    public mainAccount?: string;
    private provider: BrowserProvider;
    private m6 = '';
    private connectedCallback?: () => void;

    //colors
    public colorLevels: string[] = ['#FF0000', '#00FF00', '#FFFF00', '#FF33FF', '#FF8000']; // Different colors for each nesting level

    public contract: ethers.Contract | null = null;

    public constructor(options?: MetaMaskSDKOptions) {
        this.sdk = new MetaMaskSDK(options);
        this.provider = new BrowserProvider(window.ethereum!);
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

    //Connects to the metamask wallet
    public async connect(): Promise<void> {
        try {
            if (!window.ethereum) return alert('Please install MetaMask!');
            let accounts: string[] = (await window.ethereum.request({
                method: 'eth_requestAccounts',
                params: []
            })) as string[];
            if (accounts.length === 0) return alert('No accounts found!');
            [this.mainAccount] = accounts;
            this.connectedCallback?.();
            console.log(accounts);
            console.log(`This are the accounts: ${accounts}`);
            console.log(`Connected to ${this.mainAccount}`);
        } catch (error) {
            console.error('Error connecting to MetaMask:', error);
        }
    }

    //Sign a message
    public async signMessage(message: string): Promise<string> {
        try {
            let signer = await this.provider.getSigner(),
                signature = await signer.signMessage(message),
                signerAccount = await signer.getAddress();
            console.log(`This is the signature: ${signature} and the address: ${signerAccount}`);
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
                </head>
                <body>
                    <h2>Task Complete!</h2>
                    <p>${message}</p>
                    <button id="closePopup">Close</button>
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
        let signedMessage = await this.signMessage('startProtocol');
        console.log(`This is the signed message: ${signedMessage}`);
        //Gives the elements of the signature needed for the smart contract
        let { messageHash, v, r, s } = this.recoverElementsSignature(
            signedMessage,
            'startProtocol'
        );
        try {
            const contract = await this.createContract();
            console.log('Contract:', contract);
            console.log('Signer:', contract.runner);
            console.log('Function:', contract.interface.getFunction('startProtocol'));

            let messageReqEncode = Utils.utf8Encode('messageStart');
            console.log('messageReqEncode:', typeof messageReqEncode);
            console.log('messageHash:', typeof messageHash);
            console.log('v:', typeof v);
            console.log('r:', typeof r);
            console.log('s:', typeof s);
            const tx = await contract.startProtocol(messageReqEncode, messageHash, v, r, s);
            console.log('Transaction sent:', tx);
            // Wait for the transaction to be mined
            const receipt = await tx.wait();
            console.log('Transaction mined:', receipt);
            let messageWindow = `The transaction has been mined with the hash: ${receipt.hash} in the block with number ${receipt.blockNumber} and hash ${receipt.blockHash}`;
            console.log('Transaction:', messageWindow);
            this.showPopup(messageWindow);
        } catch (e) {
            console.log(`An error has occurred while sending the transaction: ${e}`);
        }
    }

    //Tool to create a signed message according to the protocol (User A)
    public async createSignedMessage(destination: string, userMesage: string) {
        //Creates the json of the message
        let messageReq = `A wants to send the message '${userMesage}' to B with adress ${
            destination
        } + ${Utils.createNonce()} + ${Date.now()}`;
        console.log(`ReqINA: ${messageReq}`);
        let signedMessage = await this.signMessage(messageReq),
            mI = `mI = (${signedMessage} + ${messageReq})\n`;
        console.log(`mI: ${mI}`);
        let m1 = `m1 = (${mI} + z1) \n`;
        console.log(`m1: ${m1}`);
        let signedMessage2 = await this.signMessage(m1),
            m2 = `m2 = (${m1} + ${signedMessage2}) \n`;
        console.log(`m2: ${m2}`);
        //Gives the elements of the signature needed for the smart contract
        let { messageHash, v, r, s } = this.recoverElementsSignature(signedMessage2, m1);

        //TODO: Switch the accounts

        try {
            const contract = await this.createContract();
            console.log('Contract:', contract);
            console.log('Signer:', contract.runner);
            console.log('Function:', contract.interface.getFunction('getTransferInfo'));
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
            console.log('Transaction sent:', tx);
            // Wait for the transaction to be mined
            const receipt = await tx.wait();
            console.log('Transaction mined:', receipt);
            let messageToBridge = `${m2} + b1 = ${receipt.blockHash}`,
                messageWindow = `The transaction has been mined with the hash: ${receipt.hash} in the block with number ${receipt.blockNumber} and hash ${receipt.blockHash}`;
            //Updating data to the bridge
            utils.updateData(messageToBridge);
            this.showPopup(messageWindow);
        } catch (e) {
            console.log(`An error has occurred while sending the transaction: ${e}`);
        }
        setTimeout(() => {
            this.getAcknowledgement();
        }, 1000);
    }

    //Tool to get the acknowledgement  according to the protocol (User pCN)
    public async getAcknowledgement() {
        let bridgeInfo = await utils.getData(),
            signedM5 = await this.signMessage(bridgeInfo);
        this.m6 = `m6 = (${bridgeInfo} + ${signedM5})`;
        console.log(`m6: ${this.m6}`);
        this.createUIForAcknowledge(this.m6);

        let { messageHash, v, r, s } = this.recoverElementsSignature(signedM5, bridgeInfo);
        try {
            const contract = await this.createContract();
            let messageReqEncode = Utils.utf8Encode('messageAcknowledge'),
                transMessageEncode = Utils.utf8Encode(this.m6);
            const tx = await contract.getAcknowledge(
                messageReqEncode,
                transMessageEncode,
                messageHash,
                v,
                r,
                s
            );
            console.log('Transaction sent:', tx);
            // Wait for the transaction to be mined
            const receipt = await tx.wait();
            console.log('Transaction mined:', receipt);
            let messageWindow = `The transaction has been mined with the hash: ${receipt.hash} in the block with number ${receipt.blockNumber} and hash ${receipt.blockHash}`;
            this.showPopup(messageWindow);
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
    <p>You have received the following message:</p>
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

        let m7 = `m7 = (${this.m6} + ${Utils.createNonce()} + ${Date.now()}) \n`;
        console.log(`m7: ${m7}`);
        let signedMessage = await this.signMessage(m7);
        console.log(`This is the signed message: ${signedMessage}`);
        let m8 = `m8 = (${m7} + ${signedMessage}) \n`;
        console.log(`m8: ${m8}`);
        let m9 = `m9 = (${m8} + ` + `z3) \n`;
        console.log(`m9: ${m9}`);
        let signedMessageM9 = await this.signMessage(m9);
        console.log(`This is the signed message: ${signedMessageM9}`);
        let m10 = `m10 = (${m9} + ${signedMessageM9}) \n`,
            //Gives the elements of the signature needed for the smart contract
            { messageHash, v, r, s } = this.recoverElementsSignature(signedMessageM9, m9);
        try {
            const contract = await this.createContract();
            let messageReqEncode = Utils.utf8Encode('messageEndMessage');
            const tx = await contract.getEndMessage(messageReqEncode, m9, messageHash, v, r, s);
            console.log('Transaction sent:', tx);
            // Wait for the transaction to be mined
            const receipt = await tx.wait();
            console.log('Transaction mined:', receipt);
            let messageWindow = `The transaction has been mined with the hash: ${receipt.hash} in the block with number ${receipt.blockNumber} and hash ${receipt.blockHash}`;
            console.log('Transaction:', messageWindow);
            let finalMesage = `${m10}b3 = ${receipt.blockHash}`;
            console.log(
                `This is the final message: ${finalMesage}, now the protocol will be finished`
            );
            this.showPopup(messageWindow);
        } catch (e) {
            console.log(`An error has occurred while sending the transaction: ${e}`);
        }
        this.finishProtocol();
    }

    // Finishes the protocol
    public async finishProtocol() {
        let signedMessage = await this.signMessage('finishProtocol');
        console.log(`This is the signed message: ${signedMessage}`);
        //Gives the elements of the signature needed for the smart contract
        let { messageHash, v, r, s } = this.recoverElementsSignature(
            signedMessage,
            'finishProtocol'
        );
        try {
            const contract = await this.createContract();
            let messageReqEncode = Utils.utf8Encode('messageFinish');
            const tx = await contract.finishProtocol(messageReqEncode, messageHash, v, r, s);
            console.log('Transaction sent:', tx);
            // Wait for the transaction to be mined
            const receipt = await tx.wait();
            console.log('Transaction mined:', receipt);
            let messageWindow = `The transaction has been mined with the hash: ${receipt.hash} in the block with number ${receipt.blockNumber} and hash ${receipt.blockHash}`;
            console.log('Transaction:', messageWindow);
            this.showPopup(messageWindow);
        } catch (e) {
            console.log(`An error has occurred while sending the transaction: ${e}`);
        }
        const container = document.getElementById('protocolMessage');
        if (container) container.textContent = 'The protocol has concluded successfully!';
    }
}
