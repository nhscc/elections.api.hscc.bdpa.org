// TODO: turn this into an @ergodark npm package along with the types
// TODO: also, GenericObject should go into @ergodark/types along with other
// TODO: shared types

import type { NextApiResponse } from 'next'
import type { HttpStatusCode, GenericObject, SuccessJsonResponse, ErrorJsonResponse } from 'types/global'

export function sendGenericHttpResponse(res: NextApiResponse, statusCode: HttpStatusCode, responseJson: GenericObject) {
    res.status(statusCode).send(responseJson);
}

export function sendHttpSuccessResponse(res: NextApiResponse, statusCode: HttpStatusCode | undefined, responseJson: GenericObject) {
    const json: SuccessJsonResponse = { ...responseJson, success: true };
    sendGenericHttpResponse(res, statusCode || 200, json);
    return json;
}

export function sendHttpErrorResponse(res: NextApiResponse, statusCode: HttpStatusCode, responseJson: ErrorJsonResponse) {
    sendGenericHttpResponse(res, statusCode, responseJson);
    return responseJson;
}

export function sendHttpOk(res: NextApiResponse, responseJson: GenericObject) {
    sendHttpSuccessResponse(res, undefined, responseJson);
}

export function sendHttpBadRequest(res: NextApiResponse, responseJson: GenericObject) {
    sendHttpErrorResponse(res, 400, {
        error: 'request was malformed or otherwise bad',
        ...responseJson
    });
}

export function sendHttpUnauthenticated(res: NextApiResponse, responseJson: GenericObject) {
    sendHttpErrorResponse(res, 401, {
        error: 'session is not authenticated',
        ...responseJson
    });
}

export function sendHttpUnauthorized(res: NextApiResponse, responseJson: GenericObject) {
    sendHttpErrorResponse(res, 403, {
        error: 'session is not authorized',
        ...responseJson
    });
}

export function sendHttpNotFound(res: NextApiResponse, responseJson: GenericObject) {
    sendHttpErrorResponse(res, 404, {
        error: 'resource was not found',
        ...responseJson
    });
}

export function sendHttpBadMethod(res: NextApiResponse, responseJson: GenericObject) {
    sendHttpErrorResponse(res, 405, {
        error: 'bad method',
        ...responseJson
    });
}

export function sendHttpTooLarge(res: NextApiResponse, responseJson: GenericObject) {
    sendHttpErrorResponse(res, 413, {
        error: 'request body is too large',
        ...responseJson
    });
}

export function sendHttpRateLimited(res: NextApiResponse, responseJson: GenericObject) {
    sendHttpErrorResponse(res, 429, {
        error: 'session is rate limited',
        ...responseJson
    });
}

export function sendHttpError(res: NextApiResponse, responseJson: GenericObject) {
    sendHttpErrorResponse(res, 500, {
        error: '🤯 something unexpected happened on our end 🤯',
        ...responseJson
    });
}
