import * as React from 'react'
import { getEnv } from 'universe/backend/env'

const env = getEnv().NODE_ENV;

export default function Index(): JSX.Element {
    return (
        <React.Fragment>
            <p>Psst: there is no web frontend for this API.</p>
            { env != 'production' && <p><strong>{`(in ${env} mode!)`}</strong></p> }
        </React.Fragment>
    );
}
