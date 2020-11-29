import React from 'react';
import config from '../../../config';
import createReactClass from 'create-react-class';

import { Card } from '@material-ui/core';

const imgstyle = {
    width: '80%'
};
const lessStandardHref = {
   // color: 'black',
    textDecoration: 'none'
};

const InfoBox = createReactClass({

    render () {


        return (
            <Card style={{'textAlign':'center'}}>
              <a target='_blank' href={config.WEB_ROOT} style={lessStandardHref}>
                <img style={imgstyle} src='header-logo-pornhub.svg' />
              </a>

            </Card>
        );
    }
});

export default InfoBox;