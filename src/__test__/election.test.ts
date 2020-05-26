import { setupJest } from 'universe/__test__/db'

setupJest();

describe('api/v1/election', () => {
    describe('::handleEndpoint', () => {
        test.todo('need to test that endpoint returns data as expected, no unauth, handles voters endpoint too, validates data on POST, error if election DNE, errors when expected, disallows too big, public vs private data, rate limits, adjustable error rate, logging db is working, etc');
    });
    //MAX_CONTENT_LENGTH_BYTES REQUESTS_PER_CONTRIVED_ERROR DISALLOW_WRITES LOCKOUT_ALL_KEYS DISABLE_RATE_LIMITS
});
