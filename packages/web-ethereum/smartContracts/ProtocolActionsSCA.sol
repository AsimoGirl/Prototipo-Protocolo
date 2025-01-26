// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.2 <0.9.0;

contract ProtocolActionsSCA{

    address public storedPublicKeyA;
    address public storedPublicKeypCN;
    bool public protocolActive = false;
    string public messageTransfer;
    string public acknowledgeMessage;
    string public endMessage;


    //Asign the addresses
    constructor(address _publicKeypCN) {
        storedPublicKeyA = msg.sender;
        storedPublicKeypCN = _publicKeypCN;
    }

    //Declaration of the events
    event ProtocolStartedA(address indexed _starter, string _description, uint _timestamp); 
    event ProtocolStartErrorA(address indexed _starter, string _description, uint _timestamp); 

    event TransferMessageCommittedA(address indexed _starter, string _description, string _messageContent, uint _timestamp); 
    event TransferMessageErrorA(address indexed _starter, string _description, string _messageContent, uint _timestamp); 

    event AcknowledgeMessageCommittedA(address indexed _starter, string _description, string _messageContent, uint _timestamp); 
    event AcknowledgeMessageErrorA(address indexed _starter, string _description, string _messageContent, uint _timestamp); 
    
    event EndMessageCommittedA(address indexed _starter, string _description, string _messageContent, uint _timestamp); 
    event EndMessageErrorA(address indexed _starter, string _description, string _messageContent, uint _timestamp);

    event ProtocolFinishedA(address indexed _starter, string _description, uint _timestamp); 
    event ProtocolFinishedErrorA(address indexed _starter, string _description, uint _timestamp);
    
    //Modifiers to prevent impersonation attacks
    modifier onlyNetworkLeader(){
        require(msg.sender == storedPublicKeypCN, "Only the network leader pCN can do that action");
        _;
    }

    modifier onlyCreator(){
        require(msg.sender == storedPublicKeyA, "Only the contract creator A can do that action");
        _;
    }
    
    // Recover the address associated with the public key from the signature
    function getSigner(bytes32 _messageHash, uint8 _v, bytes32 _r, bytes32 _s) internal pure returns (address) {
        return ecrecover(_messageHash, _v, _r, _s);
    }

    //Function that starts the protocol
    function startProtocol(string memory _messageOperation, bytes32 _messageHash, uint8 _v, bytes32 _r, bytes32 _s) onlyNetworkLeader external {
        address messageSigner = getSigner(_messageHash, _v, _r, _s);
        if (keccak256(abi.encodePacked(_messageOperation)) == keccak256(abi.encodePacked("messageStart")) && messageSigner == storedPublicKeypCN){
            protocolActive = true;
            emit  ProtocolStartedA(msg.sender, "ProtocolStartedA: Protocol Started Successfully", block.timestamp);
        } else {
            emit ProtocolStartErrorA(msg.sender, "ProtocolStartErrorA: There was an error with the start, couldn't validate signature", block.timestamp);
        }
    }
  
    //Function from when A sends the message of the info wanted to be transfered
    function getTransferInfo(string memory _messageRequest, string memory _transactionMessage, bytes32 _messageHash, uint8 _v, bytes32 _r, bytes32 _s) onlyCreator external {
        require(protocolActive == true, "The protocol must be active");
        address messageSigner = getSigner(_messageHash, _v, _r, _s);
        if (keccak256(abi.encodePacked(_messageRequest)) == keccak256(abi.encodePacked("messageGetInfo")) && messageSigner == storedPublicKeyA){
                emit TransferMessageCommittedA(msg.sender, "TransferMessageCommittedA: The signer of this transaction requests transmitting the attached message to the recepient",_transactionMessage, block.timestamp);            
        } else {
            emit TransferMessageErrorA(msg.sender, "TransferMessageErrorA: There was an error with the message request provided",_transactionMessage, block.timestamp);
        }
    }

    //Function when pCN sends the acknowledgement message
    function getAcknowledge(string memory _messageRequest, string memory _transactionMessage, bytes32 _messageHash, uint8 _v, bytes32 _r, bytes32 _s) onlyNetworkLeader external {
        require(protocolActive == true, "The protocol must be active");
        address messageSigner = getSigner(_messageHash, _v, _r, _s);
        if (keccak256(abi.encodePacked(_messageRequest)) == keccak256(abi.encodePacked("messageAcknowledge")) && messageSigner == storedPublicKeypCN){
            emit AcknowledgeMessageCommittedA(msg.sender, "AcknowledgeMessageCommittedA: The signer of this transaction requests transmitting the attached message to the recepient",_transactionMessage, block.timestamp);
        } else {
            emit AcknowledgeMessageErrorA(msg.sender, "AcknowledgeMessageErrorA: There was an error with the message request provided",_transactionMessage, block.timestamp);
        }
    }

    //Function when A sends the end message
    function getEndMessage(string memory _messageRequest,string memory _transactionMessage, bytes32 _messageHash, uint8 _v, bytes32 _r, bytes32 _s) onlyCreator external { 
        require(protocolActive == true, "The protocol must be active");
        address messageSigner = getSigner(_messageHash, _v, _r, _s);
        if (keccak256(abi.encodePacked(_messageRequest)) == keccak256(abi.encodePacked("messageEndMessage")) && messageSigner == storedPublicKeyA){
                emit EndMessageCommittedA(msg.sender, "EndMessageCommittedA: The signer of this transaction requests transmitting the attached message to the recepient",_transactionMessage, block.timestamp);
            }
                        
         else {
            emit EndMessageErrorA(msg.sender, "EndMessageErrorA: There was an error with the message request provided",_transactionMessage, block.timestamp);
        }
    }

    //Finish protocol
    function finishProtocol(string memory _messageOperation, bytes32 _messageHash, uint8 _v, bytes32 _r, bytes32 _s) onlyNetworkLeader external {
        require(protocolActive == true, "The protocol must be active");
        address messageSigner = getSigner(_messageHash, _v, _r, _s);
        if (keccak256(abi.encodePacked(_messageOperation)) == keccak256(abi.encodePacked("messageFinish")) && messageSigner == storedPublicKeypCN){
            protocolActive = false;
            emit  ProtocolFinishedA(msg.sender, "ProtocolFinishedA: Protocol Finished Successfully", block.timestamp);
        } else {
            emit ProtocolFinishedErrorA(msg.sender, "ProtocolFinishedErrorA: There was an error with the finish, couldn't validate signature", block.timestamp);
        }
    }
}