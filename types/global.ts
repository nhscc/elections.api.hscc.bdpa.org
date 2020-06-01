import type { ObjectId, WithId } from 'mongodb'

// ? Access types shared between projects from `types/global` too
export * from './_shared';

/**
 * Base election type.
 */
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

/**
 * The shape of the request body when creating a new election.
 */
export type NewElection = {
    title: string;
    description?: string;
    options?: string[];
    opens: number;
    closes: number;
};

/**
 * The shape of the request body when modifying an election.
 */
export type PatchElection = {
    title?: string;
    description?: string;
    options?: string[];
    opens?: number;
    closes?: number;
    deleted?: boolean;
};

/**
 * The shape of an election in NextJS.
 */
export type InternalElection = PrimitiveElection & { owner: string };

/**
 * The shape of the response body when sending election data.
 */
export type PublicElection = PrimitiveElection & { owned: boolean };

/**
 * The shape of an election in MongoDB.
 */
export type InDbElection = WithId<Omit<InternalElection, 'election_id'>>;

/**
 * The shape of an API key.
 */
export type ApiKey = {
    owner: string;
    key: string;
}

/**
 * The shape of a single voter's rankings.
 */
export type VoterRanking = {
    voter_id: string;
    ranking: string[];
};

/**
 * The shape of a single election's voters and their rankings.
 */
export type ElectionRankings = {
    election_id: ObjectId;
    rankings: VoterRanking[];
};

/**
 * The shape of a request log entry.
 */
export type RequestLogEntry = {
    ip: string | null;
    key: string | null;
    route: string | null;
    method: string | null;
    resStatusCode: number;
    time: number;
};

/**
 * The shape of a limited log entry.
 */
export type LimitedLogEntry = {
    until: number;
    ip: string | null;
    key: string | null;
};

/**
 * The shape of system metadata.
 */
export type Metadata = {
    upcomingElections: number;
    openElections: number;
    closedElections: number;
};
