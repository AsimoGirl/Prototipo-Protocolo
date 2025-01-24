export default {
    /**
     * Makes a request to the bridge attempting to obtain data about the solana network.
     */

    async getData() {
        // The response from the bridge.
        let response = await fetch('http://127.0.0.1:8080/request?type=solana', {
            method: 'GET'
        });

        // Response failed to fetch anything.
        if (!response) return { info: '' };

        // Convert the response to a JSON with the information received.
        let data = await response.json();

        // If there is no 'info' in data, then the object is malformed.
        if (!('info' in data)) return console.log('No data found for Solana.');

        return data.info;
    },

    /**
     * Updates the information for the ethereum on the bridge.
     */

    async updateData(info: string): Promise<void> {
        await fetch('http://127.0.0.1:8080/update', {
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json'
            },
            method: 'POST',
            body: JSON.stringify({
                type: 'ethereum',
                info
            })
        });
    }
};
