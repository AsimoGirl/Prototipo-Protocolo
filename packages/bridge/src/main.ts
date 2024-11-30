import crypto from 'node:crypto';

export default class Main {
    public constructor() {
        console.log('Hello World!');

        console.log(crypto.randomBytes(16).toString('hex'));
    }
}

new Main();
