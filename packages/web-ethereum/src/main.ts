import { Metamask } from './metamask';
import { EventCatcher } from './eventCatcher';

import config from '@thesis/common/config';

export default class Main {
    //Connect to metamask
    public metamask: Metamask = new Metamask({
        dappMetadata: {
            name: 'Bridge Dapp'
        },
        preferDesktop: true,
        infuraAPIKey: config.infuraApiKey
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
    }

    //Connects to the metamask wallet
    private async connect() {
        if (this.metamask.mainAccount) {
            this.eventCatcher.listenForAnyEvent();
            this.signFirstMessage();
            //let signedMessage = this.operationInputField.value,
            //    messageReq = this.messageInputField.value;
            //this.metamask.getValuesSignatures(signedMessage, messageReq);
            console.log(`Connected to ${this.metamask.mainAccount}`);
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
