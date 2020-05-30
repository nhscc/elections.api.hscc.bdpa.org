import { setupJest } from 'universe/__test__/db'
import { testApiEndpoint } from 'multiverse/test-api-endpoint'
import * as Election from 'universe/pages/api/v1/election'
import { getEnv } from 'universe/backend/env'

const { getHydratedData } = setupJest();

const electionEndpoint: typeof Election.default & { config?: object } = Election.default;
electionEndpoint.config = Election.config;

process.env.REQUESTS_PER_CONTRIVED_ERROR = '0';

const KEY = '5db4c4d3-294a-4086-9751-f3fce82d11e4';

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

    it('returns data as expected', async () => {
        await testApiEndpoint({
            next: electionEndpoint,
            test: async ({ fetch }) => {
                const response = await fetch({ headers: { KEY } });
                const json = await response.json();

                const elections = getHydratedData().elections;
                void elections;

                //expect(response.status).toBe(200);

                expect(json).toContainAllKeys([
                    'closedElections',
                    'openElections',
                    'success',
                    'upcomingElections'
                ]);

                expect(json.success).toBe(true);
                //expect(json.closedElections + json.openElections + json.upcomingElections).toBe();
            }
        });

        test.todo('need to test that endpoint returns data as expected, validates data on POST, error if election DNE, public vs private data');
    });
});
