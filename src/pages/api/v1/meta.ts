//import { getElectionMetadata } from 'universe/backend'
import { sendHttpOk } from 'multiverse/respond'
import { handleEndpoint } from 'universe/backend/middleware'

import type { NextApiResponse, NextApiRequest } from 'next'

export { config } from 'universe/backend/middleware';

export default async function(req: NextApiRequest, res: NextApiResponse) {
    await handleEndpoint(async ({ res }) => {
        sendHttpOk(res, process.env);
    }, { req, res, methods: [ 'GET' ] });
}
