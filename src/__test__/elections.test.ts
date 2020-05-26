import { setupJest } from 'universe/__test__/db'

setupJest();

describe('api/v1/elections', () => {
    describe('::handleEndpoint', () => {
        test.todo('need to test that endpoint returns data as expected, no unauth, handles pagination properly, returns in LIFO order by default, works with query parameters, errors if query parameters are provided during POST, validates data on POST, errors when expected, limits larger than 50 (or w/e max is) trigger http400, offsets that are too large return nothing without error, disallows too big, public vs private data, rate limits, adjustable error rate, logging db is working, pagination limited to 50, returns empty array when limit = 0 but does not trigger error by passing that 0 around, etc');
    });
    //MAX_CONTENT_LENGTH_BYTES REQUESTS_PER_CONTRIVED_ERROR DISALLOW_WRITES LOCKOUT_ALL_KEYS DISABLE_RATE_LIMITS MAX_LIMIT LIMIT_OVERRIDE
});
