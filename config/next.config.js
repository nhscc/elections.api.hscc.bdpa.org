/* @flow */

import withBundleAnalyzer from '@next/bundle-analyzer'
import DotenvWebpackPlugin from 'dotenv-webpack'
import { populateEnv } from './src/dev-utils'

populateEnv();

const paths = {
    universe: `${__dirname}/src/`,
    multiverse: `${__dirname}/lib/`,
};

module.exports = (/* phase: string, { defaultConfig }: Object */) => {
    return withBundleAnalyzer({
        enabled: process.env.ANALYZE === 'true'
    })({
        // ? Renames the build dir "build" instead of ".next"
        distDir: 'build',

        // ? Webpack configuration
        // ! Note that the webpack configuration is executed twice: once
        // ! server-side and once client-side!
        webpack: (config: Object, { isServer }: Object) => {
            // ? These are aliases that can be used during JS import calls
            // ! Note that you must also change these same aliases in .flowconfig
            // ! Note that you must also change these same aliases in package.json (jest)
            config.resolve.alias = Object.assign({}, config.resolve.alias, {
                universe: paths.universe,
                multiverse: paths.multiverse,
            });

            if(isServer) {
                // ? Add referenced environment variables defined in .env to bundle
                config.plugins.push(new DotenvWebpackPlugin());
            }

            return config;
        }
    });
};
