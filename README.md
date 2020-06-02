# BDPA Elections Public API

The live API used by solutions to the 2019 NHSCC problem statement. It was built
according to [JAMstack principles](https://jamstack.org/) using TypeScript
(JavaScript) and MongoDB. The production instance is hosted on
[Vercel](https://vercel.com) with [MongoDB
Atlas](https://www.mongodb.com/cloud/atlas). The code is highly documented. You
can clone this repo and run a fully functional version of this API locally
following the instructions below.

If you run into any issues or find any bugs, please [report
them](https://github.com/nhscc/elections.api.hscc.bdpa.org/issues/new)!

Root URI: https://elections.api.hscc.bdpa.org/v1  
Documentation and playground with examples: https://electionshscc.docs.apiary.io

## Running a local version of the API

This project is (mostly) self-contained. Everything you need to run the API
locally is in this repo except a running MongoDB instance.

> Note: this project has only been tested on Linux (Kubuntu). If you encounter
> any Windows-specific issues, please [report
> it](https://github.com/nhscc/elections.api.hscc.bdpa.org/issues/new).

1. Ensure the latest [NodeJS](https://nodejs.org/en/) and
   [MongoDB](https://docs.mongodb.com/manual/installation/) are installed and
   set up
2. Clone this repo
3. From the terminal, with the repo as the current working directory, run `npm
   install`
4. Copy the file `dist.env` to `.env` and add your MongoDB connect URI to the
   MONGODB_URI environment variable
4. If you want to quickly test the API, run `npm test`
5. To run the API in development mode, run `npm run dev`
6. Navigate to the URL returned by the previous command to interact with the API
   (using your browser, [Postman](https://www.postman.com/), or otherwise).

> Note: if you choose to run the API with NODE_ENV=production, the database will
> not be automatically setup nor hydrated. Better to run the API in development
> mode (the default).

## Available commands

To get a list of possible actions, run the following from your terminal:

```
$ npm run list-tasks
```

## Project structure

This API uses the following technologies:

- Node and NPM to run JavaScript locally
- TypeScript for producing typed JavaScript
- Babel for compiling (transpiling) TypeScript + ESNext syntax
- Gulp for running complex tasks
- Git for version control
- ESLint for TypeScript and JavaScript linting
- Webpack for tree-shaking and asset bundling
- JSX, React, and Next.JS for modern web development
- MongoDB Node driver for database access
- Jest for unit and integration testing

### Files and directories

`tsconfig` controls the TypeScript settings used when *type checking* the
project. Type checks are run once before the project is built during production
deployments, otherwise they must be run manually (inconvenient) or by your IDE.
If you're using vscode, you don't have to do anything it's all handled for
you.


`package.json` and `package-lock.json` are used by NPM to describe the
dependencies that will be automatically installed when calling `npm install`.

`next.config.js` and `gulpfile.js` are transpiled scripts and should generally
be ignored. You can find the real versions under the `config/` directory.
`config/gulpfile.ts` defines all the Gulp tasks that can be run.
`config/next.config.ts` returns a JSON object used to configure Next.js.

`dist.env` is the distributed environment file. It's meaningless on its own, but
when copied and renamed to `.env`, it will be used by the API to define certain
environment variables.

`next-env.d.ts` is a TypeScript types file. It's a special type of JavaScript
file that globally defines TypeScript types used by other files. The `types/`
folder serves a similar purpose.

`babel.config.js` returns a JSON object used to configure Babel.

`lib/` contains TypeScript modules shared between projects.

`src/` contains the source code of the application. `src/__test__` contains the
unit and integration tests for the API. `src/backend` contains business logic
and database access layer. `src/pages` contains React (JSX) TypeScript code
(`.tsx` files). `src/pages/api` contains the actual API endpoints. The
directories and files are named according to [Next.js dynamic
routing](https://nextjs.org/docs/routing/dynamic-routes).
