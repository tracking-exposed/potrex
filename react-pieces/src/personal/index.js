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


const LOCALHOST_SERVER = 'http://localhost:10000';

function buildCSVlinks(subject) {
  if (window.location.origin.match(/localhost/))
    return `${LOCALHOST_SERVER}/api/v1/${subject}`;
  return `/api/v1/${subject}/`;
}

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
                <h5><ul>
                  <li>
                    <a href={buildCSVlinks('homeCSV')} target="_blank">
                        Last 2000 Home CSV 
                    </a> 
                  </li>
                  <li>
                    <a href={buildCSVlinks('homeUnwindedCSV')} target="_blank">
                        Enhanced with categories (CSV)
                    </a>
                  </li>
                  <li>
                    <a href={buildCSVlinks('personal/' + key + '/csv')} target="_blank">
                        Your Metadata CSV (Home only)
                    </a>
                  </li>
               </ul></h5>
                Raw content submit by this profile
               <div className="row">
                <div className="col-6">
                  <Raw pkey={key} />
                </div>
                <div className="col-6">
                  <Homes pkey={key}/>
                </div>
               </div>
                Profile info:
                <div id="profile">TODO</div>
            </ThemeProvider>, document.getElementById('react--provided')
        );
    }
}

/* 
import Searches from './Searches';
<Searches pkey={key} /> */

/* this is automatically called when 'js/generated/searches.js' */
main();
