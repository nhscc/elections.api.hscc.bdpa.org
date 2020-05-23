import { Db } from 'mongodb'
import { produce as mutate } from 'immer'
import shuffle from 'fast-shuffle'
import randomInt from 'random-int'
import uniqueRandomArray from 'unique-random-array'

import type { Immutable } from 'immer'
import type { InternalElection, ElectionRankings, Rankings } from 'types/global'

export const NULL_KEY = '00000000-0000-0000-0000-000000000000';

export type InitialData = {
    meta?: {
        upcomingElections: number;
        openElections: number;
        closedElections: number;
    };

    keys?: {
        owner: string;
        key: string;
    }[];

    elections?: InternalElection[];

    votes?: { [electionId: string]: Rankings};
};

// TODO: document that this function is idempotent and can be called on
// TODO: conformant databases that already have the appropriate structure
// TODO: without worry of data loss.
// ! reinitialize=true => will kill whatever is currently in the database!
export async function initialize(db: Db, { reinitialize }: { reinitialize?: boolean } = {}): Promise<void> {
    // TODO: add validation rules during createCollection phase
    // TODO: (including special 0 root key not accepted in keys or in API)
    // TODO: also make an index over key in keys (if not exists)

    if(reinitialize) {
        await Promise.all([
            db.dropCollection('meta'),
            db.dropCollection('keys'),
            db.dropCollection('elections'),
            db.dropCollection('votes'),
        ]);
    }

    // ? The meta collection should be a singleton. The initialize() function
    // ? must be idempotent. To satisfy both invariants, we only update a new
    // ? metadata document if one does not already exist.
    await Promise.all([
        (await db.createCollection('meta')).updateOne(
            {},
            { $setOnInsert: {
                upcomingElections: 0,
                openElections: 0,
                closedElections: 0,
            }},
            { upsert: true }
        ),
        db.createCollection('keys'),
        db.createCollection('elections'),
        db.createCollection('votes'),
    ]);
}

// TODO: not idempotent; elections, votes will be duplicated and metadata will
// TODO: be reset (if present) if called twice
export async function hydrate(db: Db, data: Immutable<InitialData>): Promise<Immutable<InitialData>> {
    let newData = null;

    // Update meta
    if(data.meta) {
        const metaDb = db.collection('meta');
        await metaDb.updateOne({}, { $set: data.meta });
    }

    // Update keys
    if(data.keys) {
        const keysDb = db.collection('keys').initializeUnorderedBulkOp();

        data.keys.forEach(keyRecord => keysDb.find({ key: keyRecord.key }).upsert().updateOne(keyRecord));
        await keysDb.execute();
    }

    // Push new elections
    if(data.elections) {
        const electionsDb = db.collection<InternalElection>('elections');
        const votesDb = db.collection<ElectionRankings>('votes');

        newData = mutate(data, async draft => {
            const result = await electionsDb.insertMany(draft.elections || []);
            const getArrayLength = uniqueRandomArray([0, 1, 2, randomInt(3, 6), randomInt(10, 20), 100, 1000]);

            await votesDb.insertMany(Object.entries(result.insertedIds).map(([ index, election_id ]) => ({
                election_id,
                rankings: [...Array(getArrayLength())].map((_, id) => ({
                    voter_id: (id + 1).toString(),
                    ranking: shuffle(draft.elections?.[(index as unknown) as number].options || [])
                }))
            })));
        });
    }

    return newData || data;
}
