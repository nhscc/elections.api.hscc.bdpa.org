import { ObjectId } from 'mongodb';
import * as Backend from 'universe/backend'
import { setupJest, unhydratedDummyDbData } from 'universe/__test__/db'
import { getEnv } from 'universe/backend/env'
import { populateEnv } from 'universe/dev-utils'

import type{ NextApiRequest, NextApiResponse } from 'next';
import { InternalElection, NewElection, PatchElection, VoterRankings, PublicElection } from 'types/global'
import randomInt from 'random-int';

populateEnv();
jest.setTimeout(1000000);

const { getHydratedData, getDb } = setupJest();

const getExpectedMeta = () => {
    const expectedMeta = {
        upcomingElections: 0,
        openElections: 0,
        closedElections: 0
    };

    unhydratedDummyDbData.elections.forEach(election => {
        election.closes <= Date.now()
            ? expectedMeta.closedElections++
            : (election.opens > Date.now() ? expectedMeta.upcomingElections++ : expectedMeta.openElections++);
    });

    return expectedMeta;
}

describe('universe/backend', () => {
    describe('::getElectionMetadata', () => {
        it('returns expected metadata',
            async () => expect(await Backend.getElectionMetadata()).toEqual(getExpectedMeta()));
    });

    describe('::getPublicElections', () => {
        it('returns only public elections data', async () => {
            const elections = getHydratedData().elections;
            const index = randomInt(0, elections.length - 1);

            const {
                title,
                _id,
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
                after: elections[index - 1]?._id
            })).toArray()).toEqual<PublicElection[]>([{
                election_id: _id,
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
                const { _id, owner,...election } = e;

                return {
                    ...election,
                    election_id: _id,
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
                electionId: election._id,
                key: Backend.NULL_KEY
            })).toEqual<PublicElection>({
                election_id: election._id,
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

            expect(await Backend.getInternalElection(elections[0]._id)).toEqual(elections[0]);
            expect(await Backend.getInternalElection(elections[1]._id)).toEqual(elections[1]);
            expect(await Backend.getInternalElection(elections[5]._id)).toEqual(elections[5]);
            expect(await Backend.getInternalElection(elections[elections.length - 1]._id))
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
            expect(await Backend.doesElectionExist(elections[0]._id)).toEqual(true);
            expect(await Backend.doesElectionExist(elections[1]._id)).toEqual(true);
            expect(await Backend.doesElectionExist(elections[5]._id)).toEqual(true);
            expect(await Backend.doesElectionExist(elections[10]._id)).toEqual(true);
            expect(await Backend.doesElectionExist(elections[elections.length - 1]._id)).toEqual(true);
        });
    });

    describe('::upsertElection', () => {
        it('inserts a new election when election_id does not exist', async () => {
            const newElection = {
                title: 'New election',
                description: 'This is a new election',
                options: ['1', '2'],
                opens: Date.now() + 10**6,
                closes: Date.now() + 10**7
            };

            // ? Bad props should be ignored
            const badProps = {
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

            const election = await Backend.upsertElection({
                election: { ...newElection, ...badProps } as NewElection,
                key: Backend.NULL_KEY
            });

            const returnedElection = await Backend.getInternalElection(election._id || new ObjectId('bad'));
            expect(returnedElection._id).not.toEqual(badProps._id);
            expect(returnedElection.owner).toEqual(Backend.NULL_KEY);
            expect(returnedElection).toEqual(election);
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

            expect(Backend.upsertElection({ election: { ...newElection, opens: 100, closes: 200 }, key: Backend.NULL_KEY })).toReject();
            /* eslint-disable @typescript-eslint/ban-ts-ignore */
            // @ts-ignore
            expect(Backend.upsertElection({ election: { ...badElection, opens }, key: Backend.NULL_KEY })).toReject();
            // @ts-ignore
            expect(Backend.upsertElection({ election: { ...badElection, closes }, key: Backend.NULL_KEY })).toReject();
            /* eslint-enable @typescript-eslint/ban-ts-ignore */
            expect(Backend.upsertElection({ election: { ...badElection, closes: 100, opens }, key: Backend.NULL_KEY })).toReject();
            expect(Backend.upsertElection({ election: { ...badElection, opens: 100, closes }, key: Backend.NULL_KEY })).toReject();
            expect(Backend.upsertElection({ election: { ...badElection, opens: closes, closes: opens }, key: Backend.NULL_KEY })).toReject();
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

            expect(typeof election1._id === 'undefined').toBeFalse();

            const election2 = await Backend.upsertElection({
                electionId: election1._id,
                election: {
                    ...newElection,
                    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
                    // @ts-ignore
                    created: 100,
                    opens: newElection.opens + 200,
                    closes: newElection.closes + 300
                },
                key: Backend.NULL_KEY
            });

            expect(election1._id).toEqual(election2._id);
            expect(election1.opens).toEqual(newElection.opens);
            expect(election2.opens).toEqual(newElection.opens + 200);

            const returnedElection = await Backend.getInternalElection(election1._id || new ObjectId('bad'));

            expect(returnedElection._id).toEqual(election1._id);
            expect(returnedElection.created).toEqual(election1.created);
            // ? Bad props should be ignored!
            expect(returnedElection.created).not.toEqual(100);
            expect(returnedElection.opens).toEqual(newElection.opens + 200);
            expect(returnedElection.closes).toEqual(newElection.closes + 300);
        });

        it('rejects when missing necessary params', async () => {
            /* eslint-disable @typescript-eslint/ban-ts-ignore */
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
            const election_id = getHydratedData().elections[0]._id;

            expect(await Backend.doesElectionExist(election_id)).toEqual(true);

            await Backend.deleteElection(election_id);

            expect(await Backend.doesElectionExist(election_id)).toEqual(true);
            expect((await Backend.getInternalElection(election_id)).deleted).toEqual(true);
        });
    });

    describe('::replaceRankings and ::getRankings', () => {
        it("::replaceRankings replaces an election's rankings data, returned by ::getRankings", async () => {
            const election = getHydratedData().elections[0];
            const oldRankings = await Backend.getRankings(election._id);
            const newRankings = [{ voter_id: '1', ranking: election.options }];

            await Backend.replaceRankings({ electionId: election._id, rankings: newRankings });

            expect(oldRankings.length > 0).toEqual(true);
            expect(await Backend.getRankings(election._id)).toEqual(newRankings);

            await Backend.replaceRankings({ electionId: election._id, rankings: oldRankings });
            expect(await Backend.getRankings(election._id)).toEqual(oldRankings);

            await Backend.replaceRankings({ electionId: election._id, rankings: [] });
            expect(await Backend.getRankings(election._id)).toEqual([]);

            const newerRankings = [{ voter_id: '1', ranking: [] }, { voter_id: '2', ranking: [] }];

            await Backend.replaceRankings({ electionId: election._id, rankings: newerRankings });
            expect(await Backend.getRankings(election._id)).toEqual(newerRankings);

            const newestRankings = [...oldRankings.slice(1)];

            await Backend.replaceRankings({ electionId: election._id, rankings: newestRankings });
            expect(await Backend.getRankings(election._id)).toEqual(newestRankings);
        });

        it('::replaceRankings and ::getRankings rejects if election_id does not exist', async () => {
            expect(Backend.replaceRankings({ electionId: new ObjectId(), rankings: [] })).toReject();
            expect(Backend.getRankings(new ObjectId())).toReject();
        });

        it('::replaceRankings rejects on illegal options', async () => {
            /* eslint-disable @typescript-eslint/ban-ts-ignore */
            // @ts-ignore
            expect(Backend.replaceRankings({ electionId: getHydratedData().elections[0]._id, rankings: [1] })).toReject();
            // @ts-ignore
            expect(Backend.replaceRankings({ electionId: getHydratedData().elections[0]._id, rankings: [1, 2] })).toReject();
            // @ts-ignore
            expect(Backend.replaceRankings({ electionId: getHydratedData().elections[0]._id, rankings: [{}] })).toReject();
            // @ts-ignore
            expect(Backend.replaceRankings({ electionId: getHydratedData().elections[0]._id, rankings: [{}, {}] })).toReject();
            // @ts-ignore
            expect(Backend.replaceRankings({ electionId: getHydratedData().elections[0]._id, rankings: [{ a: 1 }, { b: 2 }] })).toReject();
            // @ts-ignore
            expect(Backend.replaceRankings({ electionId: getHydratedData().elections[0]._id, rankings: [{ voter_id: 1 }] })).toReject();
            // @ts-ignore
            expect(Backend.replaceRankings({ electionId: getHydratedData().elections[0]._id, rankings: [{ voter_id: '1' }] })).toReject();
            // @ts-ignore
            expect(Backend.replaceRankings({ electionId: getHydratedData().elections[0]._id, rankings: [{ voter_id: '1', ranking: [1] }] })).toReject();
            /* eslint-enable @typescript-eslint/ban-ts-ignore */
            expect(Backend.replaceRankings({ electionId: getHydratedData().elections[0]._id, rankings: [{ voter_id: '1', ranking: ['1'] }] })).toReject();
            expect(Backend.replaceRankings({ electionId: getHydratedData().elections[0]._id, rankings: [{ voter_id: '1', ranking: ['1', '2'] }] })).toReject();
        });
    });

    describe('::validateElectionData', () => {
        it('returns true on valid new elections', async () => {
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

            expect(await Backend.validateElectionData(newElection1)).toEqual(true);
            expect(await Backend.validateElectionData(newElection2)).toEqual(true);
        });

        it('returns true on valid election updates', async () => {
            const electionPatch1: PatchElection = { _id: new ObjectId() };
            const electionPatch2: PatchElection = {
                _id: new ObjectId(),
                title: 'New election',
                opens: Date.now() + 10**6,
                closes: Date.now() + 10**7,
            };

            const electionPatch3: PatchElection = {
                _id: new ObjectId(),
                options: [],
            };

            const electionPatch4: PatchElection = {
                _id: new ObjectId(),
                options: undefined,
            };

            expect(await Backend.validateElectionData(electionPatch1, { patch: true })).toEqual(true);
            expect(await Backend.validateElectionData(electionPatch2, { patch: true })).toEqual(true);
            expect(await Backend.validateElectionData(electionPatch3, { patch: true })).toEqual(true);
            expect(await Backend.validateElectionData(electionPatch4, { patch: true })).toEqual(true);
        });

        it('rejects for new elections when illegal keys provided or required keys missing', async () => {
            const newElection0 = {} as unknown as NewElection;

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
                created: 0,
                opens: Date.now() + 10**6,
                closes: Date.now() + 10**7
            } as unknown as NewElection;

            const newElection4b = {
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
                election_id: new ObjectId(),
                title: 'My new election!',
                opens: Date.now() + 10**6,
                closes: Date.now() + 10**7,
            } as unknown as NewElection;

            const newElection8 = {
                _id: new ObjectId(),
                title: 'My new election!',
                opens: Date.now() + 10**6,
                closes: Date.now() + 10**7,
            } as unknown as NewElection;

            const newElection9 = {
                title: 'My new election!',
                opens: Date.now() + 10**6,
                closes: Date.now() + 10**7,
                blahblahlblah: true,
            } as unknown as NewElection;

            expect(Backend.validateElectionData(newElection0)).toReject();
            expect(Backend.validateElectionData(newElection1)).toReject();
            expect(Backend.validateElectionData(newElection2)).toReject();
            expect(Backend.validateElectionData(newElection3)).toReject();
            expect(Backend.validateElectionData(newElection4)).toReject();
            expect(Backend.validateElectionData(newElection4b)).toReject();
            expect(Backend.validateElectionData(newElection5)).toReject();
            expect(Backend.validateElectionData(newElection6)).toReject();
            expect(Backend.validateElectionData(newElection7)).toReject();
            expect(Backend.validateElectionData(newElection8)).toReject();
            expect(Backend.validateElectionData(newElection9)).toReject();
        });

        it('rejects for updating elections when illegal keys provided', async () => {
            const patchElection1 = {} as unknown as PatchElection;

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

            expect(Backend.validateElectionData(patchElection1, { patch: true })).toReject();
            expect(Backend.validateElectionData(patchElection2, { patch: true })).toReject();
            expect(Backend.validateElectionData(patchElection3, { patch: true })).toReject();
            expect(Backend.validateElectionData(patchElection4, { patch: true })).toReject();
            expect(Backend.validateElectionData(patchElection5, { patch: true })).toReject();
            expect(Backend.validateElectionData(patchElection6, { patch: true })).toReject();
        });

        it('rejects on elections with options.length > MAX_OPTIONS_PER_ELECTION', async () => {
            const newElection: NewElection = {
                title: 'New election',
                description: 'This is a new election',
                options: [...Array(getEnv().MAX_OPTIONS_PER_ELECTION + 1)].map((_, ndx) => ndx.toString()),
                opens: Date.now() + 10**6,
                closes: Date.now() + 10**7,
            };

            expect(Backend.validateElectionData(newElection)).toReject();
            expect(Backend.validateElectionData(newElection, { patch: true })).toReject();
        });

        it('rejects when !(created <= opens <= closes)', async () => {
            const newElection1: NewElection = {
                title: 'New election',
                description: 'This is a new election',
                opens: 1,
                closes: 2,
            };

            const newElection2: NewElection = {
                title: 'New election',
                description: 'This is a new election',
                opens: Date.now(),
                closes: 2,
            };

            const newElection3: NewElection = {
                title: 'New election',
                description: 'This is a new election',
                opens: 1,
                closes: Date.now(),
            };

            expect(Backend.validateElectionData(newElection1)).toReject();
            expect(Backend.validateElectionData(newElection2)).toReject();
            expect(Backend.validateElectionData(newElection3)).toReject();
        });

        it('rejects if any of the values are the incorrect type (number/string)', async () => {
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

            expect(Backend.validateElectionData(newElection1)).toReject();
            expect(Backend.validateElectionData(newElection2)).toReject();
            expect(Backend.validateElectionData(newElection3)).toReject();
            expect(Backend.validateElectionData(newElection4)).toReject();
            expect(Backend.validateElectionData(newElection5)).toReject();
            expect(Backend.validateElectionData(newElection6)).toReject();
            expect(Backend.validateElectionData(newElection7)).toReject();
            expect(Backend.validateElectionData(newElection8)).toReject();
            expect(Backend.validateElectionData(newElection9)).toReject();
            expect(Backend.validateElectionData(newElection10)).toReject();

            expect(Backend.validateElectionData(newElection1, { patch: true })).toReject();
            expect(Backend.validateElectionData(newElection2, { patch: true })).toReject();
            expect(Backend.validateElectionData(newElection3, { patch: true })).toReject();
            expect(Backend.validateElectionData(newElection4, { patch: true })).toReject();
            expect(Backend.validateElectionData(newElection5, { patch: true })).toReject();
            expect(Backend.validateElectionData(newElection6, { patch: true })).toReject();
            expect(Backend.validateElectionData(newElection7, { patch: true })).toReject();
            expect(Backend.validateElectionData(newElection8, { patch: true })).toReject();
            expect(Backend.validateElectionData(newElection9, { patch: true })).toReject();
            expect(Backend.validateElectionData(newElection10, { patch: true })).toReject();
        });
    });

    describe('::validateRankingsData', () => {
        it('returns true on valid rankings and false on invalid rankings', async () => {
            const election = getHydratedData().elections[0];
            const newRankings1: VoterRankings = [];

            const newRankings2: VoterRankings = [
                { voter_id: 'my-userid1', ranking: election.options },
            ];

            const newRankings3: VoterRankings = [
                { voter_id: 'my-userid1', ranking: election.options },
                { voter_id: 'my-userid2', ranking: election.options },
                { voter_id: 'my-userid3', ranking: election.options },
            ];

            expect(Backend.validateRankingsData(election._id, null as unknown as VoterRankings)).toReject();
            expect(Backend.validateRankingsData(election._id, false as unknown as VoterRankings)).toReject();
            expect(Backend.validateRankingsData(election._id, newRankings1)).toBe(true);
            expect(Backend.validateRankingsData(election._id, newRankings2)).toBe(true);
            expect(Backend.validateRankingsData(election._id, newRankings3)).toBe(true);
        });

        it('rejects on rankings with length > MAX_RANKINGS_PER_ELECTION', async () => {
            const election = getHydratedData().elections[0];
            const newRankings = [...Array(getEnv().MAX_RANKINGS_PER_ELECTION + 1)].map((_, ndx) =>
                ({ voter_id: ndx.toString(), ranking: election.options }));

            expect(Backend.validateRankingsData(election._id, newRankings)).toReject();
        });

        it('rejects on rankings that include non-existent options for the election', async () => {
            expect(Backend.validateRankingsData(
                getHydratedData().elections[0]._id, [{ voter_id: '5', ranking: ['FAKE'] }]
            )).toReject();
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
            const newRankings24 = [{ voter_id: 'blah', ranking: election.options, extra: 'bad' }];

            expect(Backend.validateRankingsData(election._id, newRankings1)).toReject();
            expect(Backend.validateRankingsData(election._id, newRankings2)).toReject();
            expect(Backend.validateRankingsData(election._id, newRankings3)).toReject();
            expect(Backend.validateRankingsData(election._id, newRankings4)).toReject();
            expect(Backend.validateRankingsData(election._id, newRankings5)).toReject();
            expect(Backend.validateRankingsData(election._id, newRankings6)).toReject();
            expect(Backend.validateRankingsData(election._id, newRankings7)).toReject();
            expect(Backend.validateRankingsData(election._id, newRankings8)).toReject();
            expect(Backend.validateRankingsData(election._id, newRankings9)).toReject();
            expect(Backend.validateRankingsData(election._id, newRankings10)).toReject();
            expect(Backend.validateRankingsData(election._id, newRankings11)).toReject();
            expect(Backend.validateRankingsData(election._id, newRankings12)).toReject();
            expect(Backend.validateRankingsData(election._id, newRankings13)).toReject();
            expect(Backend.validateRankingsData(election._id, newRankings14)).toReject();
            expect(Backend.validateRankingsData(election._id, newRankings15)).toReject();
            expect(Backend.validateRankingsData(election._id, newRankings16)).toReject();
            expect(Backend.validateRankingsData(election._id, newRankings17)).toReject();
            expect(Backend.validateRankingsData(election._id, newRankings18)).toReject();
            expect(Backend.validateRankingsData(election._id, newRankings19)).toReject();
            expect(Backend.validateRankingsData(election._id, newRankings20)).toReject();
            expect(Backend.validateRankingsData(election._id, newRankings21)).toReject();
            expect(Backend.validateRankingsData(election._id, newRankings22)).toReject();
            expect(Backend.validateRankingsData(election._id, newRankings23)).toReject();
            expect(Backend.validateRankingsData(election._id, newRankings24)).toReject();
        });
    });

    describe('::addToRequestLog', () => {
        it('adds request to log as expected', async () => {
            const req1 = {
                headers: { 'x-forwarded-for': '9.9.9.9' },
                method: 'POST',
                url: 'http://fake.com/api/route/path1'
            } as unknown as NextApiRequest;

            const req2 = {
                headers: {
                    'x-forwarded-for': '8.8.8.8',
                    'key': Backend.NULL_KEY
                },
                method: 'GET',
                url: 'http://fake.com/api/route/path2'
            } as unknown as NextApiRequest;

            const res1 = { statusCode: 1111 } as NextApiResponse;
            const res2 = { statusCode: 2222 } as NextApiResponse;

            const now = Date.now();
            const _now = Date.now;
            Date.now = () => now;

            await Backend.addToRequestLog(req1, res1);
            await Backend.addToRequestLog(req2, res2);

            Date.now = _now;

            const reqlog = await (await getDb()).collection('request-log');

            expect(await reqlog.findOne({ statusCode: 1111 })).toEqual({
                ip: '9.9.9.9',
                route: '/api/route/path1',
                method: 'POST',
                time: now,
                response: 1111
            });

            expect(await reqlog.findOne({ statusCode: 2222 })).toEqual({
                ip: '8.8.8.8',
                key: Backend.NULL_KEY,
                route: '/api/route/path2',
                method: 'GET',
                time: now,
                response: 2222
            });
        });
    });

    describe('::isRateLimited', () => {
        it('returns true if ip or key are rate limited', async () => {
            const req1 = {
                headers: { 'x-forwarded-for': '1.2.3.4' },
                method: 'POST',
                url: 'http://fake.com/api/route/path1'
            } as unknown as NextApiRequest;

            const req2 = {
                headers: {
                    'x-forwarded-for': '8.8.8.8',
                    'key': Backend.NULL_KEY
                },
                method: 'GET',
                url: 'http://fake.com/api/route/path2'
            } as unknown as NextApiRequest;

            const req3 = {
                headers: {
                    'x-forwarded-for': '1.2.3.4',
                    'key': 'fake-key'
                },
                method: 'POST',
                url: 'http://fake.com/api/route/path1'
            } as unknown as NextApiRequest;

            expect(await Backend.isRateLimited(req1)).toEqual(true);
            expect(await Backend.isRateLimited(req2)).toEqual(true);
            expect(await Backend.isRateLimited(req3)).toEqual(true);
        });

        it('returns false iff both ip and key (if provided) are not rate limited', async () => {
            const req1 = {
                headers: { 'x-forwarded-for': '1.2.3.5' },
                method: 'POST',
                url: 'http://fake.com/api/route/path1'
            } as unknown as NextApiRequest;

            const req2 = {
                headers: {
                    'x-forwarded-for': '8.8.8.8',
                    'key': 'fake-key'
                },
                method: 'GET',
                url: 'http://fake.com/api/route/path2'
            } as unknown as NextApiRequest;

            expect(await Backend.isRateLimited(req1)).toEqual(false);
            expect(await Backend.isRateLimited(req2)).toEqual(false);
        });
    });

    describe('::isDueForContrivedError', () => {
        it('returns true after REQUESTS_PER_CONTRIVED_ERROR invocations', async () => {
            const rate = getEnv().REQUESTS_PER_CONTRIVED_ERROR;
            expect.assertions(rate);

            [...Array(rate)].forEach((_, i) =>
                expect(Backend.isDueForContrivedError()).toEqual(i == rate - 1 ? true : false));
        });
    });
});

