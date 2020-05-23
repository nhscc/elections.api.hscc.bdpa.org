/* @flow */

import { isAuthed } from 'multiverse/simple-auth-session'

import type { NextApiResponse } from 'next'
import type { NextParamsRRWithSession } from 'multiverse/simple-auth-session'

export type GenericHandlerParams = NextParamsRRWithSession & { methods: string[] };
export type AsyncHandlerCallback = (params: NextParamsRRWithSession) => Promise<void>;

/**
 * Generic middleware to handle any api endpoint. You can give it an empty async
 * handler function to trigger a 501 not implemented (to stub out API
 * endpoints).
 */
export async function handleEndpoint(fn: AsyncHandlerCallback, { req, res, methods }: GenericHandlerParams): Promise<void> {
    if(!req.method || !methods.includes(req.method))
        res.status(405).send({ error: `method ${req.method} is not allowed` });

    else {
        try {
            const resp = res as NextApiResponse<object> & { $send: typeof res.send };
            // ? This will let us know if the sent method was called
            let sent = false;

            resp.$send = resp.send;
            resp.send = (...args): void => (sent = true) && resp.$send(...args);

            await fn({ req, res: resp });

            // ? If the response hasn't been sent yet, send one now
            !sent && resp.status(400).send({ error: 'bad request' });
        }
        catch(error) { res.status(400).send({ error: error.message }); }
    }
}

/**
 * Generic middleware to handle any api endpoint with required authentication
 */
export async function handleAuthedEndpoint(fn: AsyncHandlerCallback, { req, res, methods }: GenericHandlerParams): Promise<void> {
    if(!await isAuthed({ req, res }))
        res.status(401).send({error: 'missing authentication key' });

    else
        await handleEndpoint(fn, { req, res, methods });
}
