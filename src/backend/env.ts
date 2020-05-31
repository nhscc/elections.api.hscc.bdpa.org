import { isNumber, isUndefined as isU } from 'util'
import { parse as parseAsBytes } from 'bytes'
import isServer from 'multiverse/is-server-side'
import { DEFAULT_RESULT_LIMIT } from 'universe/backend'

export function getEnv(silent=false) {
    const env = {
        NODE_ENV: process.env.NODE_ENV || process.env.BABEL_ENV || process.env.APP_ENV || 'unknown',
        MONGODB_URI: (process.env.MONGODB_URI || '').toString(),
        MAX_LIMIT: parseInt(process.env.MAX_LIMIT ?? '-Infinity'),
        IGNORE_RATE_LIMITS: !!process.env.IGNORE_RATE_LIMITS && process.env.IGNORE_RATE_LIMITS !== 'false',
        LOCKOUT_ALL_KEYS: !!process.env.LOCKOUT_ALL_KEYS && process.env.LOCKOUT_ALL_KEYS !== 'false',
        DISALLOWED_METHODS: !!process.env.DISALLOWED_METHODS ? process.env.DISALLOWED_METHODS.split(',') : [],
        REQUESTS_PER_CONTRIVED_ERROR: parseInt(process.env.REQUESTS_PER_CONTRIVED_ERROR ?? '-Infinity'),
        MAX_OPTIONS_PER_ELECTION: parseInt(process.env.MAX_OPTIONS_PER_ELECTION || '-Infinity'),
        MAX_RANKINGS_PER_ELECTION: parseInt(process.env.MAX_RANKINGS_PER_ELECTION || '-Infinity'),
        MAX_CONTENT_LENGTH_BYTES: parseAsBytes(process.env.MAX_CONTENT_LENGTH_BYTES || '-Infinity'),
        HYDRATE_DB_ON_STARTUP: !isU(process.env.HYDRATE_DB_ON_STARTUP) && process.env.HYDRATE_DB_ON_STARTUP !== 'false',
    };

    const _mustBeGtZero = [
        env.MAX_LIMIT,
        env.REQUESTS_PER_CONTRIVED_ERROR,
        env.MAX_OPTIONS_PER_ELECTION,
        env.MAX_RANKINGS_PER_ELECTION,
        env.MAX_CONTENT_LENGTH_BYTES
    ];

    if(!silent && !isServer() && env.NODE_ENV == 'development') {
        /* eslint-disable no-console */
        console.warn('--- !APP INITIALIZED IN DEVELOPMENT MODE! ---');
    //     console.info(`---
    // NODE_ENV: ${NODE_ENV}
    // env.MONGODB_URI: ${env.MONGODB_URI}
    // env.MAX_LIMIT: ${env.MAX_LIMIT}
    // env.IGNORE_RATE_LIMITS: ${env.IGNORE_RATE_LIMITS}
    // env.LOCKOUT_ALL_KEYS: ${env.LOCKOUT_ALL_KEYS}
    // env.DISALLOWED_METHODS: ${env.DISALLOWED_METHODS}
    // env.REQUESTS_PER_CONTRIVED_ERROR: ${env.REQUESTS_PER_CONTRIVED_ERROR}
    // env.MAX_OPTIONS_PER_ELECTION: ${env.MAX_OPTIONS_PER_ELECTION}
    // env.MAX_RANKINGS_PER_ELECTION: ${env.MAX_RANKINGS_PER_ELECTION}
    // env.MAX_CONTENT_LENGTH_BYTES: ${env.MAX_CONTENT_LENGTH_BYTES}
    // env.HYDRATE_DB_ON_STARTUP: ${env.HYDRATE_DB_ON_STARTUP}
    // ---`);
        /* eslint-enable no-console */
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    if(env.NODE_ENV == 'unknown' || (isServer() && env.MONGODB_URI === '') ||
       _mustBeGtZero.some(v => !isNumber(v) || v < 0)) {
        throw new Error('illegal environment detected, check environment variables');
    }

    if(env.MAX_LIMIT < DEFAULT_RESULT_LIMIT)
        throw new Error('MAX_LIMIT must be >= DEFAULT_RESULT_LIMIT (got ${env.MAX_LIMIT} < ${DEFAULT_RESULT_LIMIT} instead)');

    return env;
}
