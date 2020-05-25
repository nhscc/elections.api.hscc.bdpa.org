import { isNumber } from 'util'
import { parse as parseAsBytes } from 'bytes'
import isServer from 'multiverse/is-server-side'

export function getEnv(silent=false) {
    const env = {
        NODE_ENV: process.env.NODE_ENV || process.env.BABEL_ENV || process.env.APP_ENV || 'unknown',
        MONGODB_URI: (process.env.MONGODB_URI || '').toString(),
        MAX_LIMIT: parseInt(process.env.MAX_LIMIT ?? '-Infinity'),
        LIMIT_OVERRIDE: parseInt(process.env.LIMIT_OVERRIDE ?? '-Infinity'),
        DISABLE_RATE_LIMITS: !!process.env.DISABLE_RATE_LIMITS && process.env.DISABLE_RATE_LIMITS !== 'false',
        LOCKOUT_ALL_KEYS: !!process.env.LOCKOUT_ALL_KEYS && process.env.LOCKOUT_ALL_KEYS !== 'false',
        DISALLOW_WRITES: !!process.env.DISALLOW_WRITES && process.env.DISALLOW_WRITES !== 'false',
        REQUESTS_PER_CONTRIVED_ERROR: parseInt(process.env.REQUESTS_PER_CONTRIVED_ERROR ?? '-Infinity'),
        MAX_OPTIONS_PER_ELECTION: parseInt(process.env.MAX_OPTIONS_PER_ELECTION || '-Infinity'),
        MAX_RANKINGS_PER_ELECTION: parseInt(process.env.MAX_RANKINGS_PER_ELECTION || '-Infinity'),
        MAX_CONTENT_LENGTH_BYTES: parseAsBytes(process.env.MAX_CONTENT_LENGTH_BYTES || '-Infinity'),
    };

    const _mustBeGtZero = [
        env.MAX_LIMIT,
        env.LIMIT_OVERRIDE,
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
    // env.LIMIT_OVERRIDE: ${env.LIMIT_OVERRIDE}
    // env.DISABLE_RATE_LIMITS: ${env.DISABLE_RATE_LIMITS}
    // env.LOCKOUT_ALL_KEYS: ${env.LOCKOUT_ALL_KEYS}
    // env.DISALLOW_WRITES: ${env.DISALLOW_WRITES}
    // env.REQUESTS_PER_CONTRIVED_ERROR: ${env.REQUESTS_PER_CONTRIVED_ERROR}
    // env.MAX_OPTIONS_PER_ELECTION: ${env.MAX_OPTIONS_PER_ELECTION}
    // env.MAX_RANKINGS_PER_ELECTION: ${env.MAX_RANKINGS_PER_ELECTION}
    // env.MAX_CONTENT_LENGTH_BYTES: ${env.MAX_CONTENT_LENGTH_BYTES}
    // ---`);
        /* eslint-enable no-console */
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    if(env.NODE_ENV == 'unknown' || (isServer() && env.MONGODB_URI === '') ||
       _mustBeGtZero.some(v => !isNumber(v) || v < 0)) {
        throw new Error('illegal environment detected, check environment variables');
    }

    return env;
}
