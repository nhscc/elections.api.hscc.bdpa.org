// * Every now and then, take best practices from CRA
// * https://tinyurl.com/yakv4ggx

const sourceMapPlugin = 'babel-plugin-source-map-support';
const sourceMapValue = 'inline';

// ! This is pretty aggressive. It targets modern browsers only.
// ? For some projects, less aggressive targets will make much more
// ? sense!
const targets = 'Chrome >= 60, Safari >= 10.1, iOS >= 10.3, Firefox >= 54, Edge >= 15';
// ? Something like the following might be more appropriate:
//const targets = '>1% in US and not ie 11';

// ? Next.js-specific Babel settings
const nextBabelPreset = ['next/babel', {
    'preset-env': {
        targets: targets,

        // ? If users import all core-js they're probably not concerned with
        // ? bundle size. We shouldn't rely on magic to try and shrink it.
        useBuiltIns: false,

        // ? Do not transform modules to CJS
        // ! MUST BE FALSE (see: https://nextjs.org/docs/#customizing-babel-config)
        modules: false,

        // ? Exclude transforms that make all code slower
        exclude: ['transform-typeof-symbol'],
    },
    'class-properties': {
        // ? Justification: https://github.com/facebook/create-react-app/issues/4263
        loose: true
    }
}];

module.exports = {
    parserOpts: { strictMode: true },
    plugins: [
        '@babel/plugin-proposal-export-default-from',
        '@babel/plugin-proposal-numeric-separator',
        '@babel/plugin-proposal-throw-expressions',
        '@babel/plugin-proposal-class-properties',
        '@babel/plugin-proposal-nullish-coalescing-operator',
        '@babel/plugin-proposal-json-strings',
        // * https://babeljs.io/blog/2018/09/17/decorators
        ['@babel/plugin-proposal-decorators', { legacy: true }],
        '@babel/plugin-proposal-function-bind',
        '@babel/plugin-proposal-optional-chaining',
        '@babel/plugin-transform-typescript',
    ],
    presets: [
        ['@babel/typescript', {
            allowDeclareFields: true
        }]
    ],
    // ? Sub-keys under the "env" config key will augment the above
    // ? configuration depending on the value of NODE_ENV and friends. Default
    // ? is: development
    env: {
        production: {
            // ? Handled by Next.js and Webpack
            /* sourceMaps: sourceMapValue,
            plugins: [sourceMapPlugin], */
            presets: [nextBabelPreset]
        },
        test: {
            sourceMaps: sourceMapValue,
            plugins: [sourceMapPlugin],
            presets: [
                ['@babel/preset-env', { targets: targets }]
            ]
        },
        development: {
            // ? Handled by Next.js and Webpack
            /* sourceMaps: sourceMapValue,
            plugins: [sourceMapPlugin], */
            presets: [nextBabelPreset]
        },
        generator: {
            sourceMaps: sourceMapValue,
            plugins: [sourceMapPlugin],
            comments: false,
            presets: [
                ['@babel/preset-env', {
                    targets: {
                        node: true
                    }
                }]
            ]
        }
    }
};

// ? The "debug" environment copies the "development" environment
module.exports.env.debug = Object.assign({}, module.exports.env.development);
