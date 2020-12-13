import React from 'react';
import createReactClass from 'create-react-class';
import { Card } from '@material-ui/core';

import config from '../../../config';

const imgstyle = {
  width: '70%'
};
const lessStandardHref = {
  // color: 'black',
  textDecoration: 'none',
};

const InfoBox = createReactClass({
  render () {
    return (
      <Card style={{'textAlign':'center'}}>
        <br/>
        <a target='_blank' href={config.WEB_ROOT} style={lessStandardHref}>
        <img style={imgstyle} src='header-logo-pornhub.svg' />
        </a>
        <br/>
        <br/>
      </Card>
    );
  }
});

export default InfoBox;
