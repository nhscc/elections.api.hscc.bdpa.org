import type { NextApiRequest, NextApiResponse } from 'next'
import type { NextParamsRRWithSession } from 'multiverse/simple-auth-session'
import type { ObjectId } from 'mongodb'

export type GenericObject<T=unknown> = Record<string, T>;

export type HTTPStatusCode =
      100 | 101 | 102

    | 200 | 201 | 202 | 203 | 204 | 205 | 206 | 207 | 208 | 226
    | 300 | 301 | 302 | 303 | 304 | 305 | 306 | 307 | 308

    | 400 | 401 | 402 | 403 | 404 | 405 | 406 | 407 | 408 | 409 | 410 | 411 | 412 | 413 | 414 | 415 | 416 | 417 | 418
    | 419 | 420 | 420 | 422 | 423 | 424 | 424 | 425 | 426 | 428 | 429 | 431 | 444 | 449 | 450 | 451 | 451 | 494 | 495
    | 496 | 497 | 499

    | 500 | 501 | 502 | 503 | 504 | 505 | 506 | 507 | 508 | 509 | 510 | 511 | 598 | 599;

export type NextParamsResponseQuery<T = object> = {
    res: NextApiResponse<T>;
    query: object;
};

export type NextParamsResponseStatus<T = object> = {
    res: NextApiResponse<T>;
    status: HTTPStatusCode;
};

export type NextParamsRR<T = object> = {
    req: NextApiRequest;
    res: NextApiResponse<T>;
};

export type NextParamsRRQWithSession = NextParamsRRWithSession & { query: object };
export type NextParamsResponseStatusQuery = NextParamsResponseQuery & NextParamsResponseStatus;

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

export type InternalElection = PrimitiveElection & {
    _id: ObjectId;
    owner: string;
};

export type Election = PrimitiveElection & {
    election_id: ObjectId;
    owned: boolean;
};

export type Ranking = {
    voter_id: string;
    ranking: Option[];
};

export type Rankings = Ranking[];

export type ElectionRankings = {
    election_id: ObjectId;
    rankings: Rankings;
};

export type ErrorJSON = {
    error: string;
};

export type SuccessJSON = { success: true };
export type HTTP555 = ErrorJSON & { contrived: true };
export type HTTP429 = ErrorJSON & { retryAfter: number };
