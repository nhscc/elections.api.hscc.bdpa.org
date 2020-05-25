import { getElectionMetadata } from 'universe/backend'
import { sendHttpOk } from 'multiverse/respond'

import type { NextApiResponse, NextApiRequest } from 'next'

export default async function(_: NextApiRequest, res: NextApiResponse): Promise<void> {
    sendHttpOk(res, await getElectionMetadata());
}
