import { handleEndpoint } from 'universe/backend/middleware'
import { getPublicElections, upsertElection } from 'universe/backend'
import { sendHttpOk, sendHttpBadRequest } from 'multiverse/respond'
import { NotFoundError } from 'universe/backend/error'
import { ObjectId } from 'mongodb'

import type { NextApiResponse, NextApiRequest } from 'next'

export { config } from 'universe/backend/middleware';

export default async function(req: NextApiRequest, res: NextApiResponse) {
    await handleEndpoint(async ({ req, res }) => {
        const key = req.headers.key?.toString() || '';
        const limit = req.query.limit ? parseInt(req.query.limit.toString()) : false;
        let after: ObjectId | false;

        try { after = req.query.after ? new ObjectId(req.query.after.toString()) : false }
        catch(e) { throw new NotFoundError(req.query.after.toString()) }

        if(req.method == 'GET') {
            if(limit === 0)
                sendHttpOk(res, { elections: [] });

            else {
                const electionsCursor = await getPublicElections({
                    key,
                    ...(limit ? { limit } : {}),
                    ...(after ? { after } : {})
                });

                sendHttpOk(res, { elections: await electionsCursor.toArray() });
            }
        }

        else if(req.method == 'POST') {
            if(limit !== false || after !== false)
                sendHttpBadRequest(res, { error: 'query parameters are only allowed with GET requests' });

            else {
                const { election_id } = await upsertElection({ election: req.body, key });
                sendHttpOk(res, { election_id });
            }
        }
    }, { req, res, methods: [ 'GET', 'POST' ] });
}
