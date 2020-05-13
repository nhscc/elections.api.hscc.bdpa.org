/* @flow */

import withBundleAnalyzer from '@next/bundle-analyzer'
import DotenvWebpackPlugin from 'dotenv-webpack'
import { populateEnv } from './src/dev-utils'

populateEnv();

const {
    BUNDLE_ANALYZE
} = process.env;

const paths = {
    universe: `${__dirname}/src/`,
    multiverse: `${__dirname}/lib/`,
};

module.exports = (/* phase: string, { defaultConfig }: Object */) => {
    return withBundleAnalyzer({
        // ? Renames the build dir "build" instead of ".next"
        distDir: 'build',

        // ? Selectively enables bundle analysis. See dist.env or README for details
        analyzeServer: ['server', 'both'].includes(BUNDLE_ANALYZE),
        analyzeBrowser: ['browser', 'both'].includes(BUNDLE_ANALYZE),
        bundleAnalyzerConfig: {
            server: {
                analyzerMode: 'static',
                reportFilename: 'bundle-analysis-server.html'
            },
            browser: {
                analyzerMode: 'static',
                reportFilename: 'bundle-analysis-client.html'
            }
        },

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
