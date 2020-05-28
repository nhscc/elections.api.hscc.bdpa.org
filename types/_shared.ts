// * These are global types shared and reused freely between many projects
// TODO: make this into @ergodark/types private? namespaced package

import type { NextApiRequest, NextApiResponse } from 'next'


// TODO: jsdoc comment/document all of this stuff like the below:
/**
 * @desc Type representing
 * [`Primitive`](https://developer.mozilla.org/en-US/docs/Glossary/Primitive)
 * types.
 *
 * @example
 *   type Various = number | string | object;
 *
 *   /// Expect: object
 *   type Cleaned = Exclude<Various, Primitive>
 */
export type Primitive =
  | string
  | number
  | bigint
  | boolean
  | symbol
  | null
  | undefined;

/**
 * @desc Type representing falsy values.
 * @example
 *   type Various = 'a' | 'b' | undefined | false;
 *
 *   /// Expect: "a" | "b"
 *   Exclude<Various, Falsy>;
 */
export type Falsy = false | '' | 0 | null | undefined;

export type SuccessJsonResponse = { success: true };
export type ErrorJsonResponse = { error: string };

export type HttpJsonResponse2xx = SuccessJsonResponse;
export type HttpJsonResponse3xx = SuccessJsonResponse;
export type HttpJsonResponse4xx = ErrorJsonResponse;
export type HttpJsonResponse5xx = ErrorJsonResponse;

export type HttpJsonResponse429 = HttpJsonResponse4xx & { retryAfter: number };

export type HttpStatusCode =
      100 | 101 | 102

    | 200 | 201 | 202 | 203 | 204 | 205 | 206 | 207 | 208 | 226
    | 300 | 301 | 302 | 303 | 304 | 305 | 306 | 307 | 308

    | 400 | 401 | 402 | 403 | 404 | 405 | 406 | 407 | 408 | 409 | 410 | 411 | 412 | 413 | 414 | 415 | 416 | 417 | 418
    | 419 | 420 | 420 | 422 | 423 | 424 | 424 | 425 | 426 | 428 | 429 | 431 | 444 | 449 | 450 | 451 | 451 | 494 | 495
    | 496 | 497 | 499

    | 500 | 501 | 502 | 503 | 504 | 505 | 506 | 507 | 508 | 509 | 510 | 511 | 555 | 598 | 599;

export type NextParamsRR<T=object> = {
    req: NextApiRequest;
    res: NextApiResponse<T>;
};

export type NextParamsRRQ = NextParamsRR & { query: object };
