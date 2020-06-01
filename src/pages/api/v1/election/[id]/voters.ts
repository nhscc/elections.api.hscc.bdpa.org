import { handleEndpoint } from 'universe/backend/middleware'
import { ObjectId } from 'mongodb'
import { NotFoundError, GuruMeditationError } from 'universe/backend/error'
import { getRankings, getPublicElection, replaceRankings } from 'universe/backend'
import { sendHttpOk, sendHttpUnauthorized } from 'multiverse/respond'

import type { NextApiResponse, NextApiRequest } from 'next'

export { config } from 'universe/backend/middleware';

export default async function(req: NextApiRequest, res: NextApiResponse) {
    await handleEndpoint(async ({ res }) => {
        const key = req.headers.key?.toString() || '';
        let electionId: ObjectId | false;

        try { electionId = req.query.id ? new ObjectId(req.query.id.toString()) : false }
        catch(e) { throw new NotFoundError(req.query.id.toString()) }

        if(!electionId)
            throw new GuruMeditationError();

        const election = await getPublicElection({ electionId, key });

        if(req.method == 'GET')
            sendHttpOk(res, { votes: await getRankings(election.election_id) });

        else if(!election.owned)
            sendHttpUnauthorized(res);

        else if(req.method == 'PUT') {
            await replaceRankings({ electionId, rankings: req.body });
            sendHttpOk(res);
        }
    }, { req, res, methods: [ 'GET', 'PUT' ] });
}
