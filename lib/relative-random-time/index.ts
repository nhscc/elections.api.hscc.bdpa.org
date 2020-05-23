import randomInt from 'random-int'

export type TimeParams = { before?: number; after?: number };
export type TimespanParams = TimeParams & { bounds: number[] };

const FAR_LARGEST_ABS = 10**12;
const FAR_SMALLEST_ABS = 10**9;
const NEAR_LARGEST_ABS = 10**5;
const NEAR_SMALLEST_ABS = 10**3;

const dateTLS = (time: number): string => (!isFinite(time) && time.toString()) || (new Date(time)).toLocaleString();

// TODO: document that bounds are inclusive
export function fromTimespan({ bounds, before, after }: TimespanParams): number {
    // ? Ensure sorting happens in ascending order
    bounds.sort((a, b) => a - b);

    const now = Date.now();
    const floor = Math.max((after ?? -Infinity) + 1, now + bounds[0]);
    const ceiling = Math.min((before ?? Infinity) - 1, now + bounds[1]);

    if(floor > ceiling) {
        const errorPreamble = 'bad bounds. Cannot choose a time that occurs before';
        throw new Error(`${errorPreamble} ${dateTLS(ceiling)} yet after ${dateTLS(floor)}`);
    }

    return randomInt(ceiling, floor);
}

export function farPast({ before, after }: TimeParams = {}): number {
    return fromTimespan({ bounds: [-FAR_SMALLEST_ABS, -FAR_LARGEST_ABS], before, after });
}

export function nearPast({ before, after }: TimeParams = {}): number {
    return fromTimespan({ bounds: [-NEAR_SMALLEST_ABS, -NEAR_LARGEST_ABS], before, after });
}

export function present(): number {
    return Date.now();
}

export function nearFuture({ before, after }: TimeParams = {}): number {
    return fromTimespan({ bounds: [NEAR_SMALLEST_ABS, NEAR_LARGEST_ABS], before, after });
}

export function farFuture({ before, after }: TimeParams = {}): number {
    return fromTimespan({ bounds: [FAR_SMALLEST_ABS, FAR_LARGEST_ABS], before, after });
}
