import { handleEndpoint } from 'universe/backend/middleware'

import type { NextApiResponse, NextApiRequest } from 'next'
import { sendHttpOk, /* sendHttpUnauthorized */ } from 'multiverse/respond';
//import { getPublicElection, upsertElection, deleteElection } from 'universe/backend';
//import { GuruMeditationError, NotFoundError } from 'universe/backend/error';
//import { ObjectId } from 'mongodb';

export { config } from 'universe/backend/middleware';

export default async function(req: NextApiRequest, res: NextApiResponse) {
    await handleEndpoint(async ({ res }) => {
        /* const key = req.headers.key?.toString() || '';
        let electionId: ObjectId | false; */

        sendHttpOk(res, { result: JSON.stringify(req.query) });
        // try { electionId = req.query.id ? new ObjectId(req.query.id.toString()) : false }
        // catch(e) { throw new NotFoundError(req.query.id.toString()) }

        // if(!electionId)
        //     throw new GuruMeditationError();

        // const election = await getPublicElection({ electionId, key });

        // if(req.method == 'GET')
        //     sendHttpOk(res, election);

        // else if(!election.owned)
        //     sendHttpUnauthorized(res);

        // else if(req.method == 'PUT')
        //     sendHttpOk(res, await upsertElection({ electionId, election: req.body }));

        // else if(req.method == 'DELETE') {
        //     await deleteElection(electionId);
        //     sendHttpOk(res);
        // }
    }, { req, res, methods: [ 'GET', 'PUT', 'DELETE' ] });
}
