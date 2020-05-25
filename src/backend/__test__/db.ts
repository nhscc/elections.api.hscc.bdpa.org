import { MongoClient, Db, ObjectId } from 'mongodb'
import { NULL_KEY } from 'universe/backend'
import { initialize, getDb, setDb } from 'universe/backend/db'
import { getEnv } from 'universe/backend/env'
import { populateEnv } from 'universe/dev-utils'
import * as Time from 'multiverse/relative-random-time'
import shuffle from 'fast-shuffle'
import randomInt from 'random-int'
import uniqueRandomArray from 'unique-random-array'

import type {
    InternalElection,
    ElectionRankings,
    ApiKey,
    RequestLogEntry,
    LimitedEntry
} from 'types/global'

populateEnv();

export type DummyDbData = {
    keys: ApiKey[];
    elections: InternalElection[];
};

type InternalElectionSubset = Pick<InternalElection, 'title' | 'description' | 'options' | 'owner' | 'deleted'>;

const injectData = (ob: InternalElectionSubset, fn: (obj: InternalElection) => void): InternalElection => {
    const election = ob as InternalElection;
    fn(election);
    return election;
};

const expandToMaxPageLength = (elections: InternalElection[]): InternalElection[] => {
    const maxLimit = getEnv().MAX_LIMIT;

    while(elections.length > 0 && elections.length < maxLimit)
        elections.push({... (elections.length % 2 ? elections[0] : (elections[1] || elections[0])) });

    (elections = elections.slice(0, maxLimit)).forEach(election => {
        election._id = new ObjectId();
        election.title += ` x-gen#${randomInt(maxLimit)}`;
    });

    return elections;
};

export const unhydratedDummyDbData: DummyDbData = {
    keys: [
        {
            owner: 'chapter1',
            key: 'a0a49b61-83a7-4036-b060-213784b4997c'
        },
        {
            owner: 'chapter2',
            key: '5db4c4d3-294a-4086-9751-f3fce82d11e4'
        },
    ],
    elections: [
        expandToMaxPageLength([
            injectData({
                title: 'My election #1',
                description: 'My demo election!',
                options: [ 'Vanilla', 'Chocolate', 'Strawberry' ],
                owner: NULL_KEY,
                deleted: false
            }, (o) => {
                o.created = Time.farPast();
                o.opens = Time.farPast({ after: o.created });
                o.closes = Time.farPast({ after: o.opens });
            }),
            injectData({
                title: 'My election #2',
                description: 'My demo election!',
                options: [ 'Vanilla', 'Chocolate', 'Strawberry' ],
                owner: NULL_KEY,
                deleted: true
            }, (o) => {
                o.created = Time.farFuture();
                o.opens = Time.farFuture({ after: o.created });
                o.closes = Time.farFuture({ after: o.opens });
            })
        ]),
        expandToMaxPageLength([
            injectData({
                title: 'My election #3',
                description: 'My demo election!',
                options: [ 'Red', 'Green', 'Blue', 'Yellow' ],
                owner: 'a0a49b61-83a7-4036-b060-213784b4997c',
                deleted: false
            }, (o) => {
                o.created = Time.farPast();
                o.opens = Time.nearFuture();
                o.closes = Time.farFuture();
            }),
            injectData({
                title: 'My election #4',
                description: 'My demo election!',
                options: [ 'Chalk', 'Dye', 'Egg', 'Foam', 'Grease', 'Hand' ],
                owner: 'a0a49b61-83a7-4036-b060-213784b4997c',
                deleted: false
            }, (o) => {
                o.created = Time.nearFuture();
                o.opens = Time.nearFuture({ after: o.created });
                o.closes = Time.nearFuture({ after: o.opens });
            }),
            injectData({
                title: 'My election #5',
                description: 'My demo election!',
                options: [ 'Walking Dead', 'Red Dead', 'Dead Eye' ],
                owner: '5db4c4d3-294a-4086-9751-f3fce82d11e4',
                deleted: false
            }, (o) => {
                o.created = Time.nearPast();
                o.opens = Time.nearPast({ after: o.created });
                o.closes = Time.nearPast({ after: o.opens });
            })
        ]),
        expandToMaxPageLength([
            injectData({
                title: 'My election #6',
                description: 'My demo election again!',
                options: [ 'Red', 'Green', 'Blue', 'Yellow', 'Orange', 'Purple' ],
                owner: '5db4c4d3-294a-4086-9751-f3fce82d11e4',
                deleted: false
            }, (o) => {
                o.created = Time.nearPast();
                o.opens = Time.nearPast({ after: o.created });
                o.closes = Time.nearFuture();
            }),
            injectData({
                title: 'My election #7',
                description: 'Best election bigly!',
                options: [ 'Bigly', 'Bigliest', 'Winning', 'Orange', 'Hair', 'Insane' ],
                owner: '5db4c4d3-294a-4086-9751-f3fce82d11e4',
                deleted: false
            }, (o) => {
                o.created = Time.nearPast();
                o.opens = Time.nearPast({ after: o.created });
                o.closes = Time.farFuture();
            })
        ]),
    ].flat()
};

// TODO: not idempotent; elections will be duplicated if called twice
export async function hydrateDb(db: Db, data: DummyDbData): Promise<DummyDbData> {
    const newData = { ...data };

    // Update keys
    if(newData.keys) {
        const keysDb = db.collection('keys').initializeUnorderedBulkOp();

        newData.keys.forEach(keyRecord => keysDb.find({ key: keyRecord.key }).upsert().updateOne(keyRecord));
        await keysDb.execute();
    }

    // Push new elections
    if(newData.elections) {
        const electionsDb = db.collection<InternalElection>('elections');
        const rankingsDb = db.collection<ElectionRankings>('rankings');

        await electionsDb.insertMany(newData.elections);
        const getArrayLength = uniqueRandomArray([0, 1, 2, randomInt(3, 6), randomInt(10, 20), 100, 1000]);

        await rankingsDb.insertMany(newData.elections.map(election => ({
            election_id: election._id,
            rankings: [...Array(getArrayLength())].map((_, id) => ({
                voter_id: randomInt(id * 3, (id + 1) * 3 - 1).toString(),
                ranking: shuffle(election.options)
            }))
        })));
    }

    // Push new requests to the log and update limited-mview accordingly
    const requestLogDb = db.collection<RequestLogEntry>('request-log');
    const mviewDb = db.collection<LimitedEntry>('limited-mview');

    await requestLogDb.insertMany([...Array(20)].map((_, ndx) => ({
        _id: new ObjectId(),
        ip: '1.2.3.4',
        key: ndx % 2 ? null : NULL_KEY,
        method: ndx % 3 ? 'GET' : 'POST',
        route: 'fake/route',
        time: Date.now(),
        response: 200,
     })));

    await mviewDb.insertMany([
        { _id: new ObjectId(), ip: '1.2.3.4', until: Date.now() + 10**5 },
        { _id: new ObjectId(), ip: '5.6.7.8', until: Date.now() + 10**6 },
        { _id: new ObjectId(), key: NULL_KEY, until: Date.now() + 10**7 }
    ]);

    return newData;
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function setupJest() {
    let connection: MongoClient;
    let hydratedData: DummyDbData;

    beforeAll(async () => {
        connection = await MongoClient.connect(getEnv().MONGODB_TEST_URI, { useUnifiedTopology: true });
        const db = connection?.db();

        if(!db)
            throw new Error('unable to connect to database (1)');

        setDb(db);
    });

    beforeEach(async () => {
        const dbName = getEnv().MONGODB_TEST_URI.split('/').slice(-1)[0];

        await (await getDb()).dropDatabase();

        if(!dbName)
            throw new Error('database name resolution failed in Jest test');

        const db = connection.db(dbName);

        if(!db)
            throw new Error('unable to connect to database (2)');

        await initialize(db, { reinitialize: true });
        hydratedData = await hydrateDb(db, unhydratedDummyDbData);

        setDb(db);
    });

    afterAll(async () => {
        await new Promise(ok => setTimeout(() => (connection.isConnected() && connection.close(), ok()), 750));
    });

    return {
        getDb,
        getConnection: () => connection,
        getHydratedData: () => hydratedData
    };
}
