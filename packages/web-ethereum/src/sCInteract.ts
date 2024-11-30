import config from '@thesis/common/config';
import TestContractABI from '@thesis/web-ethereum/smartContracts/TestContractABI.json';
import { ethers, type BytesLike } from 'ethers';

export class sCInteract {
    public provider = new ethers.BrowserProvider(window.ethereum!);
    public contractAddress = config.smartContractAEthereumAddress;
    public contract = new ethers.Contract(
        config.smartContractAEthereumAddress,
        TestContractABI,
        this.provider
    );
}
