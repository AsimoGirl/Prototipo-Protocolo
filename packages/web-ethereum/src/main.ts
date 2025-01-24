import { Metamask } from './metamask';
import { EventCatcher } from './eventCatcher';
import utils from './utils';

import config from '../data/config.json';

export default class Main {
    //Connect to metamask
    public metamask: Metamask = new Metamask({
        dappMetadata: {
            name: 'Bridge Dapp'
        },
        preferDesktop: true,
        infuraAPIKey: config.INFURA_API_KEY
    });

    public eventCatcher: EventCatcher = new EventCatcher();

    public connectButton: HTMLButtonElement = document.querySelector('#connect-button')!;

    // Input container for destination.
    public destinationInputContainer: HTMLElement = document.querySelector('#destination-input')!;
    public destinationInputField: HTMLInputElement = document.querySelector(
        '#destination-input-field'
    )!;

    // Operation container for message.
    public operationInputContainer: HTMLElement = document.querySelector('#operation-input')!;
    public operationInputField: HTMLInputElement =
        document.querySelector('#operation-input-field')!;

    // Input container for message.
    public messageInputContainer: HTMLElement = document.querySelector('#message-input')!;
    public messageInputField: HTMLInputElement = document.querySelector('#message-input-field')!;

    // Text description
    public textInfo: HTMLElement = document.querySelector('#text-info')!;

    //Loading window
    public loadingWindow: HTMLElement = document.querySelector('#loading-window')!;
    public loadingWindowContainer: HTMLElement = document.querySelector(
        '#loading-window-container'
    )!;

    //Shows the input fields
    private showInput() {
        this.destinationInputContainer.style.display = 'flex';
        this.operationInputContainer.style.display = 'flex';
        this.messageInputContainer.style.display = 'flex';
    }

    //Hides the input fields
    private hideInput() {
        this.destinationInputContainer.style.display = 'none';
        this.operationInputContainer.style.display = 'none';
        this.messageInputContainer.style.display = 'none';
    }

    //Shows the loading window
    private showLoadingWindow() {
        this.loadingWindowContainer.style.display = 'flex';
    }

    public constructor() {
        this.connectButton.addEventListener('click', this.connect.bind(this));

        //Button that starts the information exchange protocol
        this.metamask.onConnected(() => {
            this.connectButton.textContent = 'Start the information exchange protocol';
            this.textInfo.hidden = true;
            this.showInput();
            this.messageInputField.focus();
        });

        utils.updateData('String I want to save - from ethereum');

        this.testEthereumData();
    }

    private async testEthereumData() {
        // Obtain the response from the bridge with the ethereum data.
        let data = await utils.getData();

        // The string from the bridge.
        console.log('Received the following data for Solana from the bridge: ');
        console.log(data);
    }

    //Connects to the metamask wallet
    private async connect() {
        if (this.metamask.mainAccount) {
            this.eventCatcher.listenForAnyEvent();
            //Makes all the functionality when you create the message and call getTransferInfo
            this.signFirstMessage();
            console.log(`Connected to ${this.metamask.mainAccount}`);
            //It would follow
        } else this.metamask.connect();
    }

    //Works to sign the first message
    private async signFirstMessage() {
        let operationMessage = this.operationInputField.value,
            userMesage = this.messageInputField.value,
            destination = this.destinationInputField.value;
        this.metamask.createSignedMessage(destination, operationMessage, userMesage);
        this.hideInput();
    }
}

new Main();
