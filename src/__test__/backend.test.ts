import { ObjectId, WithId } from 'mongodb';
import * as Backend from 'universe/backend'
import { setupJest, unhydratedDummyDbData } from 'universe/__test__/db'
import { getEnv } from 'universe/backend/env'
import { populateEnv } from 'universe/dev-utils'
import randomInt from 'random-int'

import {
    InternalElection,
    NewElection,
    PatchElection,
    PublicElection,
    RequestLogEntry,
    VoterRanking,
    LimitedLogEntry
} from 'types/global'

import type{ NextApiRequest, NextApiResponse } from 'next'

populateEnv();

const { getHydratedData, getDb } = setupJest();

const getExpectedMeta = () => {
    const expectedMeta = {
        upcomingElections: 0,
        openElections: 0,
        closedElections: 0
    };

    unhydratedDummyDbData.elections.forEach(election => {
        !election.deleted && (election.closes <= Date.now()
            ? expectedMeta.closedElections++
            : (election.opens > Date.now() ? expectedMeta.upcomingElections++ : expectedMeta.openElections++));
    });

    return expectedMeta;
};

describe('universe/backend', () => {
    describe('::getElectionMetadata', () => {
        it('returns expected metadata (does not count deleted elections)',
            async () => expect(await Backend.getElectionMetadata()).toEqual(getExpectedMeta()));
    });

    describe('::getPublicElections', () => {
        it('returns only public elections data', async () => {
            const elections = getHydratedData().elections;
            const index = randomInt(0, elections.length - 1);

            const {
                title,
                election_id,
                closes,
                created,
                deleted,
                description,
                opens,
                options,
                owner,
                ...rest
            } = elections[index];

            expect(Object.keys(rest).length).toBe(0);
            expect(await (await Backend.getPublicElections({
                key: Backend.NULL_KEY,
                limit: 1,
                after: elections[index - 1].election_id
            })).toArray()).toEqual<PublicElection[]>([{
                election_id,
                title,
                description,
                options,
                created,
                opens,
                closes,
                deleted,
                owned: owner == Backend.NULL_KEY
            }]);
        });

        it('rejects if no key is provided', async () => {
            /* eslint-disable @typescript-eslint/ban-ts-ignore */
            // @ts-ignore
            expect(Backend.getPublicElections()).toReject();
            // @ts-ignore
            expect(Backend.getPublicElections({ key: 5 })).toReject();
            // @ts-ignore
            expect(Backend.getPublicElections({ key: null })).toReject();
            /* eslint-enable @typescript-eslint/ban-ts-ignore */
        });

        it('returns paginated data respecting limit and after', async () => {
            const elections = getHydratedData().elections.map(e => {
                const { owner, ...election } = e;

                return {
                    ...election,
                    owned: owner == Backend.NULL_KEY,
                } as PublicElection
            });

            const defaultResults = elections.slice(0, Backend.DEFAULT_RESULT_LIMIT);

            expect(await (await Backend.getPublicElections({
                key: Backend.NULL_KEY,
                limit: Backend.DEFAULT_RESULT_LIMIT
            })).toArray()).toEqual(defaultResults);

            expect(await (await Backend.getPublicElections({
                key: Backend.NULL_KEY,
                after: null
            })).toArray()).toEqual(defaultResults);

            expect(await (await Backend.getPublicElections({
                key: Backend.NULL_KEY,
                limit: Backend.DEFAULT_RESULT_LIMIT,
                after: null
            })).toArray()).toEqual(defaultResults);

            expect(await (await Backend.getPublicElections({
                key: Backend.NULL_KEY,
                after: elections[0].election_id
            })).toArray()).toEqual(elections.slice(1, Backend.DEFAULT_RESULT_LIMIT + 1));

            expect(await (await Backend.getPublicElections({
                key: Backend.NULL_KEY,
                limit: 1
            })).toArray()).toEqual(elections.slice(0, 1));

            expect(await (await Backend.getPublicElections({
                key: Backend.NULL_KEY,
                limit: 1,
                after: elections[0].election_id
            })).toArray()).toEqual(elections.slice(1, 2));

            expect(await (await Backend.getPublicElections({
                key: Backend.NULL_KEY,
                limit: 3,
                after: elections[1].election_id
            })).toArray()).toEqual(elections.slice(2, 5));

            expect(await (await Backend.getPublicElections({
                key: Backend.NULL_KEY,
                limit: getEnv().MAX_LIMIT,
                after: elections[11].election_id
            })).toArray()).toEqual(elections.slice(12, getEnv().MAX_LIMIT + 12));

            expect(await (await Backend.getPublicElections({
                key: Backend.NULL_KEY,
                after: elections[elections.length - 1].election_id
            })).toArray()).toEqual([]);

            expect(await (await Backend.getPublicElections({
                key: Backend.NULL_KEY,
                after: elections[elections.length - 2].election_id
            })).toArray()).toEqual(elections.slice(-1));

            expect(await (await Backend.getPublicElections({
                key: Backend.NULL_KEY,
                after: new ObjectId()
            })).toArray()).toEqual([]);
        });

        it('rejects on non-positive/too large limit or invalid after', async () => {
            expect(Backend.getPublicElections({ key: Backend.NULL_KEY, limit: getEnv().MAX_LIMIT + 1 })).toReject();
            expect(Backend.getPublicElections({ key: Backend.NULL_KEY, limit: 0 })).toReject();
            expect(Backend.getPublicElections({ key: Backend.NULL_KEY, limit: -1 })).toReject();

            expect(() => Backend.getPublicElections({
                key: Backend.NULL_KEY,
                after: new ObjectId('doesnE!')
            })).toThrow();

            expect(Backend.getPublicElections({
                key: Backend.NULL_KEY,
                // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
                // @ts-ignore
                after: 'notAnObjectId!'
            })).toReject();
        });

        it('rejects on strange/bad limit and/or after', async () => {
            /* eslint-disable @typescript-eslint/ban-ts-ignore */
            // @ts-ignore
            expect(Backend.getPublicElections({ key: Backend.NULL_KEY, limit: 'lol' })).toReject();
            // @ts-ignore
            expect(Backend.getPublicElections({ key: Backend.NULL_KEY, limit: null })).toReject();
            // @ts-ignore
            expect(Backend.getPublicElections({ key: Backend.NULL_KEY, limit: false })).toReject();
            // @ts-ignore
            expect(Backend.getPublicElections({ key: Backend.NULL_KEY, after: 0 })).toReject();
            // @ts-ignore
            expect(Backend.getPublicElections({ key: Backend.NULL_KEY, after: 100 })).toReject();
            // @ts-ignore
            expect(Backend.getPublicElections({ key: Backend.NULL_KEY, after: false })).toReject();
            /* eslint-enable @typescript-eslint/ban-ts-ignore */
        });
    });

    describe('::getPublicElection', () => {
        it('returns only public election data', async () => {
            const election = getHydratedData().elections[0];

            expect(await Backend.getPublicElection({
                electionId: election.election_id,
                key: Backend.NULL_KEY
            })).toEqual<PublicElection>({
                election_id: election.election_id,
                title: election.title,
                description: election.description,
                options: election.options as string[],
                created: election.created,
                opens: election.opens,
                closes: election.closes,
                deleted: election.deleted,
                owned: election.owner == Backend.NULL_KEY
            });
        });

        it('rejects if election_id does not exist', async () => {
            expect(Backend.getPublicElection({ electionId: new ObjectId(), key: Backend.NULL_KEY })).toReject();
            // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
            //@ts-ignore
            expect(Backend.getPublicElection({ electionId: 'not a real id', key: Backend.NULL_KEY })).toReject();
        });
    });

    describe('::getInternalElection', () => {
        it('returns internal election data', async () => {
            const elections = getHydratedData().elections;

            expect(await Backend.getInternalElection(elections[0].election_id)).toEqual(elections[0]);
            expect(await Backend.getInternalElection(elections[1].election_id)).toEqual(elections[1]);
            expect(await Backend.getInternalElection(elections[5].election_id)).toEqual(elections[5]);
            expect(await Backend.getInternalElection(elections[elections.length - 1].election_id))
                .toEqual(elections[elections.length - 1]);
        });

        it('rejects if election_id does not exist', async () => {
            expect(Backend.getInternalElection(new ObjectId())).toReject();
        });
    });

    describe('::doesElectionExist', () => {
        it('returns expected result with various elections, some non-existent', async () => {
            const elections = getHydratedData().elections;

            expect(await Backend.doesElectionExist(new ObjectId())).toEqual(false);
            /* eslint-disable @typescript-eslint/ban-ts-ignore */
            // @ts-ignore
            expect(Backend.doesElectionExist(null)).toReject();
            // @ts-ignore
            expect(Backend.doesElectionExist(undefined)).toReject();
            /* eslint-enable @typescript-eslint/ban-ts-ignore */
            expect(await Backend.doesElectionExist(elections[0].election_id)).toEqual(true);
            expect(await Backend.doesElectionExist(elections[1].election_id)).toEqual(true);
            expect(await Backend.doesElectionExist(elections[5].election_id)).toEqual(true);
            expect(await Backend.doesElectionExist(elections[10].election_id)).toEqual(true);
            expect(await Backend.doesElectionExist(elections[elections.length - 1].election_id)).toEqual(true);
        });
    });

    describe('::upsertElection', () => {
        it('inserts a new election when election_id does not exist', async () => {
            const newElection = {
                title: 'New election',
                description: 'This is a new election',
                opens: Date.now() + 10**6,
                closes: Date.now() + 10**7
            };

            // ? Bad props should be ignored
            const badProps = {
                election_id: new ObjectId(),
                /* eslint-disable @typescript-eslint/ban-ts-ignore */
                // @ts-ignore
                _id: new ObjectId(),
                // @ts-ignore
                created: 0,
                //@ ts-ignore
                deleted: false,
                // @ts-ignore
                owner: 'fake-owner-id',
                // @ts-ignore
                fakeprop: 'bad',
                /* eslint-enable @typescript-eslint/ban-ts-ignore */
            };

            const results = await Promise.all(Object.entries(badProps).map(([k, v]) => Backend.upsertElection({
                election: { ...newElection, [k]: v } as NewElection,
                key: Backend.NULL_KEY
            }).then(() => true, () => false)));

            expect(results).toEqual([false, false, false, false, false, false]);

            const election = await Backend.upsertElection({
                election: newElection,
                key: Backend.NULL_KEY
            });

            const returnedElection = await Backend.getInternalElection(election.election_id || new ObjectId('bad'));
            expect(returnedElection.election_id).not.toEqual(badProps.election_id);
            expect(returnedElection.owner).toEqual(Backend.NULL_KEY);
            expect(returnedElection).toEqual(election);

            expect(Backend.upsertElection({
                election: badProps as unknown as NewElection,
                key: Backend.NULL_KEY
            })).toReject();
        });

        it('does not allow invalid opens/closes times', async () => {
            const newElection: NewElection = {
                title: 'New election',
                description: 'This is a new election',
                options: ['1', '2'],
                opens: Date.now() + 10**6,
                closes: Date.now() + 10**7,
            };

            const { opens, closes, ...badElection } = newElection;

            expect(Backend.upsertElection({
                election: { ...newElection, opens: 100, closes: 200 },
                key: Backend.NULL_KEY
            })).toReject();

            /* eslint-disable @typescript-eslint/ban-ts-ignore */
            // @ts-ignore
            expect(Backend.upsertElection({
                election: { ...badElection, opens },
                key: Backend.NULL_KEY
            })).toReject();

            // @ts-ignore
            expect(Backend.upsertElection({
                election: { ...badElection, closes },
                key: Backend.NULL_KEY
            })).toReject();
            /* eslint-enable @typescript-eslint/ban-ts-ignore */

            expect(Backend.upsertElection({
                election: { ...badElection, closes: 100, opens },
                key: Backend.NULL_KEY
            })).toReject();

            expect(Backend.upsertElection({
                election: { ...badElection, opens: 100, closes },
                key: Backend.NULL_KEY
            })).toReject();

            expect(Backend.upsertElection({
                election: { ...badElection, opens: closes, closes: opens },
                key: Backend.NULL_KEY
            })).toReject();
        });

        it('updates an existing election when election_id already exists', async () => {
            const newElection: NewElection = {
                title: 'New election',
                description: 'This is a new election',
                options: ['1', '2'],
                opens: Date.now() + 10**6,
                closes: Date.now() + 10**7,
            };

            const election1 = await Backend.upsertElection({ election: newElection, key: Backend.NULL_KEY });

            expect(typeof election1.election_id === 'undefined').toBeFalse();

            const election2 = await Backend.upsertElection({
                electionId: election1.election_id,
                election: { ...newElection, opens: newElection.opens + 200, closes: newElection.closes + 300 }
            });

            // ? Bad props should be ignored
            const badProps = {
                // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
                // @ts-ignore
                created: 100,
                opens: newElection.closes,
                closes: newElection.opens,
                _id: new Object(),
                election_id: new Object(),
                extra: 'bad'
            };

            const results = await Promise.all(Object.entries(badProps).map(([k, v]) => Backend.upsertElection({
                electionId: election1.election_id,
                election: { ...newElection, [k]: v } as NewElection
            }).then(() => true, () => false)));

            expect(results).toEqual([false, false, false, false, false, false]);

            expect(election2.election_id).toEqual(election1.election_id);
            expect(election1.opens).toEqual(newElection.opens);
            expect(election2.opens).toEqual(newElection.opens + 200);

            const returnedElection = await Backend.getInternalElection(election1.election_id || new ObjectId('bad'));

            expect(returnedElection.election_id).toEqual(election1.election_id);
            /* eslint-disable @typescript-eslint/ban-ts-ignore */
            // @ts-ignore
            expect(returnedElection._id).toBeUndefined();
            // @ts-ignore
            expect(returnedElection.extra).toBeUndefined();
            /* eslint-enable @typescript-eslint/ban-ts-ignore */
            expect(returnedElection.created).toEqual(election1.created);
            // ? Bad props should be ignored!
            expect(returnedElection.created).not.toEqual(100);
            expect(returnedElection.opens).toEqual(newElection.opens + 200);
            expect(returnedElection.closes).toEqual(newElection.closes + 300);
        });

        it('rejects when missing necessary params', async () => {
            /* eslint-disable @typescript-eslint/ban-ts-ignore */
            // @ts-ignore
            const newElection00: NewElection = { election_id: 'fake', bad: 'nope' };
            // @ts-ignore
            const newElection0: NewElection = {};
            // @ts-ignore
            const newElection1: NewElection = {
                description: 'This is a new election',
                options: ['1', '2'],
                opens: Date.now() + 10**6,
                closes: Date.now() + 10**7
            };
            // @ts-ignore
            const newElection2: NewElection = {
                title: 'New election',
                description: 'This is a new election',
                closes: Date.now() + 10**7
            };
            // @ts-ignore
            const newElection3: NewElection = {
                title: 'New election',
                opens: Date.now() + 10**6,
            };
            /* eslint-enable @typescript-eslint/ban-ts-ignore */

            expect(Backend.upsertElection({ election: newElection1, key: Backend.NULL_KEY })).toReject();
            expect(Backend.upsertElection({ election: newElection2, key: Backend.NULL_KEY })).toReject();
            expect(Backend.upsertElection({ election: newElection3, key: Backend.NULL_KEY })).toReject();

            expect(Backend.upsertElection({ election: newElection0, key: Backend.NULL_KEY })).toReject();
            expect(Backend.upsertElection({ election: newElection00, key: Backend.NULL_KEY })).toReject();

            const election_id = getHydratedData().elections[0].election_id;

            expect(Backend.upsertElection({ election: newElection0, electionId: election_id })).toReject();
            expect(Backend.upsertElection({ election: newElection00, electionId: election_id })).toReject();
        });

        it('does not reject on valid new elections', async () => {
            const newElection1: NewElection = {
                title: 'New election',
                description: 'This is a new election',
                options: ['1', '2'],
                opens: Date.now() + 10**6,
                closes: Date.now() + 10**7,
            };

            const newElection2: NewElection = {
                title: 'New election',
                opens: Date.now() + 10**6,
                closes: Date.now() + 10**7,
            };

            expect(Backend.upsertElection({ election: newElection1, key: Backend.NULL_KEY })).toResolve();
            expect(Backend.upsertElection({ election: newElection2, key: Backend.NULL_KEY })).toResolve();
        });

        it('does not reject on valid election updates', async () => {
            const election_id = getHydratedData().elections.slice(-1)[0].election_id;

            const electionPatch0: PatchElection = { options: undefined };
            const electionPatch1: PatchElection = {};

            const electionPatch2: PatchElection = {
                title: 'New election',
                opens: Date.now() + 10**6,
                closes: Date.now() + 10**7,
            };

            const electionPatch3: PatchElection = {
                options: [],
            };

            const electionPatch4: PatchElection = {
                title: 'faker title',
                options: undefined,
            };

            expect(Backend.upsertElection({ election: electionPatch2, electionId: election_id })).toResolve();
            expect(Backend.upsertElection({ election: electionPatch3, electionId: election_id })).toResolve();
            expect(Backend.upsertElection({ election: electionPatch4, electionId: election_id })).toResolve();
            expect(Backend.upsertElection({ election: electionPatch1, electionId: election_id })).toReject();
            expect(Backend.upsertElection({ election: electionPatch0, electionId: election_id })).toReject();
        });

        it('rejects for new elections when illegal keys provided or required keys missing', async () => {
            const newElection1 = {
                opens: Date.now() + 10**6,
                closes: Date.now() + 10**7,
            } as unknown as NewElection;

            const newElection2 = {
                title: 'My new election!',
                description: 'This is a new election',
                options: ['1', '2'],
                closes: Date.now() + 10**7,
            } as unknown as NewElection;

            const newElection3 = {
                title: 'My new election!',
                opens: Date.now() + 10**6,
            } as unknown as NewElection;

            const newElection4 = {
                title: 'My new election!',
                opens: Date.now() + 10**6,
                closes: Date.now() + 10**7,
                deleted: false
            } as unknown as NewElection;

            const newElection5 = {
                title: 'My new election!',
                opens: Date.now() + 10**6,
                closes: Date.now() + 10**7,
                owned: true
            } as unknown as NewElection;

            const newElection6 = {
                title: 'My new election!',
                opens: Date.now() + 10**6,
                closes: Date.now() + 10**7,
                owner: Backend.NULL_KEY
            } as unknown as NewElection;

            const newElection7 = {
                title: 'My new election!',
                opens: Date.now() + 10**6,
                closes: Date.now() + 10**7,
                blahblahlblah: true,
            } as unknown as NewElection;

            expect(Backend.upsertElection({ election: newElection1, key: Backend.NULL_KEY })).toReject();
            expect(Backend.upsertElection({ election: newElection2, key: Backend.NULL_KEY })).toReject();
            expect(Backend.upsertElection({ election: newElection3, key: Backend.NULL_KEY })).toReject();
            expect(Backend.upsertElection({ election: newElection4, key: Backend.NULL_KEY })).toReject();
            expect(Backend.upsertElection({ election: newElection5, key: Backend.NULL_KEY })).toReject();
            expect(Backend.upsertElection({ election: newElection6, key: Backend.NULL_KEY })).toReject();
            expect(Backend.upsertElection({ election: newElection7, key: Backend.NULL_KEY })).toReject();
        });

        it('rejects for updating elections when illegal keys provided', async () => {
            const election_id = getHydratedData().elections.slice(-1)[0].election_id;

            const patchElection2 = {
                created: 0,
            } as unknown as PatchElection;

            const patchElection3 = {
                owner: Backend.NULL_KEY,
            } as unknown as PatchElection;

            const patchElection4 = {
                options: null,
            } as unknown as PatchElection;

            const patchElection5 = {
                owned: true
            } as unknown as PatchElection;

            const patchElection6 = {
                election_id: new ObjectId(),
            } as unknown as PatchElection;

            expect(Backend.upsertElection({ election: patchElection2, electionId: election_id })).toReject();
            expect(Backend.upsertElection({ election: patchElection3, electionId: election_id })).toReject();
            expect(Backend.upsertElection({ election: patchElection4, electionId: election_id })).toReject();
            expect(Backend.upsertElection({ election: patchElection5, electionId: election_id })).toReject();
            expect(Backend.upsertElection({ election: patchElection6, electionId: election_id })).toReject();
        });

        it('rejects on elections with options.length > MAX_OPTIONS_PER_ELECTION', async () => {
            const election_id = getHydratedData().elections.slice(-1)[0].election_id;

            const newElection: NewElection = {
                title: 'New election',
                description: 'This is a new election',
                options: [...Array(getEnv().MAX_OPTIONS_PER_ELECTION + 1)].map((_, ndx) => ndx.toString()),
                opens: Date.now() + 10**6,
                closes: Date.now() + 10**7,
            };

            expect(Backend.upsertElection({ election: newElection, key: Backend.NULL_KEY })).toReject();
            expect(Backend.upsertElection({ election: newElection, electionId: election_id })).toReject();
        });

        it('rejects if any of the values are the incorrect type (number/string)', async () => {
            const election_id = getHydratedData().elections.slice(-1)[0].election_id;

            const newElection1 = {
                title: null,
                opens: Date.now() + 10**6,
                closes: Date.now() + 10**7,
            } as unknown as InternalElection;

            const newElection2 = {
                title: '',
                opens: null,
                closes: Date.now() + 10**7,
            } as unknown as InternalElection;

            const newElection3 = {
                title: '',
                opens: Date.now() + 10**6,
                closes: '10000',
            } as unknown as InternalElection;

            const newElection4 = {
                title: '',
                opens: Date.now() + 10**6,
                closes: Date.now() + 10**7,
                options: null
            } as unknown as InternalElection;

            const newElection5 = {
                title: '',
                opens: Date.now() + 10**6,
                closes: Date.now() + 10**7,
                options: [1, 2]
            } as unknown as InternalElection;

            const newElection6 = {
                title: '',
                opens: Date.now() + 10**6,
                closes: Date.now() + 10**7,
                options: [true]
            } as unknown as InternalElection;

            const newElection7 = {
                title: '',
                opens: Date.now() + 10**6,
                closes: Date.now() + 10**7,
                options: [undefined]
            } as unknown as InternalElection;

            const newElection8 = {
                title: '',
                opens: Date.now() + 10**6,
                closes: Date.now() + 10**7,
                description: null
            } as unknown as InternalElection;

            const newElection9 = {
                title: '',
                opens: Date.now() + 10**6,
                closes: Date.now() + 10**7,
                description: undefined
            } as unknown as InternalElection;

            const newElection10 = {
                title: undefined,
                opens: Date.now() + 10**6,
                closes: Date.now() + 10**7,
            } as unknown as InternalElection;

            expect(Backend.upsertElection({ election: newElection1, key: Backend.NULL_KEY })).toReject();
            expect(Backend.upsertElection({ election: newElection2, key: Backend.NULL_KEY })).toReject();
            expect(Backend.upsertElection({ election: newElection3, key: Backend.NULL_KEY })).toReject();
            expect(Backend.upsertElection({ election: newElection4, key: Backend.NULL_KEY })).toReject();
            expect(Backend.upsertElection({ election: newElection5, key: Backend.NULL_KEY })).toReject();
            expect(Backend.upsertElection({ election: newElection6, key: Backend.NULL_KEY })).toReject();
            expect(Backend.upsertElection({ election: newElection7, key: Backend.NULL_KEY })).toReject();
            expect(Backend.upsertElection({ election: newElection8, key: Backend.NULL_KEY })).toReject();
            expect(Backend.upsertElection({ election: newElection9, key: Backend.NULL_KEY })).toReject();
            expect(Backend.upsertElection({ election: newElection10, key: Backend.NULL_KEY })).toReject();

            expect(Backend.upsertElection({ election: newElection1, electionId: election_id })).toReject();
            expect(Backend.upsertElection({ election: newElection2, electionId: election_id })).toReject();
            expect(Backend.upsertElection({ election: newElection3, electionId: election_id })).toReject();
            expect(Backend.upsertElection({ election: newElection4, electionId: election_id })).toReject();
            expect(Backend.upsertElection({ election: newElection5, electionId: election_id })).toReject();
            expect(Backend.upsertElection({ election: newElection6, electionId: election_id })).toReject();
            expect(Backend.upsertElection({ election: newElection7, electionId: election_id })).toReject();
            expect(Backend.upsertElection({ election: newElection8, electionId: election_id })).toReject();
            expect(Backend.upsertElection({ election: newElection9, electionId: election_id })).toReject();
            expect(Backend.upsertElection({ election: newElection10, electionId: election_id })).not.toReject();
        });
    });

    describe('::isKeyAuthentic', () => {
        it('returns expected result on valid and invalid keys', async () => {
            expect(Backend.isKeyAuthentic('')).toReject();
            expect(await Backend.isKeyAuthentic('d68d8b5e-b926-4925-ac77-1013e56b8c81')).toEqual(false);
            expect(await Backend.isKeyAuthentic(getHydratedData().keys[0].key)).toEqual(true);
        });

        it('returns false if key is NULL_KEY', async () => {
            expect(await Backend.isKeyAuthentic(Backend.NULL_KEY)).toEqual(false);
        });
    });

    describe('::deleteElection', () => {
        it('soft deletes but does not eliminate election document', async () => {
            const election_id = getHydratedData().elections[0].election_id;

            expect(await Backend.doesElectionExist(election_id)).toEqual(true);

            await Backend.deleteElection(election_id);

            expect(await Backend.doesElectionExist(election_id)).toEqual(true);
            expect((await Backend.getInternalElection(election_id)).deleted).toEqual(true);
        });
    });

    describe('::replaceRankings and ::getRankings', () => {
        it("::replaceRankings replaces an election's rankings data, returned by ::getRankings", async () => {
            const election = getHydratedData().elections[0];
            const oldRankings = await Backend.getRankings(election.election_id);
            const newRankings = [{ voter_id: '1', ranking: election.options }];

            await Backend.replaceRankings({ electionId: election.election_id, rankings: newRankings });

            expect(oldRankings.length > 0).toEqual(true);
            expect(await Backend.getRankings(election.election_id)).toEqual(newRankings);

            await Backend.replaceRankings({ electionId: election.election_id, rankings: oldRankings });
            expect(await Backend.getRankings(election.election_id)).toEqual(oldRankings);

            await Backend.replaceRankings({ electionId: election.election_id, rankings: [] });
            expect(await Backend.getRankings(election.election_id)).toEqual([]);

            const newerRankings = [{ voter_id: '1', ranking: [] }, { voter_id: '2', ranking: [] }];

            await Backend.replaceRankings({ electionId: election.election_id, rankings: newerRankings });
            expect(await Backend.getRankings(election.election_id)).toEqual(newerRankings);

            const newestRankings = [...oldRankings.slice(1)];

            await Backend.replaceRankings({ electionId: election.election_id, rankings: newestRankings });
            expect(await Backend.getRankings(election.election_id)).toEqual(newestRankings);
        });

        it('::replaceRankings and ::getRankings rejects if election_id does not exist', async () => {
            expect(Backend.replaceRankings({ electionId: new ObjectId(), rankings: [] })).toReject();
            expect(Backend.getRankings(new ObjectId())).toReject();
        });

        it('::replaceRankings rejects on illegal options', async () => {
            /* eslint-disable @typescript-eslint/ban-ts-ignore */
            expect(Backend.replaceRankings({
                electionId: getHydratedData().elections[0].election_id,
                // @ts-ignore
                rankings: [1]
            })).toReject();

            expect(Backend.replaceRankings({
                electionId: getHydratedData().elections[0].election_id,
                // @ts-ignore
                rankings: [1, 2]
            })).toReject();

            expect(Backend.replaceRankings({
                electionId: getHydratedData().elections[0].election_id,
                // @ts-ignore
                rankings: [{}]
            })).toReject();

            expect(Backend.replaceRankings({
                electionId: getHydratedData().elections[0].election_id,
                // @ts-ignore
                rankings: [{}, {}]
            })).toReject();

            expect(Backend.replaceRankings({
                electionId: getHydratedData().elections[0].election_id,
                // @ts-ignore
                rankings: [{ a: 1 }, { b: 2 }]
            })).toReject();

            expect(Backend.replaceRankings({
                electionId: getHydratedData().elections[0].election_id,
                // @ts-ignore
                rankings: [{ voter_id: 1 }]
            })).toReject();

            expect(Backend.replaceRankings({
                electionId: getHydratedData().elections[0].election_id,
                // @ts-ignore
                rankings: [{ voter_id: '1' }]
            })).toReject();

            expect(Backend.replaceRankings({
                electionId: getHydratedData().elections[0].election_id,
                // @ts-ignore
                rankings: [{ voter_id: '1', ranking: [1] }]
            })).toReject();

            /* eslint-enable @typescript-eslint/ban-ts-ignore */
            expect(Backend.replaceRankings({
                electionId: getHydratedData().elections[0].election_id,
                rankings: [{ voter_id: '1', ranking: ['1'] }]
            })).toReject();

            expect(Backend.replaceRankings({
                electionId: getHydratedData().elections[0].election_id,
                rankings: [{ voter_id: '1', ranking: ['1', '2'] }]
            })).toReject();
        });

        it('does not reject on valid rankings but does on invalid rankings', async () => {
            const election = getHydratedData().elections[0];
            const newRankings1: VoterRanking[] = [];

            const newRankings2: VoterRanking[] = [
                { voter_id: 'my-userid1', ranking: election.options },
            ];

            const newRankings3: VoterRanking[] = [
                { voter_id: 'my-userid1', ranking: election.options },
                { voter_id: 'my-userid2', ranking: election.options },
                { voter_id: 'my-userid3', ranking: election.options },
            ];

            expect(Backend.replaceRankings({
                electionId: election.election_id,
                rankings: null as unknown as VoterRanking[]
            })).toReject();

            expect(Backend.replaceRankings({
                electionId: election.election_id,
                rankings: false as unknown as VoterRanking[]
            })).toReject();

            expect(Backend.replaceRankings({
                electionId: election.election_id,
                rankings: newRankings1
            })).toResolve();

            expect(Backend.replaceRankings({
                electionId: election.election_id,
                rankings: newRankings2
            })).toResolve();

            expect(Backend.replaceRankings({
                electionId: election.election_id,
                rankings: newRankings3
            })).toResolve();
        });

        it('rejects on rankings with length > MAX_RANKINGS_PER_ELECTION', async () => {
            const election = getHydratedData().elections[0];
            const newRankings = [...Array(getEnv().MAX_RANKINGS_PER_ELECTION + 1)].map((_, ndx) =>
                ({ voter_id: ndx.toString(), ranking: election.options }));

            expect(Backend.replaceRankings({
                electionId: election.election_id,
                rankings: newRankings
            })).toReject();
        });

        it('rejects on rankings that include non-existent options for the election', async () => {
            expect(Backend.replaceRankings({
                electionId: getHydratedData().elections[0].election_id,
                rankings: [{ voter_id: '5', ranking: ['FAKE'] }]
            })).toReject();
        });

        it('rejects if any of the ids or rankings are not the correct type', async () => {
            const election = getHydratedData().elections[0];
            const newRankings1 = [undefined];
            const newRankings2 = [null];
            const newRankings3 = [[]];
            const newRankings4 = [{}];
            const newRankings5 = [[{}]];
            const newRankings6 = [{ blah: 'blah' }];
            const newRankings7 = [{ voter_id: 'blah' }];
            const newRankings8 = [{ ranking: election.options }];
            const newRankings9 = [{ voter_id: 5, ranking: election.options }];
            const newRankings10 = [{ voter_id: true, ranking: election.options }];
            const newRankings11 = [{ voter_id: 'blah', ranking: true }];
            const newRankings12 = [{ voter_id: undefined, ranking: undefined }];
            const newRankings13 = [{ voter_id: null, ranking: null }];
            const newRankings14 = [{ voter_id: null, ranking: election.options }];
            const newRankings15 = [{ voter_id: undefined, ranking: election.options }];
            const newRankings16 = [{ voter_id: 'blah', ranking: null }];
            const newRankings17 = [{ voter_id: 'blah', ranking: undefined }];
            const newRankings18 = [{ voter_id: 'blah', ranking: [...election.options, undefined] }];
            const newRankings19 = [{ voter_id: 'blah', ranking: [...election.options, null] }];
            const newRankings20 = [{ voter_id: 'blah', ranking: [...election.options, 1] }];
            const newRankings21 = [{ voter_id: 'blah', ranking: [...election.options, ...election.options] }];
            const newRankings22 = [{ voter_id: 'blah', ranking: [...election.options, election.options[0]] }];
            const newRankings23 = [
                { voter_id: 'blah', ranking: election.options },
                { voter_id: 'blah', ranking: election.options }
            ];
            const newRankings24 = [{ voter_id: '', ranking: election.options }];

            /* eslint-disable @typescript-eslint/ban-ts-ignore */
            expect(Backend.replaceRankings({
                electionId: election.election_id,
                // @ts-ignore
                rankings: newRankings1
            })).toReject();

            expect(Backend.replaceRankings({
                electionId: election.election_id,
                // @ts-ignore
                rankings: newRankings2
            })).toReject();

            expect(Backend.replaceRankings({
                electionId: election.election_id,
                // @ts-ignore
                rankings: newRankings3
            })).toReject();

            expect(Backend.replaceRankings({
                electionId: election.election_id,
                // @ts-ignore
                rankings: newRankings4
            })).toReject();

            expect(Backend.replaceRankings({
                electionId: election.election_id,
                // @ts-ignore
                rankings: newRankings5
            })).toReject();

            expect(Backend.replaceRankings({
                electionId: election.election_id,
                // @ts-ignore
                rankings: newRankings6
            })).toReject();

            expect(Backend.replaceRankings({
                electionId: election.election_id,
                // @ts-ignore
                rankings: newRankings7
            })).toReject();

            expect(Backend.replaceRankings({
                electionId: election.election_id,
                // @ts-ignore
                rankings: newRankings8
            })).toReject();

            expect(Backend.replaceRankings({
                electionId: election.election_id,
                // @ts-ignore
                rankings: newRankings9
            })).toReject();

            expect(Backend.replaceRankings({
                electionId: election.election_id,
                // @ts-ignore
                rankings: newRankings10
            })).toReject();

            expect(Backend.replaceRankings({
                electionId: election.election_id,
                // @ts-ignore
                rankings: newRankings11
            })).toReject();

            expect(Backend.replaceRankings({
                electionId: election.election_id,
                // @ts-ignore
                rankings: newRankings12
            })).toReject();

            expect(Backend.replaceRankings({
                electionId: election.election_id,
                // @ts-ignore
                rankings: newRankings13
            })).toReject();

            expect(Backend.replaceRankings({
                electionId: election.election_id,
                // @ts-ignore
                rankings: newRankings14
            })).toReject();

            expect(Backend.replaceRankings({
                electionId: election.election_id,
                // @ts-ignore
                rankings: newRankings15
            })).toReject();

            expect(Backend.replaceRankings({
                electionId: election.election_id,
                // @ts-ignore
                rankings: newRankings16
            })).toReject();

            expect(Backend.replaceRankings({
                electionId: election.election_id,
                // @ts-ignore
                rankings: newRankings17
            })).toReject();

            expect(Backend.replaceRankings({
                electionId: election.election_id,
                // @ts-ignore
                rankings: newRankings18
            })).toReject();

            expect(Backend.replaceRankings({
                electionId: election.election_id,
                // @ts-ignore
                rankings: newRankings19
            })).toReject();

            expect(Backend.replaceRankings({
                electionId: election.election_id,
                // @ts-ignore
                rankings: newRankings20
            })).toReject();

            expect(Backend.replaceRankings({
                electionId: election.election_id,
                // @ts-ignore
                rankings: newRankings21
            })).toReject();

            expect(Backend.replaceRankings({
                electionId: election.election_id,
                // @ts-ignore
                rankings: newRankings22
            })).toReject();

            expect(Backend.replaceRankings({
                electionId: election.election_id,
                // @ts-ignore
                rankings: newRankings23
            })).toReject();

            expect(Backend.replaceRankings({
                electionId: election.election_id,
                // @ts-ignore
                rankings: newRankings24
            })).toReject();
            /* eslint-enable @typescript-eslint/ban-ts-ignore */
        });
    });

    describe('::addToRequestLog', () => {
        it('adds request to log as expected', async () => {
            const req1 = {
                headers: { 'x-forwarded-for': '9.9.9.9' },
                method: 'POST',
                url: '/api/route/path1'
            } as unknown as NextApiRequest;

            const req2 = {
                headers: {
                    'x-forwarded-for': '8.8.8.8',
                    'key': Backend.NULL_KEY
                },
                method: 'GET',
                url: '/api/route/path2'
            } as unknown as NextApiRequest;

            const res1 = { statusCode: 1111 } as NextApiResponse;
            const res2 = { statusCode: 2222 } as NextApiResponse;

            const now = Date.now();
            const _now = Date.now;
            Date.now = () => now;

            await Backend.addToRequestLog({ req: req1, res: res1 });
            await Backend.addToRequestLog({ req: req2, res: res2 });

            Date.now = _now;

            const reqlog = (await getDb()).collection<WithId<RequestLogEntry>>('request-log');

            const { _id: ignored1, ...log1 } = await reqlog.findOne({ resStatusCode: 1111 }) || {};
            const { _id: ignored2, ...log2 } = await reqlog.findOne({ resStatusCode: 2222 }) || {};

            expect(log1).toEqual({
                ip: '9.9.9.9',
                key: null,
                route: 'route/path1',
                method: 'POST',
                time: now,
                resStatusCode: 1111,
            });

            expect(log2).toEqual({
                ip: '8.8.8.8',
                key: Backend.NULL_KEY,
                route: 'route/path2',
                method: 'GET',
                time: now,
                resStatusCode: 2222
            });
        });
    });

    describe('::isRateLimited', () => {
        it('returns true if ip or key are rate limited', async () => {
            const req1 = {
                headers: { 'x-forwarded-for': '1.2.3.4' },
                method: 'POST',
                url: '/api/route/path1'
            } as unknown as NextApiRequest;

            const req2 = {
                headers: {
                    'x-forwarded-for': '8.8.8.8',
                    'key': Backend.NULL_KEY
                },
                method: 'GET',
                url: '/api/route/path2'
            } as unknown as NextApiRequest;

            const req3 = {
                headers: {
                    'x-forwarded-for': '1.2.3.4',
                    'key': 'fake-key'
                },
                method: 'POST',
                url: '/api/route/path1'
            } as unknown as NextApiRequest;

            const req4 = {
                headers: {
                    'x-forwarded-for': '5.6.7.8',
                },
                method: 'POST',
                url: '/api/route/path1'
            } as unknown as NextApiRequest;

            expect(await Backend.isRateLimited(req1)).toEqual(true);
            expect(await Backend.isRateLimited(req2)).toEqual(true);
            expect(await Backend.isRateLimited(req3)).toEqual(true);
            expect(await Backend.isRateLimited(req4)).toEqual(true);
        });

        it('returns false iff both ip and key (if provided) are not rate limited', async () => {
            const req1 = {
                headers: { 'x-forwarded-for': '1.2.3.5' },
                method: 'POST',
                url: '/api/route/path1'
            } as unknown as NextApiRequest;

            const req2 = {
                headers: {
                    'x-forwarded-for': '8.8.8.8',
                    'key': 'fake-key'
                },
                method: 'GET',
                url: '/api/route/path2'
            } as unknown as NextApiRequest;

            expect(await Backend.isRateLimited(req1)).toEqual(false);
            expect(await Backend.isRateLimited(req2)).toEqual(false);
        });

        it('returns false if "until" time has passed', async () => {
            const req = {
                headers: { 'x-forwarded-for': '1.2.3.4' },
                method: 'POST',
                url: '/api/route/path1'
            } as unknown as NextApiRequest;

            expect(await Backend.isRateLimited(req)).toEqual(true);

            await (await getDb()).collection<LimitedLogEntry>('limited-log-mview').updateOne(
                { ip: '1.2.3.4' },
                { $set: { until: Date.now() - 10**5 }}
            );

            expect(await Backend.isRateLimited(req)).toEqual(false);
        });
    });

    describe('::isDueForContrivedError', () => {
        it('returns true after REQUESTS_PER_CONTRIVED_ERROR invocations', async () => {
            const rate = getEnv().REQUESTS_PER_CONTRIVED_ERROR;

            expect([...Array(rate * 2)].map(() => Backend.isDueForContrivedError())).toEqual([
                ...[...Array(rate - 1)].map(() => false),
                true,
                ...[...Array(rate - 1)].map(() => false),
                true
            ]);
        });
    });
});

