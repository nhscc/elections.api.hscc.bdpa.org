/* @flow */

import React from 'react'
import App from 'next/app'
import Head from 'next/head'

export default class extends App {
    render() {
        const { Component, pageProps } = this.props;

        return (
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
}
