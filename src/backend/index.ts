import { ObjectId } from 'mongodb'
import { getEnv } from 'universe/backend/env'
import { getDb } from 'universe/backend/db'
import { isUndefined, isArray } from 'util'

import {
    LimitTypeError,
    IdTypeError,
    ApiKeyTypeError,
    TimeTypeError,
    NotFoundError,
    UpsertFailedError,
    GuruMeditationError,
    RankingsTypeError,
} from 'universe/backend/error'

import type {
    Metadata,
    PublicElection,
    InternalElection,
    NewElection,
    PatchElection,
    ElectionRankings,
    VoterRankings,
    VoterRanking
} from 'types/global'

export type UpsertNewElectionParams = {
    election: NewElection;
    key: string;
};

export type UpsertPatchElectionParams = {
    election: PatchElection;
    electionId: ObjectId;
};

export const NULL_KEY = '00000000-0000-0000-0000-000000000000';
export const DEFAULT_RESULT_LIMIT = 15;

export async function getElectionMetadata() {
    const now = Date.now();

    const meta: Metadata = {
        upcomingElections: 0,
        openElections: 0,
        closedElections: 0
    };

    return {
        ...meta,
        ...await (await getDb()).collection('elections').aggregate([
            {
                $group: {
                    _id: null,

                    upcomingElections: {
                        $sum: {
                            $cond: {
                                if: { $and: [{ $gt: ['$closes', now] }, { $gt: ['$opens', now] }] }, then: 1, else: 0
                            }
                        }
                    },

                    openElections: {
                        $sum: {
                            $cond: {
                                if: { $and: [{ $gt: ['$closes', now] }, { $lte: ['$opens', now] }] }, then: 1, else: 0
                            }
                        }
                    },

                    closedElections: {
                        $sum: { $cond: { if: { $lte: ['$closes', now] }, then: 1, else: 0 }}
                    }
                }
            },
            { $project: { _id: false }}
        ]).next()
    } as Metadata;
}

export async function getPublicElections(opts: { limit?: number; after?: ObjectId | null; key: string }) {
    const { limit, after, key } = { limit: DEFAULT_RESULT_LIMIT, after: null, ...opts };

    if(typeof limit != 'number' || limit <= 0 || limit > getEnv().MAX_LIMIT)
        throw new LimitTypeError(limit);

    if(after !== undefined && after !== null && !(after instanceof ObjectId))
        throw new IdTypeError(after);

    if(!key || typeof key != 'string')
        throw new ApiKeyTypeError();

    return await (await getDb()).collection('elections').aggregate<PublicElection>([
        ...(after ? [{ $match: { _id: { $gt: new ObjectId(after) }}}] : []),
        { $limit: limit },
        {
            $addFields: {
                election_id: '$_id',
                owned: key ? { $cond: { if: { $eq: ['$owner', key] }, then: true, else: false }} : false
            }
        },
        { $project: { _id: false, owner: false }},
    ]);
}

export async function getPublicElection(opts: { electionId: ObjectId; key: string }) {
    const { electionId, key } = opts;

    if(!key || typeof key != 'string')
        throw new ApiKeyTypeError();

    if(!(electionId instanceof ObjectId))
        throw new IdTypeError(electionId);

    const elections = await (await (await getDb()).collection('elections').aggregate<PublicElection>([
        { $match: { _id: electionId }},
        { $limit: 1 },
        {
            $addFields: {
                election_id: '$_id',
                owned: key ? { $cond: { if: { $eq: ['$owner', key] }, then: true, else: false }} : false
            }
        },
        { $project: { _id: false, owner: false }},
    ])).toArray();

    if(elections.length <= 0)
        throw new NotFoundError();

    return elections[0];
}

export async function getInternalElection(electionId: ObjectId) {
    if(!(electionId instanceof ObjectId))
        throw new IdTypeError(electionId);

    const election = await (await getDb()).collection('elections').find<InternalElection>({ _id: electionId }).next();

    if(!election)
        throw new NotFoundError(electionId);

    return election;
}

export async function doesElectionExist(electionId: ObjectId) {
    if(!(electionId instanceof ObjectId))
        throw new IdTypeError(electionId);

    return !!await (await getDb()).collection('elections').find({ _id: electionId }).limit(1).count();

}

// TODO: document that either 1) NewElection or 2) PatchElection, electionId,
// TODO: key are the two required sets of parameters (overloaded)
export async function upsertElection(opts: UpsertNewElectionParams): Promise<Partial<InternalElection>>
export async function upsertElection(opts: UpsertPatchElectionParams): Promise<Partial<InternalElection>>
export async function upsertElection(opts: UpsertNewElectionParams | UpsertPatchElectionParams): Promise<Partial<InternalElection>> {
    const { election: electionData, electionId, key } = opts as UpsertNewElectionParams & UpsertPatchElectionParams;

    if(electionId && !(electionId instanceof ObjectId))
        throw new IdTypeError(electionId);

    if(!electionId && (!key || typeof key != 'string'))
        throw new ApiKeyTypeError();

    const { title, description, options, opens, closes, ...rest } = electionData;

    const newData: Partial<InternalElection> = {};

    if(!electionId) {
        if(!title || !opens || !closes)
            throw new UpsertFailedError();

        newData.title = title;
        newData.opens = opens;
        newData.closes = closes;
        newData.description = description || '';
        newData.options = options || [];
        newData.deleted = false;
        newData.created = Date.now();
        newData.owner = key;
    }

    else {
        if(!doesElectionExist(electionId))
            throw new NotFoundError(electionId);

        const { deleted } = rest as Partial<PatchElection>;

        if((opens && !closes) || (closes && !opens))
            throw new TimeTypeError('when updating `opens` or `closes` properties, both must be modified together');

        title && (newData.title = title);
        opens && (newData.opens = opens);
        closes && (newData.closes = closes);
        description && (newData.description = description);
        options && (newData.options = options);
        deleted && (newData.deleted = deleted);
    }

    if((opens && closes) && (opens >= closes || (newData.created && opens <= newData.created)))
        throw new TimeTypeError();

    const result = await (await getDb()).collection<InternalElection>('elections').updateOne(
        { _id: electionId || new ObjectId() },
        {
            $set: {
                ...(!isUndefined(newData.title) ? { title: newData.title } : {}),
                ...(!isUndefined(newData.opens) ? { opens: newData.opens } : {}),
                ...(!isUndefined(newData.closes) ? { closes: newData.closes } : {}),
                ...(!isUndefined(newData.description) ? { description: newData.description } : {}),
                ...(!isUndefined(newData.options) ? { options: newData.options } : {}),
                ...(!isUndefined(newData.deleted) ? { deleted: newData.deleted } : {}),
                ...(!isUndefined(newData.created) ? { created: newData.created } : {}),
                ...(!isUndefined(newData.owner) ? { owner: newData.owner } : {}),
            }
        },
        { upsert: true }
    );

    if(!result.upsertedCount && !result.matchedCount)
        throw new GuruMeditationError();

    newData._id = result.upsertedCount ? result.upsertedId._id : electionId;

    return newData;
}

export async function isKeyAuthentic(key: string) {
    if(!key || typeof key != 'string')
        throw new ApiKeyTypeError();

    return !!await (await getDb()).collection('keys').find({ key }).limit(1).count();
}

export async function deleteElection(electionId: ObjectId) {
    if(electionId && !(electionId instanceof ObjectId))
        throw new IdTypeError(electionId);

    return !!await (await getDb()).collection('elections').updateOne({ _id: electionId }, { $set: { deleted: true }});
}

export async function getRankings(electionId: ObjectId) {
    if(electionId && !(electionId instanceof ObjectId))
        throw new IdTypeError(electionId);

    const electionRankings = await (await getDb()).collection('rankings').find<ElectionRankings>({
        election_id: electionId
    }).next();

    if(!electionRankings)
        throw new NotFoundError(electionId);

    return electionRankings.rankings;
}

export async function replaceRankings({ electionId, rankings }: { electionId: ObjectId; rankings: VoterRankings}) {
    if(electionId && !(electionId instanceof ObjectId))
        throw new IdTypeError(electionId);

    if(!isArray(rankings))
        throw new RankingsTypeError();

    const electionOpts = (await getInternalElection(electionId)).options;
    const isValidRanking = (voterRanking: VoterRanking) => voterRanking.ranking.every(ranking => electionOpts.includes(ranking));

    rankings.every(ranking => {
        if(!isValidRanking(ranking)) throw new RankingsTypeError(ranking);
    });

    const result = await (await getDb()).collection<ElectionRankings>('rankings').updateOne(
        { election_id: electionId },
        { $set: { rankings }},
        { upsert: true }
    );

    if(!result.upsertedCount && !result.matchedCount)
        throw new GuruMeditationError();
}
