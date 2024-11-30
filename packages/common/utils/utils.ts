import utf8 from 'utf8';

export default {
    hexEncode(data: string): string {
        let buffer = '';

        for (let i = 0; i < data.length; i++) buffer += data.charCodeAt(i).toString(16);

        return buffer;
    },

    hexDecode(data: string): string {
        let buffer = '';

        for (let i = 0; i < data.length; i++) {
            buffer += String.fromCharCode(parseInt(data.substr(i, 2), 16));

            i++;
        }

        return buffer;
    },

    toHexadecimal(input: string): string {
        return Array.from(input)
            .map((char) => char.charCodeAt(0).toString(16).padStart(2, '0'))
            .join('');
    },

    utf8Encode(data: string): string {
        return utf8.encode(data);
    },

    utf8Decode(data: string): string {
        return utf8.decode(data);
    },

    createNonce(): string {
        return this.hexEncode((Date.now() * Math.random()).toString());
    },

    embedMessage(destination: string, operation: string, message: string): string {
        let data = {
            destination,
            operation,
            message,
            timestamp: Date.now(),
            nonce: this.createNonce()
        };
        return JSON.stringify(data);
    }
};
