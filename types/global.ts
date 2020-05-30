import type { HttpJsonResponse5xx } from './_shared'
import type { ObjectId, WithId } from 'mongodb'

// ? Access types shared between projects from `types/global` too
export * from './_shared';

// * Project-specific Types * \\

export type PrimitiveElection = {
    election_id: ObjectId;
    title: string;
    description: string;
    options: string[];
    created: number;
    opens: number;
    closes: number;
    deleted: boolean;
};

export type NewElection = {
    title: string;
    description?: string;
    options?: string[];
    opens: number;
    closes: number;
};

export type PatchElection = {
    title?: string;
    description?: string;
    options?: string[];
    opens?: number;
    closes?: number;
    deleted?: boolean;
};

export type InternalElection = PrimitiveElection & { owner: string };
export type PublicElection = PrimitiveElection & { owned: boolean };

// TODO: document the differences between election types
export type InDbElection = WithId<Omit<InternalElection, 'election_id'>>;

export type ApiKey = {
    owner: string;
    key: string;
}

export type VoterRanking = {
    voter_id: string;
    ranking: string[];
};

export type ElectionRankings = {
    election_id: ObjectId;
    rankings: VoterRanking[];
};

export type RequestLogEntry = {
    ip: string | null;
    key: string | null;
    route: string | null;
    method: string | null;
    resStatusCode: number;
    time: number;
};

export type LimitedLogEntry = {
    until: number;
    ip: string | null;
    key: string | null;
};

export type Metadata = {
    upcomingElections: number;
    openElections: number;
    closedElections: number;
};

export type HTTP555 = HttpJsonResponse5xx & { contrived: true };
