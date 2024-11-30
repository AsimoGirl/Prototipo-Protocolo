import config from '@thesis/common/config';
import Utils from '@thesis/common/utils/utils';
import TestContractABI from '@thesis/web-ethereum/smartContracts/TestContractABI.json';
import { ethers } from 'ethers';

export class EventCatcher {
    //Create a provider
    public provider = ethers.getDefaultProvider('sepolia', {
        //etherscan: ETHER_SCAN_API_KEY,
        infura: config.infuraApiKey,
        alchemy: config.alchemyApiKey,
        chainstack: config.chainstackApiKey,
        exclusive: ['infura', 'alchemy', 'chainstack']
    });

    public contractAddress = config.smartContractAEthereumAddress;

    //Duration in milliseconds (90 seconds) of the time to look for events
    public duration = 90000;

    // Create a contract instance
    public contract = new ethers.Contract(this.contractAddress, TestContractABI, this.provider);

    // Define the event handler function
    public handleEvent(args: ethers.ContractEventPayload[] | null = null) {
        // Check if args is valid and has at least one element
        if (!args || args.length === 0) {
            console.error('Invalid or empty event args');
            return;
        }
        console.log(args);
        // Safely access the last element's log property
        let eventLog = args[args.length - 1].log;
        if (!eventLog) {
            console.error('Event log not found');
            return;
        }

        // Safely extract common properties from every the event log
        let { blockNumber } = eventLog,
            { blockHash } = eventLog,
            { eventName } = eventLog;
        // Handle the event based on its name
        switch (eventName) {
            case 'ProtocolStartedA': {
                console.log('Catched Event ProtocolStartedA');
                try {
                    let [starter, description] = eventLog.args,
                        timestamp = eventLog.args[2].toString(),
                        protocolStartedEventData = {
                            starter,
                            description,
                            timestamp,
                            blocknumber: blockNumber,
                            blockhash: blockHash
                        },
                        protocolStartedEvent = JSON.stringify(protocolStartedEventData);
                    console.log(protocolStartedEvent);
                } catch (error) {
                    console.error('Error handling ProtocolStartedA event:', error);
                }
                break;
            }
            case 'ProtocolStartErrorA':
                console.log(
                    `Catched An Error Event ProtocolStartErrorA in the block with number `,
                    { blockNumber },
                    ` and hash`,
                    { blockHash }
                );
                break;
            case 'TransferMessageCommittedA':
                console.log('Catched Event TransferMessageCommittedA');
                try {
                    let [starter, description, messageContent] = eventLog.args,
                        timestamp = eventLog.args[3].toString(),
                        protocolGetTransferInfoEventData = {
                            starter,
                            description,
                            messageContent,
                            timestamp,
                            blocknumber: blockNumber,
                            blockhash: blockHash
                        },
                        protocolGetTransferInfoEvent = JSON.stringify(
                            protocolGetTransferInfoEventData
                        );
                    console.log(protocolGetTransferInfoEvent);
                } catch (error) {
                    console.error('Error handling ProtocolStartedA event:', error);
                }
                break;
            case 'TransferMessageErrorA':
                console.log(
                    `Catched An Error Event TransferMessageErrorA in the block with number `,
                    { blockNumber },
                    ` and hash`,
                    { blockHash }
                );
                break;
            case 'AcknowledgeMessageCommittedA':
                console.log('Catched Event AcknowledgeMessageCommittedA');
                break;
            case 'AcknowledgeMessageErrorA':
                console.log(
                    `Catched An Error Event AcknowledgeMessageErrorA in the block with number `,
                    { blockNumber },
                    ` and hash`,
                    { blockHash }
                );
                break;
            case 'EndMessageCommittedA':
                console.log('Catched Event EndMessageCommittedA');
                break;
            case 'EndMessageErrorA':
                console.log(
                    `Catched An Error Event EndMessageErrorA in the block with number `,
                    { blockNumber },
                    ` and hash`,
                    { blockHash }
                );
                break;
            case 'ProtocolFinishedA':
                console.log('Catched Event ProtocolFinishedA');
                break;
            case 'ProtocolFinishedErrorA':
                console.log(
                    `Catched An Error Event ProtocolFinishedErrorA in the block with number `,
                    { blockNumber },
                    ` and hash`,
                    { blockHash }
                );
                break;
            default:
                console.log('Unhandled event:', args);
        }
    }

    //Function that listens to any event that ocurs in the smart contract
    public async listenForAnyEvent() {
        try {
            // Set up the timeout action
            let timeout = setTimeout(() => {
                console.log('Stopping event listener after 90 seconds.');
                this.contract.off('*');
            }, this.duration);
            await this.contract.once('*', (...args) => {
                // Clear the timeout if the event is detected
                clearTimeout(timeout);
                //Calls the event handler function
                this.handleEvent(args);
            });
        } catch (error) {
            console.error('Error fetching events:', error);
        }
    }

    //Shows all the events on the smart contract that have the name eventName, * is for all events
    public async getAllEvents(eventName: string) {
        const transferEvents = await this.contract.queryFilter(eventName, 0, 'latest');
        transferEvents.forEach((event) => {
            console.log('Event:', event);
            console.log('Event Block:', event.blockNumber);
            console.log('Event Hash:', event.blockHash);
            console.log('Event Data:', event.data);
            let parsedLog = this.contract.interface.parseLog(event);
            if (parsedLog) console.log(parsedLog.args);
        });
    }
}
