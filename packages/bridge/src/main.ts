import crypto from 'node:crypto';

import API from './api';

export default class Main {
    private api: API = new API();

    public constructor() {
        console.log('Hello World!');

        console.log(crypto.randomBytes(16).toString('hex'));
    }
}

new Main();
