import { createServer, IncomingMessage, ServerResponse } from 'http'
import listen from 'test-listen'
import { apiResolver } from 'next/dist/next-server/server/api-utils'
import fetch from 'isomorphic-unfetch'

export type TestParams = { fetch: (init?: RequestInit) => ReturnType<typeof fetch> };

export type TesApiEndParams = {
    test: (obj: TestParams) => Promise<void>;
    params?: object;
    requestPatcher?: (req: IncomingMessage) => void;
    responsePatcher?: (res: ServerResponse) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    next: any;
};

export async function testApiEndpoint({ test, params, requestPatcher, responsePatcher, next }: TesApiEndParams) {
    let server = null;

    const url = await listen(server = createServer((req, res) => {
        requestPatcher && requestPatcher(req);
        responsePatcher && responsePatcher(res);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return apiResolver(req, res, params, next, undefined as any);
    }));

    await test({ fetch: (init?: RequestInit) => fetch(url, init) });

    server.close();
}
