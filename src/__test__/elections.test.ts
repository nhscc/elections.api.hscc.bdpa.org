import { setupJest } from 'universe/__test__/db'
import { testApiEndpoint } from 'multiverse/test-api-endpoint'
import * as Elections from 'universe/pages/api/v1/elections'
import { getEnv } from 'universe/backend/env'
import { ObjectId } from 'mongodb'

import type { PublicElection, InternalElection } from 'types/global'

const { getHydratedData, getDb } = setupJest();

const electionsEndpoint: typeof Elections.default & { config?: Record<string, unknown> } = Elections.default;
electionsEndpoint.config = Elections.config;

process.env.REQUESTS_PER_CONTRIVED_ERROR = '0';

const KEY = '5db4c4d3-294a-4086-9751-f3fce82d11e4';

const containsOnlyPublicData = (o: Record<string, unknown>) => {
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

describe('api/v1/elections', () => {
    it('requests without a key return 401', async () => {
        await testApiEndpoint({
            next: electionsEndpoint,
            test: async ({ fetch }) => expect((await fetch()).status).toBe(401)
        });
    });

    it('requests that are too big return 413', async () => {
        await testApiEndpoint({
            next: electionsEndpoint,
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
            next: electionsEndpoint,
            test: async ({ fetch }) => expect((await fetch({ headers: { KEY } })).status).toBe(429)
        });
    });

    it('disallowed methods return 405', async () => {
        await testApiEndpoint({
            next: electionsEndpoint,
            test: async ({ fetch }) => {
                expect((await fetch({ method: 'PUT', headers: { KEY } })).status).toBe(405);
                expect((await fetch({ method: 'DELETE', headers: { KEY } })).status).toBe(405);
            }
        });
    });

    it('returns expected number of elections by default in FIFO order', async () => {
        await testApiEndpoint({
            next: electionsEndpoint,
            test: async ({ fetch }) => {
                const response = await fetch({ headers: { KEY } });
                const json = await response.json();

                const elections = getHydratedData().elections;

                expect(response.status).toBe(200);
                expect(json.success).toBe(true);
                expect(json.elections).toEqual(internalToPublic(elections.slice(0, 15)));
            }
        });
    });

    it('returns expected number of elections in FIFO order respecting limit and offset (after)', async () => {
        const elections = internalToPublic(getHydratedData().elections);

        const genUrl = function*() {
            yield `/?limit=1`;
            yield `/?limit=5`;
            yield `/?limit=10`;
            yield `/?limit=50`;
            yield `/?limit=50&after=${elections[0].election_id}`;
            yield `/?limit=50&after=${elections[10].election_id}`;
            yield `/?after=${elections[45].election_id}`;
            yield `/?limit=30&after=${elections[20].election_id}`;
        }();

        await testApiEndpoint({
            requestPatcher: req => { req.url = genUrl.next().value || undefined },

            next: electionsEndpoint,
            test: async ({ fetch }) => {
                const responses = await Promise.all([...Array(8)].map(_ => {
                    return fetch({ headers: { KEY } }).then(r => r.ok ? r.json() : null);
                }));

                expect(responses.some(o => !o?.success)).toBeFalse();

                expect(responses.map(r => r.elections)).toIncludeSameMembers([
                    elections.slice(0, 1),
                    elections.slice(0, 5),
                    elections.slice(0, 10),
                    elections.slice(0, 50),
                    elections.slice(1, 51),
                    elections.slice(11, 61),
                    elections.slice(46, 61),
                    elections.slice(21, 51)
                ]);
            }
        });
    });

    it('does the right thing when garbage params are provided', async () => {
        const genUrl = function*() {
            yield `/?limit=-5`;
            yield `/?limit=a`;
            yield `/?limit=`;
            yield `/?limit=@($)`;
            yield `/?limit=1&after=`;
            yield `/?limit=2&after=xyz`;
            yield `/?limit=3&after=123`;
            yield `/?after=(*$)`;
        }();

        await testApiEndpoint({
            requestPatcher: req => { req.url = genUrl.next().value || undefined },
            next: electionsEndpoint,
            test: async ({ fetch }) => {
                const responses = await Promise.all([...Array(8)].map(_ => {
                    return fetch({ headers: { KEY } }).then(r => r.status);
                }));

                expect(responses).toIncludeSameMembers([
                    400,
                    200,
                    200,
                    200,
                    200,
                    404,
                    404,
                    404
                ]);
            }
        });
    });

    it('returns only public and no private/internal election data', async () => {
        await testApiEndpoint({
            requestPatcher: req => { req.url = '/?limit=5' },
            next: electionsEndpoint,
            test: async ({ fetch }) => {
                const response = await fetch({ headers: { KEY } });
                const json = await response.json();

                expect(response.status).toBe(200);
                expect(json.success).toBe(true);
                expect(json.elections.some((o: Record<string, unknown>) => !containsOnlyPublicData(o))).toBeFalse();
            }
        });
    });

    it('returns a 400 error when query parameters are provided during POST requests', async () => {
        const elections = getHydratedData().elections;
        const genUrl = function*() {
            yield `/?limit=1`;
            yield `/?after=${elections[0].election_id}`;
        }();

        await testApiEndpoint({
            requestPatcher: req => { req.url = genUrl.next().value || undefined },
            next: electionsEndpoint,
            test: async ({ fetch }) => {
                const response1 = await fetch({ method: 'POST', headers: { KEY } });
                const response2 = await fetch({ method: 'POST', headers: { KEY } });
                const json1 = await response1.json();
                const json2 = await response2.json();

                expect(response1.status).toBe(400);
                expect(response2.status).toBe(400);
                expect(json1.error).toBe('query parameters are only allowed with GET requests');
                expect(json2.error).toBe('query parameters are only allowed with GET requests');
            }
        });
    });

    it('returns a 400 error when limit > MAX_LIMIT', async () => {
        await testApiEndpoint({
            requestPatcher: req => { req.url = `/?limit=${getEnv().MAX_LIMIT + 1}` },
            next: electionsEndpoint,
            test: async ({ fetch }) => {
                const response = await fetch({ headers: { KEY } });
                const json = await response.json();

                expect(response.status).toBe(400);
                expect(json.error).toBeString();
            }
        });
    });

    it('returns a 404 if the offset is valid but does not exist', async () => {
        await testApiEndpoint({
            requestPatcher: req => { req.url = `/?after=abcd1234` },
            next: electionsEndpoint,
            test: async ({ fetch }) => {
                const response = await fetch({ headers: { KEY } });
                const json = await response.json();

                expect(response.status).toBe(404);
                expect(json.error).toBeDefined();
            }
        });
    });

    it('limit=0 returns an empty array', async () => {
        const elections = getHydratedData().elections;
        const genUrl = function*() {
            yield `/?limit=0&after=${elections[0].election_id}`;
            yield `/?limit=0`;
        }();

        await testApiEndpoint({
            requestPatcher: req => { req.url = genUrl.next().value || undefined },
            next: electionsEndpoint,
            test: async ({ fetch }) => {
                const response1 = await fetch({ headers: { KEY } });
                const response2 = await fetch({ headers: { KEY } });
                const json1 = await response1.json();
                const json2 = await response2.json();

                expect(response1.status).toBe(200);
                expect(response2.status).toBe(200);
                expect(json1.success).toBeTrue();
                expect(json2.success).toBeTrue();
                expect(json1.elections).toEqual([]);
                expect(json2.elections).toEqual([]);
            }
        });
    });

    it('can use POST to create an election', async () => {
        await testApiEndpoint({
            next: electionsEndpoint,
            test: async ({ fetch }) => {
                const response = await fetch({
                    method: 'POST',
                    headers: { KEY, 'content-type': 'application/json' },
                    body: JSON.stringify({
                        title: 'My Election',
                        description: '',
                        options: [],
                        opens: Date.now() + 10**4,
                        closes: Date.now() + 10**6
                    })
                });

                expect(response.status).toBe(200);

                const election_id = (await response.json()).election_id;

                expect(election_id).toBeDefined();

                expect(await (await getDb()).collection('elections').find({
                    _id: new ObjectId(election_id)
                }).count()).toBe(1);
            }
        });
    });

    it('returns a 400 error on invalid data during POST', async () => {
        const getInvalidData = function*() {
            yield { data: 1 };
            yield { title: '', created: Date.now() };
            yield { title: 'test election', options: [{}, {}], opens: Date.now() + 10**4, closes: Date.now() + 10**5 };
            yield { title: 'my title', opens: Date.now() - 1000, closes: Date.now() + 10**5 };
            yield { title: 'my title #2', opens: Date.now() + 10**7, closes: Date.now() + 10**5 };
            yield { title: 'my title #3', opens: Date.now() + 10**5, closes: Date.now() + 10**7, description: 54 };
            yield { title: 'my title #4', opens: Date.now() + 10**5, closes: Date.now() + 10**7, options: [54] };
            yield { title: 'my title #5', opens: Date.now() + 10**5, closes: Infinity };
            yield { title: 'my title #6', opens: Date.now() + 10**5, closes: NaN };
            yield { title: 'my title #7', opens: undefined, closes: undefined };
            yield { title: 'my title #7', election_id: (new ObjectId()).toHexString() };
            yield {};
        }();

        await testApiEndpoint({
            next: electionsEndpoint,
            test: async ({ fetch }) => {
                const responses = await Promise.all([...Array(12)].map(_ => fetch({
                    method: 'POST',
                    headers: { KEY, 'content-type': 'application/json' },
                    body: JSON.stringify(getInvalidData.next().value)
                }).then(r => r.status)));

                expect(responses).toEqual([
                    ...[...Array(12)].map(_ => 400)
                ]);
            }
        });
    });
});
