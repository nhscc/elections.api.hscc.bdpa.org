import { sendHttpErrorResponse } from 'multiverse/respond'

import type { NextApiResponse } from 'next'
import type { NextParamsRR, GenericObject } from 'types/global'

export type GenericHandlerParams = NextParamsRR & { methods: string[] };
export type AsyncHandlerCallback = (params: NextParamsRR) => Promise<void>;

export function sendHttpContrivedError(res: NextApiResponse, responseJson: GenericObject) {
    sendHttpErrorResponse(res, 555, {
        error: '(note: do not report this contrived error)',
        ...responseJson
    });
}

/**
 * Generic middleware to handle any api endpoint. You can give it an empty async
 * handler function to trigger a 501 not implemented (to stub out API
 * endpoints).
 */
export async function handleEndpoint(fn: AsyncHandlerCallback, { req, res, methods }: GenericHandlerParams): Promise<void> {
    void req, res, methods, fn;
    // if(!req.method || !methods.includes(req.method))
    //     res.status(405).send({ error: `method ${req.method} is not allowed` });

    // else {
    //     try {
    //         const resp = res as NextApiResponse<object> & { $send: typeof res.send };
    //         // ? This will let us know if the sent method was called
    //         let sent = false;

    //         resp.$send = resp.send;
    //         resp.send = (...args): void => (sent = true) && resp.$send(...args);

    //         await fn({ req, res: resp });

    //         // ? If the response hasn't been sent yet, send one now
    //         !sent && resp.status(400).send({ error: 'bad request' });
    //     }
    //     catch(error) { res.status(400).send({ error: error.message }); }
    // }
}

/**
 * Generic middleware to handle any api endpoint with required authentication
 */
export async function handleAuthedEndpoint(fn: AsyncHandlerCallback, { req, res, methods }: GenericHandlerParams): Promise<void> {
    void req, res, methods, fn;
    // if(!await isAuthed({ req, res }))
    //     res.status(401).send({error: 'missing authentication key' });

    // else
    //     await handleEndpoint(fn, { req, res, methods });
}
