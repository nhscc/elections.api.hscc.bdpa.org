import { Db } from 'mongodb'
import { produce as mutate } from 'immer'
import * as Time from 'multiverse/relative-random-time'
import { initialize as originalInitialize, hydrate, NULL_KEY } from 'universe/initialize-db'

import type { InitialData } from 'universe/initialize-db'
import type { Immutable } from 'immer'
import type { GenericObject, InternalElection } from 'types/global'

const o = (ob: GenericObject, fn: (obj: InternalElection) => void): InternalElection => {
    const election = ob as InternalElection;
    fn(election);
    return election;
};

export const initialData: Immutable<InitialData> = mutate({}, () => ({
    meta: {
        upcomingElections: 1,
        openElections: 2,
        closedElections: 3,
    },
    keys: [
        {
            owner: 'chapter1',
            key: 'a0a49b61-83a7-4036-b060-213784b4997c'
        },
        {
            owner: 'chapter2',
            key: '5db4c4d3-294a-4086-9751-f3fce82d11e4'
        },
    ],
    elections: [
        o({
            title: 'My election #1',
            description: 'My demo election!',
            options: [ 'Vanilla', 'Chocolate', 'Strawberry' ],
            owner: NULL_KEY,
            deleted: false
        }, (o) => {
            o.created = Time.farPast();
            o.opens = Time.farPast({ after: o.created });
            o.closes = Time.farPast({ after: o.opens });
        }),
        o({
            title: 'My election #2',
            description: 'My demo election!',
            options: [ 'Vanilla', 'Chocolate', 'Strawberry' ],
            owner: NULL_KEY,
            deleted: true
        }, (o) => {
            o.created = Time.farFuture();
            o.opens = Time.farFuture({ after: o.created });
            o.closes = Time.farFuture({ after: o.opens });
        }),
        o({
            title: 'My election #3',
            description: 'My demo election!',
            options: [ 'Red', 'Green', 'Blue', 'Yellow' ],
            owner: 'a0a49b61-83a7-4036-b060-213784b4997c',
            deleted: false
        }, (o) => {
            o.created = Time.farPast();
            o.opens = Time.nearFuture();
            o.closes = Time.farFuture();
        }),
        o({
            title: 'My election #4',
            description: 'My demo election!',
            options: [ 'Chalk', 'Dye', 'Egg', 'Foam', 'Grease', 'Hand' ],
            owner: 'a0a49b61-83a7-4036-b060-213784b4997c',
            deleted: false
        }, (o) => {
            o.created = Time.nearFuture();
            o.opens = Time.nearFuture({ after: o.created });
            o.closes = Time.nearFuture({ after: o.opens });
        }),
        o({
            title: 'My election #5',
            description: 'My demo election!',
            options: [ 'Walking Dead', 'Red Dead', 'Dead Eye' ],
            owner: '5db4c4d3-294a-4086-9751-f3fce82d11e4',
            deleted: false
        }, (o) => {
            o.created = Time.nearPast();
            o.opens = Time.nearPast({ after: o.created });
            o.closes = Time.nearPast({ after: o.opens });
        }),
        o({
            title: 'My election #6',
            description: 'My demo election again!',
            options: [ 'Red', 'Green', 'Blue', 'Yellow', 'Orange', 'Purple' ],
            owner: '5db4c4d3-294a-4086-9751-f3fce82d11e4',
            deleted: false
        }, (o) => {
            o.created = Time.nearPast();
            o.opens = Time.nearPast({ after: o.created });
            o.closes = Time.nearFuture();
        }),
        o({
            title: 'My election #7',
            description: 'Best election bigly!',
            options: [ 'Bigly', 'Bigliest', 'Winning', 'Orange', 'Hair', 'Insane' ],
            owner: '5db4c4d3-294a-4086-9751-f3fce82d11e4',
            deleted: false
        }, (o) => {
            o.created = Time.nearPast();
            o.opens = Time.nearPast({ after: o.created });
            o.closes = Time.farFuture();
        }),
    ]
}));

export async function initialize(db: Db): Promise<void> {
    await originalInitialize(db, { reinitialize: true });
    await hydrate(db, initialData);
}
