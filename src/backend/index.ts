import { ObjectId } from 'mongodb'
import { getEnv } from 'universe/backend/env'
import { getDb } from 'universe/backend/db'
import {
    LimitTypeError,
    IdTypeError,
    ApiKeyTypeError,
    TimeTypeError,
    NotFoundError,
    UpsertFailedError,
    GuruMeditationError,
} from 'universe/backend/error'

import type { Metadata, PublicElection, InternalElection, NewElection, PatchElection } from 'types/global'

export type UpsertElectionParams = {
    election: NewElection | PatchElection;
    electionId?: ObjectId;
    key: string;
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

    if(after && !(after instanceof ObjectId))
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

export async function upsertElection(opts: UpsertElectionParams) {
    const { election: electionData, electionId, key } = opts;

    if(electionId && !(electionId instanceof ObjectId))
        throw new IdTypeError(electionId);

    if(!key || typeof key != 'string')
        throw new ApiKeyTypeError();

    const { title, description, options, opens, closes, ...rest } = electionData;

    const newData: Partial<InternalElection> = {
        _id: electionId || new ObjectId(),
    };

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
        { _id: newData._id },
        {
            ...(newData.title ? { $set: { title: newData.title }} : {}),
            ...(newData.opens ? { $set: { opens: newData.opens }} : {}),
            ...(newData.closes ? { $set: { closes: newData.closes }} : {}),
            ...(newData.description ? { $set: { description: newData.description }} : {}),
            ...(newData.options ? { $set: { options: newData.options }} : {}),
            ...(newData.deleted ? { $set: { deleted: newData.deleted }} : {}),
            ...(newData.created ? { $set: { created: newData.created }} : {}),
            ...(newData.owner ? { $set: { owner: newData.owner }} : {}),
        },
        { upsert: true }
    );

    if(!result.upsertedCount && !result.matchedCount)
        throw new GuruMeditationError();

    result.upsertedCount && (newData._id = result.upsertedId._id);

    return newData;
}

