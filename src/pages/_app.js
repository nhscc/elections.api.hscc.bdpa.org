/* @flow */

import * as React from 'react'
import Head from 'next/head'

export default function App({ Component, pageProps }: any) {
    return (// * ContextProvider(s) for passing down state could go here
        <React.Fragment>
            <Head>
                <title>No Browser Access!</title>
            </Head>
            <React.StrictMode>
                <Component { ...pageProps } />
            </React.StrictMode>
        </React.Fragment>
    );
}
