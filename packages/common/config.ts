import fs from 'node:fs/promises';

import dotenv from 'dotenv-extended';
import dotenvParseVariables from 'dotenv-parse-variables';

export interface Config {
    // API Keys
    infuraApiKey: string;
    etherScanApiKey: string;
    alchemyApiKey: string;
    chainstackApiKey: string;

    // Addresses
    userAEthereumAddress: string;
    networkLeaderEthereumAddress: string;
    networkLeaderSolanaAddress: string;
    userBSolanaAddress: string;

    // Smart contracts
    smartContractAEthereumAddress: string;
    smartContractBSolanaAddress: string;
}

console.debug(`Loading env values from [.env] with fallback to [.env.defaults]`);

function camelCase(str: string): string {
    return str
        .toLowerCase()
        .replaceAll(/([_-][a-z])/g, (group) =>
            group.toUpperCase().replace('-', '').replace('_', '')
        );
}

let { NODE_ENV } = process.env,
    env = dotenv.load({
        path: `../../.env`,
        defaults: '../../.env.defaults'
    }),
    nodeEnvConfig = `../../.env.${NODE_ENV}`,
    nodeEnvConfigExists = await fs.stat(nodeEnvConfig).catch(() => false);

if (NODE_ENV && nodeEnvConfigExists) {
    console.debug(`Loading additional env values from [.env.${NODE_ENV}]`);

    Object.assign(env, dotenv.load({ path: nodeEnvConfig }));
}

let envConfig = dotenvParseVariables(env),
    config = {} as Config;

for (let key in envConfig) {
    let camelCaseKey = camelCase(key) as keyof Config;

    config[camelCaseKey] = envConfig[key] as never;
}

export function exposedConfig<T extends keyof Config>(...keys: T[]) {
    let exposed = {} as Pick<Config, T>;

    for (let key of keys) exposed[key] = config[key];

    return exposed;
}

export default config;
