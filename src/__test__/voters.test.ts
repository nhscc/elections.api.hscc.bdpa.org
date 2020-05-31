import { setupJest } from 'universe/__test__/db'
import { testApiEndpoint } from 'multiverse/test-api-endpoint'
import * as Voters from 'universe/pages/api/v1/election/[id]/voters'
import { getEnv } from 'universe/backend/env'
import { getRankings, upsertElection } from 'universe/backend';
import { ObjectId } from 'mongodb';

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
        const election_id = getHydratedData().elections[22].election_id;

        await testApiEndpoint({
            next: votersEndpoint,
            params: { id: election_id },
            test: async ({ fetch }) => {
                const response = await fetch({ headers: { KEY } });
                const { success, votes, ...rest } = await response.json();

                expect(response.status).toBe(200);
                expect(success).toBeTrue();
                expect(Object.keys(rest).length).toBe(0);
                expect(votes).toEqual((await getRankings(election_id)));
            }
        });
    });

    it('can use PUT to mutate election rankings', async () => {
        const election_id = getHydratedData().elections[52].election_id;

        await testApiEndpoint({
            next: votersEndpoint,
            params: { id: election_id },
            test: async ({ fetch }) => {
                const mutation = [{ voter_id: 'X', ranking: ['Walking Dead'] }];

                const response = await fetch({
                    method: 'PUT',
                    headers: { KEY, 'Content-Type': 'application/json' },
                    body: JSON.stringify(mutation)
                });

                expect(response.status).toBe(200);
                expect(await getRankings(election_id)).toEqual(mutation);
            }
        });
    });

    it('returns an empty array when querying a brand new election_id', async () => {
        const { election_id } = await upsertElection({
            key: KEY,
            election: {
                title: 'Mine!',
                opens: Date.now() + 10**5,
                closes: Date.now() + 10**6
            }
        });

        await testApiEndpoint({
            next: votersEndpoint,
            params: { id: election_id },
            test: async ({ fetch }) => {
                const response = await fetch({ headers: { KEY } });
                const { success, votes } = await response.json();

                expect(response.status).toBe(200);
                expect(success).toBeTrue();
                expect(votes).toEqual([]);
            }
        });
    });

    it('returns a 400 error on invalid data during PUT', async () => {
        const election_id = getHydratedData().elections[52].election_id;

        const getInvalidData = function*() {
            yield { data: 1 };
            yield { 1: '1', 2: '2' };
            yield [{ 1: '1', 2: '2' }];
            yield undefined;
            yield null;
            yield NaN;
            yield [{}];
            yield [[]];
            yield [undefined];
            yield [{ vote: 1, rank: []}];
            yield [{ voter_id: 1, rankings: []}];
            yield [{ voter_id: '1', rankings: ['FAKER']}];
        }();

        await testApiEndpoint({
            next: votersEndpoint,
            params: { id: election_id },
            test: async ({ fetch }) => {
                const responses = await Promise.all([...Array(12)].map(_ => fetch({
                    method: 'PUT',
                    headers: { KEY, 'Content-Type': 'application/json' },
                    body: JSON.stringify(getInvalidData.next().value)
                }).then(r => r.status)));

                expect(responses).toEqual([
                    ...[...Array(12)].map(_ => 400)
                ]);
            }
        });
    });

    it('returns a 403 error when trying to mutate an unowned election_id', async () => {
        const election_id = getHydratedData().elections[0].election_id;

        await testApiEndpoint({
            next: votersEndpoint,
            params: { id: election_id },
            test: async ({ fetch }) => {
                const response = await fetch({
                    method: 'PUT',
                    headers: { KEY, 'Content-Type': 'application/json' },
                    body: JSON.stringify([])
                });

                expect(response.status).toBe(403);
            }
        });
    });

    it('returns a 404 error if election_id does not exist', async () => {
        const election_id = (new ObjectId()).toHexString();

        await testApiEndpoint({
            next: votersEndpoint,
            params: { id: election_id },
            test: async ({ fetch }) => {
                const responses = await Promise.all([
                    fetch({ method: 'GET', headers: { KEY }}),
                    fetch({
                        method: 'PUT',
                        headers: { KEY, 'Content-Type': 'application/json' },
                        body: JSON.stringify([])
                    }),
                ].map(p => p.then(r => r.status)));

                expect(responses).toEqual([ 404, 404 ]);
            }
        });
    });
});
