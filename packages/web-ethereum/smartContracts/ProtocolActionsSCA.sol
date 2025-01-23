// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.2 <0.9.0;

contract TestSmartContractSCA{

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
    
  
    //Function that starts the protocol
    function startProtocol(string memory _messageOperation, bytes32 _messageHash, uint8 _v, bytes32 _r, bytes32 _s)  external {
        if (keccak256(abi.encodePacked(_messageOperation)) == keccak256(abi.encodePacked("messageStart"))) {
            protocolActive = true;
            emit  ProtocolStartedA(msg.sender, "ProtocolStartedA: Protocol Started Successfully", block.timestamp);
        } else {
            emit ProtocolStartErrorA(msg.sender, "ProtocolStartErrorA: There was an error with the start, couldn't validate signature", block.timestamp);
        }
    }
  
    //Function from when A sends the message of the info wanted to be transfered
    function getTransferInfo(string memory _messageRequest, string memory _transactionMessage, bytes32 _messageHash, uint8 _v, bytes32 _r, bytes32 _s) public payable {
        require(protocolActive == true, "The protocol must be active");
        if (keccak256(abi.encodePacked(_messageRequest)) == keccak256(abi.encodePacked("messageGetInfo"))){
            //Send transaction
            messageTransfer = _messageRequest;
            bytes memory payload = abi.encodeWithSignature("TransferMessageTransaction", _transactionMessage);
            (bool sentFirstT, ) = payable(storedPublicKeypCN).call{value: msg.value}(payload);
            if(sentFirstT){
                emit TransferMessageCommittedA(msg.sender, "TransferMessageCommittedA: The signer of this transaction requests transmitting the attached message to the recepient",_messageRequest, block.timestamp);
            }
            else{
                emit TransferMessageErrorA(msg.sender, "TransferMessageErrorA: There was an error with the transaction of the message request provided",_messageRequest, block.timestamp);
            }
        } else {
            emit TransferMessageErrorA(msg.sender, "TransferMessageErrorA: There was an error with the message request provided",_messageRequest, block.timestamp);
        }
    }

    //Function when pCN sends the acknowledgement message
    function getAcknowledge(string memory _messageRequest, string memory _transactionMessage, bytes32 _messageHash, uint8 _v, bytes32 _r, bytes32 _s) external {
        require(protocolActive == true, "The protocol must be active");
        if (keccak256(abi.encodePacked(_messageRequest)) == keccak256(abi.encodePacked("messageAcknowledge"))){
            emit AcknowledgeMessageCommittedA(msg.sender, "AcknowledgeMessageCommittedA: The signer of this transaction requests transmitting the attached message to the recepient",_transactionMessage, block.timestamp);
        } else {
            emit AcknowledgeMessageErrorA(msg.sender, "AcknowledgeMessageErrorA: There was an error with the message request provided",_messageRequest, block.timestamp);
        }
    }

    //Function when A sends the end message
    function getEndMessage(string memory _messageRequest,string memory _transactionMessage, bytes32 _messageHash, uint8 _v, bytes32 _r, bytes32 _s) external {
        require(protocolActive == true, "The protocol must be active");
        if (keccak256(abi.encodePacked(_messageRequest)) == keccak256(abi.encodePacked("messageEndMessage"))){
            //Send transaction
            bytes memory payload = abi.encodeWithSignature("EndMessageTransaction", _transactionMessage);
            (bool sentThirdtT, ) = payable(storedPublicKeypCN).call{value: 0}(payload);
            if(sentThirdtT){
                emit EndMessageCommittedA(msg.sender, "EndMessageCommittedA: The signer of this transaction requests transmitting the attached message to the recepient",_messageRequest, block.timestamp);
            }
            else{
                emit EndMessageErrorA(msg.sender, "EndMessageErrorA: There was an error with the transaction of the message request provided",_messageRequest, block.timestamp);
            }
        } else {
            emit EndMessageErrorA(msg.sender, "EndMessageErrorA: There was an error with the message request provided",_messageRequest, block.timestamp);
        }
    }

    //Finish protocol
    function finishProtocol(string memory _messageOperation, bytes32 _messageHash, uint8 _v, bytes32 _r, bytes32 _s) external {
        require(protocolActive == true, "The protocol must be active");
        if (keccak256(abi.encodePacked(_messageOperation)) == keccak256(abi.encodePacked("messageFinish"))){
            protocolActive = false;
            emit  ProtocolFinishedA(msg.sender, "ProtocolFinishedA: Protocol Finished Successfully", block.timestamp);
        } else {
            emit ProtocolFinishedErrorA(msg.sender, "ProtocolFinishedErrorA: There was an error with the finish, couldn't validate signature", block.timestamp);
        }
    }
}