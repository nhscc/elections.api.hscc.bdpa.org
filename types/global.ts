import type { HttpJsonResponse5xx } from './_shared'
import type { ObjectId } from 'mongodb'

// ? Access types shared between projects from `types/global` too
export * from './_shared';

// * Project-specific Types * \\

export type Option = string;

export type PrimitiveElection = {
    title: string;
    description: string;
    options: Option[];
    created: number;
    opens: number;
    closes: number;
    deleted: boolean;
};

export type NewElection = {
    title: string;
    description?: string;
    options?: Option[];
    opens: number;
    closes: number;
};

export type PatchElection = {
    _id: ObjectId;
    title?: string;
    description?: string;
    options?: Option[];
    opens?: number;
    closes?: number;
    deleted?: boolean;
};

export type InternalElection = PrimitiveElection & {
    _id: ObjectId;
    owner: string;
};

export type PublicElection = PrimitiveElection & {
    election_id: ObjectId;
    owned: boolean;
};

export type ApiKey = {
    owner: string;
    key: string;
}

export type VoterRanking = {
    voter_id: string;
    ranking: Option[];
};

export type VoterRankings = VoterRanking[];

export type ElectionRankings = {
    election_id: ObjectId;
    rankings: VoterRankings;
};

export type RequestLogEntry = {
    _id: ObjectId;
    ip: string;
    key: string | null;
    route: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    time: number;
    response: number;
};

export type LimitedEntry = {
    _id: ObjectId;
    until: number;
    ip?: string;
    key?: string;
};

export type Metadata = {
    upcomingElections: number;
    openElections: number;
    closedElections: number;
};

export type HTTP555 = HttpJsonResponse5xx & { contrived: true };
