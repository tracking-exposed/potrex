import React from 'react';
import ReactDOM from 'react-dom';

import { createMuiTheme, ThemeProvider } from '@material-ui/core/styles';
import Videos from './Videos';
import Raw from './Raw';
import Homes from './Homes';

const Zimplon = {
    fontFamily: 'Trex-Regular',
    fontStyle: 'normal',
    fontDisplay: 'swap',
    fontWeight: 400,
    src: `
        local('Trex-Regular'),
        url('Trex-Regular.ttf') format('ttf')
    `,
    unicodeRange:
        'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF',
};

const theme = createMuiTheme({
    typography: {
        fontFamily: 'Trex-Regular'
    },
    overrides: {
        MuiCssBaseline: {
            '@global': {
                '@font-face': [Zimplon],
            },
        },
    },
});

function main () {
    const key = window.location.hash ? window.location.hash.substr(1) : "";
    if(key.length < 40) {
        ReactDOM.render(
            <ThemeProvider theme={theme}>
                <h1>Error: in the URL we can't see an auth key: please use the extension to access personal page</h1>
            </ThemeProvider>, document.getElementById('react--provided')
        );
    } else {
        ReactDOM.render(
            <ThemeProvider theme={theme}>
                Metadata:
                <Videos pkey={key}/>
                Raw content:
                <Raw pkey={key} />
            </ThemeProvider>, document.getElementById('react--provided')
        );
    }
}

/* 
import Searches from './Searches';
<Searches pkey={key} /> */

/* this is automatically called when 'js/generated/searches.js' */
main();
