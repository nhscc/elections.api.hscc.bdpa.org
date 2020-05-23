/* @flow */

import { MongoClient } from 'mongodb'
import type { Db } from 'mongodb'

let db: Db | null = null;

/**
 * Used to lazily create the database once on-demand instead of immediately when
 * the app runs. Not exported.
 */
export async function getDB(): Promise<Db> {
    db = db || (await MongoClient.connect(process.env.MONGODB_URI || '<unknown>', { useUnifiedTopology: true })).db();
    return db;
}

/**
 * Used for testing purposes. Sets the global db instance to something else.
 */
export function setDB(newDB: Db): void { db = newDB; }
