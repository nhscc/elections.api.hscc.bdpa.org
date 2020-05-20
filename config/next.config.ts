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
        webpack: (config: Configuration, { isServer }: { isServer: boolean }) => {
            // ? These are aliases that can be used during JS import calls
            // ! Note that you must also change these same aliases in tsconfig.json
            // ! Note that you must also change these same aliases in package.json (jest)
            config.resolve && (config.resolve.alias = {
                ...config.resolve.alias,
                universe: paths.universe,
                multiverse: paths.multiverse,
            });

            if(isServer) {
                // ? Add referenced environment variables defined in .env to bundle
                config.plugins && config.plugins.push(new DotenvWebpackPlugin());
            }

            return config;
        }
    });
};
