import withBundleAnalyzer from '@next/bundle-analyzer'

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
            IGNORE_RATE_LIMITS: process.env.IGNORE_RATE_LIMITS,
            LOCKOUT_ALL_KEYS: process.env.LOCKOUT_ALL_KEYS,
            DISALLOWED_METHODS: process.env.DISALLOWED_METHODS,
            REQUESTS_PER_CONTRIVED_ERROR: process.env.REQUESTS_PER_CONTRIVED_ERROR,
            MAX_OPTIONS_PER_ELECTION: process.env.MAX_OPTIONS_PER_ELECTION,
            MAX_RANKINGS_PER_ELECTION: process.env.MAX_RANKINGS_PER_ELECTION,
            MAX_CONTENT_LENGTH_BYTES: process.env.MAX_CONTENT_LENGTH_BYTES,
        },

        // TODO: move these out of experimental when they're not experimental
        // TODO: anymore!
        experimental: {
            async rewrites() {
                return [
                    {
                        source: '/api/?',
                        destination: '/404',
                    },
                    {
                        source: '/api/v1/?',
                        destination: '/404',
                    },
                    {
                        source: '/api/v1/election/?',
                        destination: '/404',
                    },
                    {
                        source: '/api/v2/?',
                        destination: '/404',
                    },
                    {
                        source: '/v1/meta',
                        destination: '/api/v1/meta'
                    },
                    {
                        source: '/v1/elections',
                        destination: '/api/v1/elections'
                    },
                    {
                        source: '/v1/election/:id',
                        destination: '/api/v1/election/:id'
                    },
                    {
                        source: '/v1/election/:id/voters',
                        destination: '/api/v1/election/:id/voters'
                    }
                ];
            }
        }
    });
};
