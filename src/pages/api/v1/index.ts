import { MongoClient } from 'mongodb'

import type { NextApiResponse } from 'next'
import type { NextSessionRequest } from 'multiverse/simple-auth-session'

export default async function(req: NextSessionRequest, res: NextApiResponse): Promise<void> {
    void req;
    const client = await MongoClient.connect(process.env.MONGODB_URI || '<unknown>', { useUnifiedTopology: true });
    const db = client.db();
    const meta = db.collection('meta');

    res.status(200).send(await meta.find({}, { projection: { _id: false }}).next());
}
