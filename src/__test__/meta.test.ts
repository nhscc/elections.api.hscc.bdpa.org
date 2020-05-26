import { setupJest } from 'universe/__test__/db'

setupJest();

describe('api/v1/meta', () => {
    describe('::handleEndpoint', () => {
        test.todo('need to test that endpoint returns data as expected, no unauth, errors when expected, disallows too big, rate limits, adjustable error rate, logging db is working, etc');
        //MAX_CONTENT_LENGTH_BYTES REQUESTS_PER_CONTRIVED_ERROR DISALLOW_WRITES LOCKOUT_ALL_KEYS DISABLE_RATE_LIMITS
    });
});
