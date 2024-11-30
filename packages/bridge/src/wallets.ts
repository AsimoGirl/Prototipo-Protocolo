import { MetaMaskSDK } from '@metamask/sdk';

import type { MetaMaskSDKOptions, SDKProvider } from '@metamask/sdk';

export class Wallets {
    private sdk: MetaMaskSDK;

    public constructor(options: MetaMaskSDKOptions) {
        this.sdk = new MetaMaskSDK(options);
    }

    public async connect(): Promise<SDKProvider> {
        return this.sdk.connect() as Promise<SDKProvider>;
    }
}
