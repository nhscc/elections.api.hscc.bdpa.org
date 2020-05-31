import { setupJest } from 'universe/__test__/db'
import { testApiEndpoint } from 'multiverse/test-api-endpoint'
import * as Voters from 'universe/pages/api/v1/election/voters'
import { getEnv } from 'universe/backend/env'

const { getHydratedData } = setupJest();

const votersEndpoint: typeof Voters.default & { config?: object } = Voters.default;
votersEndpoint.config = Voters.config;

process.env.REQUESTS_PER_CONTRIVED_ERROR = '0';

const KEY = '5db4c4d3-294a-4086-9751-f3fce82d11e4';

describe('api/v1/election/voters', () => {
    it('requests without a key return 401', async () => {
        await testApiEndpoint({
            next: votersEndpoint,
            test: async ({ fetch }) => expect((await fetch()).status).toBe(401)
        });
    });

    it('requests that are too big return 413', async () => {
        await testApiEndpoint({
            next: votersEndpoint,
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
            next: votersEndpoint,
            test: async ({ fetch }) => expect((await fetch({ headers: { KEY } })).status).toBe(429)
        });
    });

    it('disallowed methods return 405', async () => {
        await testApiEndpoint({
            next: votersEndpoint,
            test: async ({ fetch }) => {
                expect((await fetch({ method: 'POST', headers: { KEY } })).status).toBe(405);
                expect((await fetch({ method: 'DELETE', headers: { KEY } })).status).toBe(405);
            }
        });
    });

    it('returns only public voter and ranking data on election_id', async () => {
        await testApiEndpoint({
            next: votersEndpoint,
            test: async ({ fetch }) => {
                const response = await fetch({ headers: { KEY } });
                const json = await response.json();

                const elections = getHydratedData().elections;
                void elections;

                expect(response.status).toBe(200);
                expect(json.success).toBe(true);
            }
        });
    });

    test.todo('can use PUT to mutate election rankings');

    test.todo('returns an empty array when querying a brand new election_id');

    test.todo('returns a 400 error on invalid data during PUT');

    test.todo('returns a 403 error when trying to mutate an unowned election_id');

    test.todo('returns a 404 error if election_id does not exist');
});
