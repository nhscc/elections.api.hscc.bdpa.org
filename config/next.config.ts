import withBundleAnalyzer from '@next/bundle-analyzer'
import DotenvWebpackPlugin from 'dotenv-webpack'

import type { Configuration } from 'webpack'

// ? Not using ES6/TS import syntax here because dev-utils has special
// ? circumstances
// eslint-disable-next-line import/no-unresolved, @typescript-eslint/no-var-requires
require('./src/dev-utils').populateEnv();

const paths = {
    universe: `${__dirname}/src/`,
    multiverse: `${__dirname}/lib/`,
};

module.exports = (): object => {
    return withBundleAnalyzer({
        enabled: process.env.ANALYZE === 'true'
    })({
        // ? Renames the build dir "build" instead of ".next"
        distDir: 'build',

        // ? Webpack configuration
        // ! Note that the webpack configuration is executed twice: once
        // ! server-side and once client-side!
        webpack: (config: Configuration) => {
            // ? These are aliases that can be used during JS import calls
            // ! Note that you must also change these same aliases in tsconfig.json
            // ! Note that you must also change these same aliases in package.json (jest)
            config.resolve && (config.resolve.alias = {
                ...config.resolve.alias,
                universe: paths.universe,
                multiverse: paths.multiverse,
            });

            return config;
        },

        // ? Select some environment variables defined in .env to push to the
        // ? client.
        // !! DO NOT PUT ANY SECRET ENVIRONMENT VARIABLES HERE !!
        env: {
            MAX_LIMIT: process.env.MAX_LIMIT,
            LIMIT_OVERRIDE: process.env.LIMIT_OVERRIDE,
            DISABLE_RATE_LIMITS: process.env.DISABLE_RATE_LIMITS,
            LOCKOUT_ALL_KEYS: process.env.LOCKOUT_ALL_KEYS,
            DISALLOW_WRITES: process.env.DISALLOW_WRITES,
            REQUESTS_PER_CONTRIVED_ERROR: process.env.REQUESTS_PER_CONTRIVED_ERROR,
            MAX_OPTIONS_PER_ELECTION: process.env.MAX_OPTIONS_PER_ELECTION,
            MAX_RANKINGS_PER_ELECTION: process.env.MAX_RANKINGS_PER_ELECTION,
            MAX_CONTENT_LENGTH_BYTES: process.env.MAX_CONTENT_LENGTH_BYTES,
        }
    });
};
