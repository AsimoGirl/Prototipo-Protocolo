import { MetaMaskSDK } from '@metamask/sdk';
import { ethers, BrowserProvider } from 'ethers';
import Utils from '@thesis/common/utils/utils';
import config from '@thesis/common/config';
import TestContractABI from '@thesis/web-ethereum/smartContracts/TestContractABI.json';

import type { MetaMaskSDKOptions } from '@metamask/sdk';

export class Metamask {
    private sdk: MetaMaskSDK;
    public mainAccount?: string;

    private provider: BrowserProvider;

    private connectedCallback?: () => void;

    public contract: ethers.Contract | null = null;

    public constructor(options?: MetaMaskSDKOptions) {
        this.sdk = new MetaMaskSDK(options);
        this.provider = new BrowserProvider(window.ethereum!);
    }

    private async createContract(): Promise<ethers.Contract> {
        if (!this.contract) {
            const signer = await this.provider.getSigner();
            this.contract = new ethers.Contract(
                config.smartContractAEthereumAddress,
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

    //Tool to create a signed message according to the protocol
    public async createSignedMessage(
        destination: string,
        operationMessage: string,
        userMesage: string
    ) {
        //Creates the json of the message
        let messageReq = Utils.embedMessage(destination, operationMessage, userMesage),
            signedMessage = await this.signMessage(messageReq);

        //await this.verifyMessage(messageReq, signedMessage, this.mainAccount!);
        //let encodedMessage = Utils.hexEncode(messageReq);
        console.log(`This is the signed message: ${signedMessage}`);
        //Gives the elements of the signature needed for the smart contract
        let { messageHash, v, r, s } = this.recoverElementsSignature(signedMessage, messageReq);
        try {
            const contract = await this.createContract();
            console.log('Contract:', contract);
            console.log('Signer:', contract.runner);
            console.log('Function:', contract.interface.getFunction('getTransferInfo'));
            //const txTest = await contract.protocolActive();
            //console.log('Transaction:', txTest);

            let transMessage = 'Hello World',
                //messageReqEncode = Utils.utf8Encode(messageReq),
                messageReqEncode = Utils.utf8Encode('messageGetInfo'),
                transMessageEncode = Utils.utf8Encode(messageReq);
            console.log('messageReqEncode:', typeof messageReqEncode);
            console.log('transMessageEncode:', typeof transMessageEncode);
            console.log('messageHash:', typeof messageHash);
            console.log('v:', typeof v);
            console.log('r:', typeof r);
            console.log('s:', typeof s);
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
            let messageWindow = `The transaction has been mined with the hash: ${receipt.hash} in the block with number ${receipt.blockNumber} and hash ${receipt.blockHash}`;
            this.showPopup(messageWindow);
        } catch (e) {
            console.log(`An error has occurred while sending the transaction: ${e}`);
        }
    }
}
