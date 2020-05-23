import { MongoClient } from 'mongodb'
import { MongoMemoryServer } from 'mongodb-memory-server'
import { initialize } from 'universe/initialize-test-db'

import {
    setDB,
} from 'universe/backend'

import type { Db } from 'mongodb'

let connection: MongoClient;
let db: Db;
const server = new MongoMemoryServer();

beforeAll(async () => {
    if(!connection || !db ) {
        connection = await MongoClient.connect(await server.getConnectionString(), { useUnifiedTopology: true });
        db = connection?.db();

        if(!db)
            throw new Error('unable to connect to database');

        setDB(db);
    }
});

beforeEach(async () => {
    initialize(db);
});

afterAll(async () => {
    connection && connection.close();
    server.stop();
});

describe('xyz', () => {
    it('abc', async () => {
        //expect((await getRawDB()).users[defaultNextId].password).toBe('t');
    });
});
