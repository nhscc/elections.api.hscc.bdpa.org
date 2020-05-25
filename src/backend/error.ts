export class AppError extends Error {}
export class GuruMeditationError extends AppError {}
export class ValidationError extends AppError {}

export class UpsertFailedError extends AppError {
    constructor(...args: any[]) {
        const message = args[0] || 'data upsert failed';
        super(...[message, ...args.slice(1)]);
    }
}

export class NotFoundError extends AppError {
    constructor(...args: any[]) {
        const message = !!args[0]
            ? `item ${args[0]} does not exist or was not found`
            : 'item or resource was not found';

        super(...[message, ...args.slice(1)]);
    }
}

export class TimeTypeError extends UpsertFailedError {
    constructor(...args: any[]) {
        const message = args[0] || 'invalid `opens` and/or `closes` properties (bad time data?)';
        super(...[message, ...args.slice(1)]);
    }
}

export class IdTypeError extends AppError {
    constructor(...args: any[]) {
        const message = !!args[0]
            ? `expected valid ObjectId instance, got "${args[0]}" instead`
            : 'invalid ObjectId encountered';

        super(...[message, ...args.slice(1)]);
    }
}

export class ApiKeyTypeError extends AppError {
    constructor(...args: any[]) {
        super('invalid API key encountered');
    }
}

export class RankingsTypeError extends AppError {
    constructor(...args: any[]) {
        const message = !!args[0]
            ? `encountered illegal ranking \`${args[0]}\``
            : 'one or more illegal rankings encountered';

        super(...[message, ...args.slice(1)]);
    }
}

export class LimitTypeError extends AppError {
    constructor(...args: any[]) {
        const message = typeof args[0] == 'number'
            ? `\`limit\` must be a number, got ${args[0]} instead`
            : 'invalid `limit` encountered';

        super(...[message, ...args.slice(1)]);
    }
}
