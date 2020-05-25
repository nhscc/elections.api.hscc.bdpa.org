import { setupJest } from './db'

const { getDb } = setupJest();

describe('universe/backend/middleware', () => {
    describe('::handleEndpoint', () => {
        test.todo('need to test that middleware enforces: authentication, rate limiting, contrived error rate, bad method, rejecting requests that are too big');
    });
});
