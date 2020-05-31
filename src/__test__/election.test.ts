import { setupJest } from 'universe/__test__/db'
import { testApiEndpoint } from 'multiverse/test-api-endpoint'
import * as Election from 'universe/pages/api/v1/election/[id]'
import { getEnv } from 'universe/backend/env'

import type { PublicElection, InternalElection } from 'types/global'
import { getInternalElection, getPublicElection, doesElectionExist } from 'universe/backend'
import { ObjectId } from 'mongodb'

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

describe('api/v1/election', async () => {
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
                expect(success).toBeTrue();
                expect(containsOnlyPublicData(election)).toBeTrue();
            }
        });
    });

    it('can use PUT to mutate an election', async () => {
        const election_id = getHydratedData().elections[52].election_id;

        await testApiEndpoint({
            next: electionEndpoint,
            params: { id: election_id },
            test: async ({ fetch }) => {
                const mutation = {
                    election_id,
                    title: 'Flip mode!',
                    description: 'Flip mode family ties',
                    options: ['A', 'B', 'Z'],
                    closes: Date.now() + 10**8
                };

                const response = await fetch({
                    method: 'PUT',
                    headers: { KEY, 'Content-Type': 'application/json' },
                    body: JSON.stringify(mutation)
                });

                expect(response.status).toBe(200);

                expect(await getPublicElection({
                    electionId: election_id, key: KEY
                })).toContainEntries(Object.entries(mutation));
            }
        });
    });

    it('can use DELETE to delete an election', async () => {
        const election_id = getHydratedData().elections[52].election_id;

        await testApiEndpoint({
            next: electionEndpoint,
            params: { id: election_id },
            test: async ({ fetch }) => {
                expect(await doesElectionExist(election_id)).toBeTrue();

                const response = await fetch({ method: 'DELETE', headers: { KEY }});

                expect(response.status).toBe(200);
                expect(await doesElectionExist(election_id)).toBeFalse();
            }
        });
    });

    it('returns a 400 error on invalid data during PUT', async () => {
        const election_id = getHydratedData().elections[52].election_id;

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
            next: electionEndpoint,
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

    it('returns a 403 error when trying to PUT or DELETE with an election_id owned by a different key', async () => {
        const election_id = getHydratedData().elections[0].election_id;

        await testApiEndpoint({
            next: electionEndpoint,
            params: { id: election_id },
            test: async ({ fetch }) => {
                expect(await doesElectionExist(election_id)).toBeTrue();

                let response = await fetch({ method: 'DELETE', headers: { KEY }});

                expect(response.status).toBe(403);
                expect(await doesElectionExist(election_id)).toBeTrue();

                response = await fetch({
                    method: 'PUT',
                    headers: { KEY, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title: 'UPDATED TITLE SUPER COOL' })
                });

                expect(response.status).toBe(403);
            }
        });
    });

    it('returns a 404 error if election_id does not exist', async () => {
        const election_id = (new ObjectId()).toHexString();

        await testApiEndpoint({
            next: electionEndpoint,
            params: { id: election_id },
            test: async ({ fetch }) => {
                const responses = await Promise.all([
                    fetch({ method: 'GET', headers: { KEY }}),
                    fetch({ method: 'DELETE', headers: { KEY }}),
                    fetch({
                        method: 'PUT',
                        headers: { KEY, 'Content-Type': 'application/json' },
                        body: JSON.stringify({ title: 'UPDATED TITLE SUPER COOL' })
                    }),
                ].map(p => p.then(r => r.status)));

                expect(responses).toEqual([ 404, 404, 404 ]);
            }
        });
    });
});
