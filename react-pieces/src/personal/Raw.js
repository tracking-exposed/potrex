import moment from 'moment';
import React from 'react';

import { Card, ListItemText } from '@material-ui/core';
import { Alert, AlertTitle } from '@material-ui/lab';
import FormHelperText from '@material-ui/core/FormHelperText';
import List from '@material-ui/core/List';
import Divider from '@material-ui/core/Divider';
import BeachAccessIcon from '@material-ui/icons/BeachAccess';

import Evidence from './Evidence';

const LOCALHOST_SERVER = 'http://localhost:10000';

function getRAWURL(pkey) {
  if (window.location.origin.match(/localhost/))
    return `${LOCALHOST_SERVER}/api/v2/raw/${pkey}/`;
  return `/api/v2/raw/${pkey}/`;
}

class Raw extends React.Component{

  constructor (props) {
    super(props);
    this.state = { status: 'fetching' };
  }

  componentDidMount () {
    const url = getRAWURL(this.props.pkey);
    try {
      fetch(url, { mode: 'cors' })
        .then(resp => resp.json())
        .then(data => this.setState({status: 'done', data }))
    } catch(e) {
      this.setState({status: 'error', message: e.message });
    }
  }

  render () {

    if(!this.state || this.state.status == 'fetching')
      return (<div>Loading raw information on collected evidences...</div>)

    if(this.state.status !== 'done') {
      console.log("Incomplete info before render");
      return (
        <div style={styles}>
          <Card>
            <Alert severity="error">
              <AlertTitle>Error</AlertTitle>
              Server didn't return data, this might means the backend is down — <strong>Make sense also because this is just an experiment in prototype phase.</strong>
            </Alert>
          </Card>
        </div>
      );
    }

    console.log("raw list", this.state.data);
    const items = []

    try {
      for (const rawe of this.state.data.content) {
        // sevid.id it is a list temporarly ignored, maybe usable in advanced searches
        items.push(<ListItemText primary={JSON.stringify(rawe)}></ListItemText>);
        items.push(<Divider variant="inset" component="li" />);
      }
      console.log("Raw elements produced successfully", items.length);
    } catch(e) {
      items.push("<p>No raw data!</p>");
    }

    return (
      <div>
        <Card>
          <FormHelperText>
            Everything this account sent (considering only last 30 elements)
          </FormHelperText>
          <List>
            {items}
          </List>
        </Card>
      </div>
    );
  }
}

export default Raw;
