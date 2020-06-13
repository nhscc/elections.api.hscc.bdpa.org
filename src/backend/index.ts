import { ObjectId } from 'mongodb'
import { getEnv } from 'universe/backend/env'
import { getDb } from 'universe/backend/db'
import { isUndefined, isArray, isNumber } from 'util'
import { getClientIp } from 'request-ip'

import {
    LimitTypeError,
    IdTypeError,
    ApiKeyTypeError,
    TimeTypeError,
    NotFoundError,
    UpsertFailedError,
    GuruMeditationError,
    ValidationError,
} from 'universe/backend/error'

import type {
    Metadata,
    PublicElection,
    InternalElection,
    NewElection,
    PatchElection,
    ElectionRankings,
    VoterRanking,
    NextParamsRR,
    RequestLogEntry,
    LimitedLogEntry,
    InDbElection,
    ApiKey
} from 'types/global'

import type { NextApiRequest } from 'next'
import type { WithId, AggregationCursor } from 'mongodb'

type PartialInternalElection = Partial<InternalElection> & { election_id: ObjectId };

let requestCounter = 0;

export const DEFAULT_RESULT_LIMIT = 15;
export const NULL_KEY = '00000000-0000-0000-0000-000000000000';

export type ValEleDatParams = NewElection | PatchElection;
export type UpsNewEleParams = { election: NewElection; key: string };
export type UpsPatEleParams = { election: PatchElection; electionId: ObjectId };
export type EleVotRanParams = { electionId: ObjectId; rankings: VoterRanking[] };
export type GetPubEleParams = { limit?: number; after?: ObjectId | null; key: string };

export async function getElectionMetadata(): Promise<Metadata> {
    const now = Date.now();

    const meta: Metadata = {
        upcomingElections: 0,
        openElections: 0,
        closedElections: 0
    };

    return {
        ...meta,
        ...await (await getDb()).collection<InDbElection>('elections').aggregate([
            { $match: { deleted: false } },
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

export async function getPublicElections(opts: GetPubEleParams): Promise<AggregationCursor<PublicElection>> {
    const { limit, after, key } = { limit: DEFAULT_RESULT_LIMIT, after: null, ...opts };

    if(!isNumber(limit) || limit <= 0 || limit > getEnv().MAX_LIMIT)
        throw new LimitTypeError(limit);

    if(after !== undefined && after !== null && !(after instanceof ObjectId))
        throw new IdTypeError(after);

    if(!key || typeof key != 'string')
        throw new ApiKeyTypeError();

    return await (await getDb()).collection<InDbElection>('elections').aggregate<PublicElection>([
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

export async function getPublicElection(opts: { electionId: ObjectId; key: string }): Promise<PublicElection> {
    const { electionId, key } = opts;

    if(!key || typeof key != 'string')
        throw new ApiKeyTypeError();

    if(!(electionId instanceof ObjectId))
        throw new IdTypeError(electionId);

    const elections = await (await (await getDb()).collection<InDbElection>('elections').aggregate<PublicElection>([
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

export async function getInternalElection(electionId: ObjectId): Promise<InternalElection> {
    if(!(electionId instanceof ObjectId))
        throw new IdTypeError(electionId);

    const e = await (await getDb()).collection<InDbElection>('elections').find({ _id: electionId }).next();

    if(!e)
        throw new NotFoundError(electionId);

    const { _id: election_id, ...election } = e;

    return { election_id, ...election };
}

export async function doesElectionExist(electionId: ObjectId): Promise<boolean> {
    if(!(electionId instanceof ObjectId))
        throw new IdTypeError(electionId);

    return !!await (await getDb()).collection<InDbElection>('elections').find({ _id: electionId }).limit(1).count();
}

export async function getRankings(electionId: ObjectId): Promise<VoterRanking[]> {
    if(electionId && !(electionId instanceof ObjectId))
        throw new IdTypeError(electionId);

    const rankings = await (await getDb()).collection<WithId<ElectionRankings>>('rankings').find<ElectionRankings>({
        election_id: electionId
    }).next();

    if(!rankings)
        throw new NotFoundError(electionId);

    return rankings.rankings;
}

export async function replaceRankings({ electionId, rankings }: EleVotRanParams): Promise<void> {
    if(electionId && !(electionId instanceof ObjectId))
        throw new IdTypeError(electionId);

    if(!isArray(rankings))
        throw new ValidationError('invalid voter rankings encountered');

    const maxRanks = getEnv().MAX_RANKINGS_PER_ELECTION;

    if(rankings.length > maxRanks)
        throw new ValidationError(`too many rankings (max is ${maxRanks}`);

    const electionOpts = (await getInternalElection(electionId)).options;
    const ids = new Set<string>();

    rankings.forEach(voterRanking => {
        if(typeof voterRanking?.voter_id != 'string' || !voterRanking.voter_id)
            throw new ValidationError('illegal rankings property "voter_id"');

        if(ids.has(voterRanking.voter_id))
            throw new ValidationError(`illegal rankings property "voter_id": duplicated id "${voterRanking.voter_id}"`);

        ids.add(voterRanking.voter_id);

        if(!isArray(voterRanking.ranking) ||
          voterRanking.ranking.some(r => typeof r != 'string' || !electionOpts.includes(r))) {
            throw new ValidationError('illegal rankings property "ranking"');
        }

        if(voterRanking.ranking.length > electionOpts.length)
            throw new ValidationError('illegal rankings property "ranking": too many rankings provided');

        if((new Set(voterRanking.ranking)).size != voterRanking.ranking.length)
            throw new ValidationError('illegal rankings property "ranking": duplicated ranking encountered');
    });

    const result = await (await getDb()).collection<WithId<ElectionRankings>>('rankings').updateOne(
        { election_id: electionId },
        { $set: { rankings }},
        { upsert: true }
    );

    if(!result.upsertedCount && !result.matchedCount)
        throw new GuruMeditationError();
}

export async function upsertElection(opts: UpsNewEleParams): Promise<PartialInternalElection>
export async function upsertElection(opts: UpsPatEleParams): Promise<PartialInternalElection>
export async function upsertElection(opts: UpsNewEleParams | UpsPatEleParams): Promise<PartialInternalElection> {
    const { election: electionData, electionId, key } = opts as UpsNewEleParams & UpsPatEleParams;
    const newData: Partial<InternalElection> = {};

    if(!isUndefined(electionData.title) && (!electionData.title || typeof electionData.title != 'string'))
        throw new ValidationError('invalid property "title"');

    if(!isUndefined(electionData.description) && typeof electionData.description != 'string')
        throw new ValidationError('invalid property "description"');

    if(!isUndefined(electionData.options) && (
      !isArray(electionData.options) || electionData.options.some(o => typeof o != 'string') ||
      electionData.options.length > getEnv().MAX_OPTIONS_PER_ELECTION)) {
        throw new ValidationError('invalid property "options"');
      }

    if(!isUndefined(electionData.opens) && !isNumber(electionData.opens))
        throw new ValidationError('invalid property "opens"');

    if(!isUndefined(electionData.closes) && !isNumber(electionData.closes))
        throw new ValidationError('invalid property "closes"');

    if(electionId) {
        if(!(electionId instanceof ObjectId))
            throw new IdTypeError(electionId);

        const { title, description, options, opens, closes, deleted, ...rest } = electionData as PatchElection;

        if(Object.keys(rest).length > 0)
            throw new ValidationError('one or more unexpected properties encountered');

        if(deleted && typeof deleted != 'boolean')
            throw new ValidationError('invalid property "deleted"');

        if((opens && !closes) || (closes && !opens))
            throw new TimeTypeError('when updating "opens" or "closes" properties, both must be modified together');

        if(!doesElectionExist(electionId))
            throw new NotFoundError(electionId);

        title   && (newData.title   = title);
        opens   && (newData.opens   = opens);
        closes  && (newData.closes  = closes);
        options && (newData.options = options);

        !isUndefined(description) && (newData.description = description);
        !isUndefined(deleted)     && (newData.deleted     = false);
    }

    else {
        if(!key || typeof key != 'string')
            throw new ApiKeyTypeError();

        const { title, description, options, opens, closes, ...rest } = electionData as NewElection;

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        if(rest.deleted !== undefined)
            throw new ValidationError('property "deleted" not allowed here');

        if(Object.keys(rest).length > 0)
            throw new ValidationError('one or more unexpected properties encountered');

        if(!title)
            throw new ValidationError('missing property "title"');

        if(!opens)
            throw new ValidationError('missing property "opens"');

        if(!closes)
            throw new ValidationError('missing property "closes"');

        newData.title = title;
        newData.opens = opens;
        newData.closes = closes;
        newData.description = description || '';
        newData.options = options || [];
        newData.deleted = false;
        newData.created = Date.now();
        newData.owner = key;
    }

    if((newData.opens && newData.closes) && (
      newData.opens >= newData.closes || (newData.created && newData.opens <= newData.created))) {
        throw new TimeTypeError();
    }

    if(newData.options && (new Set(newData.options)).size != newData.options.length)
        throw new ValidationError('"options" property contains duplicate items');

    if(Object.keys(newData).length <= 0)
        throw new UpsertFailedError('empty upserts are not allowed');

    const db = (await getDb());
    const result = await db.collection<InDbElection>('elections').updateOne(
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

    newData.election_id = result.upsertedCount ? result.upsertedId._id : electionId;

    if(!electionId) {
        await (await getDb()).collection<ElectionRankings>('rankings').insertOne({
            election_id: newData.election_id,
            rankings: []
        });
    }

    else if(electionData.options)
        await db.collection<InDbElection>('rankings').updateOne({ election_id: electionId }, { $set: { rankings: [] }});

    return newData as PartialInternalElection;
}

export async function isKeyAuthentic(key: string): Promise<boolean> {
    if(!key || typeof key != 'string')
        throw new ApiKeyTypeError();

    return !!await (await getDb()).collection<WithId<ApiKey>>('keys').find({ key }).limit(1).count();
}

export async function deleteElection(electionId: ObjectId): Promise<void> {
    if(electionId && !(electionId instanceof ObjectId))
        throw new IdTypeError(electionId);

    await (await getDb()).collection<InDbElection>('elections').updateOne(
        { _id: electionId },
        { $set: { deleted: true }}
    );
}

/**
 * Note that this async function does not have to be awaited. It's fire and
 * forget!
 */
export async function addToRequestLog({ req, res }: NextParamsRR): Promise<void> {
    const logEntry: RequestLogEntry = {
        ip: getClientIp(req),
        key: req.headers?.key?.toString() || null,
        method: req.method || null,
        route: req.url?.replace(/^\/api\//, '') || null,
        resStatusCode: res.statusCode,
        time: Date.now()
    };

    await (await getDb()).collection<WithId<RequestLogEntry>>('request-log').insertOne(logEntry);
}

export async function isRateLimited(req: NextApiRequest): Promise<{ limited: boolean; retryAfter: number }> {
    const ip = getClientIp(req);
    const key = req.headers?.key?.toString() || null;

    const limited = (await (await getDb()).collection<WithId<LimitedLogEntry>>('limited-log-mview').find({
        $or: [...(ip ? [{ ip }]: []), ...(key ? [{ key }]: [])],
        until: { $gt: Date.now() }
    }).sort({ until: -1 }).limit(1).toArray())[0] || null;

    return {
        limited: !!limited,
        retryAfter: (limited?.until || Date.now()) - Date.now()
    };
}

export function isDueForContrivedError(): boolean {
    const reqPerErr = getEnv().REQUESTS_PER_CONTRIVED_ERROR;

    if(reqPerErr && ++requestCounter >= reqPerErr) {
        requestCounter = 0;
        return true;
    }

    return false;
}
