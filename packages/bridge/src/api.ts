import cors from 'cors';
import express from 'express';

import type { Request, Response, Express, Router } from 'express';

export default class API {
    private ethereumData = {
        info: ''
    };

    private solanaData = {
        info: ''
    };

    public constructor() {
        let app: Express = express(),
            router: Router = express.Router();

        app.use(express.urlencoded({ extended: true }), cors(), express.json());

        router.get('/', this.handleRoot.bind(this));
        router.post('/update', this.handleUpdate.bind(this));
        router.get('/request', this.handleRequest.bind(this));

        app.use('/', router).listen(8080, () => {
            console.log('Bridge is now listening on port 8080.');
        });
    }

    private handleRoot(_request: Request, response: Response): void {
        response.json({ status: 'Hello' });
    }

    private handleUpdate(request: Request, response: Response): void {
        let { body } = request;

        // No body, no action.
        if (!body) {
            response.json({ error: 'invalid' });
            return;
        }

        console.log('Saving');
        console.log(body);

        // Update the data depending on the type.
        if (body.type === 'ethereum') this.ethereumData.info = body.info;
        else if (body.type === 'solana') this.solanaData.info = body.info;

        response.json({ status: 'success' });
    }

    private handleRequest(request: Request, response: Response): void {
        let { type } = request.query;

        console.log(`Received request from: ${request}`);

        if (type === 'solana') response.json({ info: this.solanaData.info });
        else response.json({ info: this.ethereumData.info });
    }
}
