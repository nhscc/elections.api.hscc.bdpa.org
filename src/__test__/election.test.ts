import { setupJest } from 'universe/__test__/db'
import { testApiEndpoint } from 'multiverse/test-api-endpoint'
import * as Election from 'universe/pages/api/v1/election/[id]'
import { getEnv } from 'universe/backend/env'

import type { PublicElection, InternalElection } from 'types/global'

const { getHydratedData } = setupJest();

const electionEndpoint: typeof Election.default & { config?: object } = Election.default;
electionEndpoint.config = Election.config;

process.env.REQUESTS_PER_CONTRIVED_ERROR = '0';

const KEY = '5db4c4d3-294a-4086-9751-f3fce82d11e4';

const containsOnlyPublicData = (o: object) => {
    const {
        title,
        election_id,
        closes,
        created,
        deleted,
        description,
        opens,
        options,
        owned,
        ...rest
    } = o as PublicElection;

    return !Object.keys(rest).length;
};

const internalToPublic = (e: InternalElection[]) => {
    return e.map(election => {
        const { title, election_id, closes, created, deleted, description, opens, options, owner } = election;

        return {
            election_id: election_id.toHexString(),
            title,
            created,
            opens,
            closes,
            description,
            options,
            deleted,
            owned: owner == KEY
        } as Omit<PublicElection, 'election_id'> & { election_id: string };
    });
};

describe('api/v1/election', () => {
    it('requests without a key return 401', async () => {
        await testApiEndpoint({
            next: electionEndpoint,
            test: async ({ fetch }) => expect((await fetch()).status).toBe(401)
        });
    });

    it('requests that are too big return 413', async () => {
        await testApiEndpoint({
            next: electionEndpoint,
            test: async ({ fetch }) => {
                const clientResponse = await fetch({
                    method: 'POST',
                    headers: { KEY },
                    body: [...Array(getEnv().MAX_CONTENT_LENGTH_BYTES + 1)].map(() => 'x').join('')
                });

                expect(clientResponse.status).toBe(413);
            }
        });
    });

    it('requests from rate limited IPs and keys return 429', async () => {
        await testApiEndpoint({
            requestPatcher: req => req.headers['x-forwarded-for'] = '1.2.3.4',
            next: electionEndpoint,
            test: async ({ fetch }) => expect((await fetch({ headers: { KEY } })).status).toBe(429)
        });
    });

    it('disallowed methods return 405', async () => {
        await testApiEndpoint({
            next: electionEndpoint,
            test: async ({ fetch }) => expect((await fetch({ method: 'POST', headers: { KEY } })).status).toBe(405)
        });
    });

    it('returns only public and no private/internal election data', async () => {
        await testApiEndpoint({
            next: electionEndpoint,
            params: { id: getHydratedData().elections[22].election_id },
            test: async ({ fetch }) => {
                const response = await fetch({ headers: { KEY } });
                const { success, ...election } = await response.json();

                expect(response.status).toBe(200);
                expect(success).toBe(true);
                expect(containsOnlyPublicData(election)).toBeTrue();
            }
        });
    });

    test.todo('can use PUT to mutate an election');

    test.todo('can use DELETE to delete an election');

    test.todo('returns a 400 error on invalid data during PUT');

    test.todo('returns a 403 error when trying to PUT or DELETE with an election_id owned by a different key');

    test.todo('returns a 404 error if election_id does not exist');
});
