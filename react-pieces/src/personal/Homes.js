import moment from 'moment';
import React from 'react';

import { Card } from '@material-ui/core';
import { Alert, AlertTitle } from '@material-ui/lab';
import FormHelperText from '@material-ui/core/FormHelperText';
import List from '@material-ui/core/List';
import Divider from '@material-ui/core/Divider';
import BeachAccessIcon from '@material-ui/icons/BeachAccess';

import Evidence from './Evidence';

const styles = {

};

const LOCALHOST_SERVER = 'http://localhost:10000';

function getHomeJSON(pkey) {
  if (window.location.origin.match(/localhost/))
    return `${LOCALHOST_SERVER}/api/v1/personal/${pkey}/home`;
  return `/api/v1/personal/${pkey}/home`;
}

class Homes extends React.Component{

  constructor (props) {
    super(props);
    this.state = { status: 'fetching' };
  }

  componentDidMount () {
    const url = getHomeJSON(this.props.pkey);
    fetch(url, { mode: 'cors' })
      .then(resp => resp.json())
      .then(data => this.setState({status: 'done', data }));
  }

  render () {

    if(!this.state || this.state.status == 'fetching')
      return (<div>Loading the most recently accessed homepages...</div>)

    console.log('X: props status', this.props, this.state);

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

    const home = _.get(this.state.data, 'home');

    if(!(this.state.data && home && home.length > 1 )) {
      return (
        <div style={styles}>
          <Card>
            <h1>Altought connection with server worked, no search terms seems available, <a href="https://www.youtube.com/watch?v=bs2u4NLaxbI">wtf</a>.</h1>
          </Card>
        </div>
      );
    }
    
    const items = []
    for (const sevid of home) {
      // console.log(sevid);
      items.push(<pre key={_.random(0, 0xffff)}>
        {JSON.stringify(sevid, undefined, 2)}
      </pre>
      );
      items.push(<Divider variant="inset" component="li" />);
    }

    return (
      <div style={styles}>
        <Card>
          <FormHelperText>
            Recent Homepage accessed 
          </FormHelperText>
          <List>
            {items}
          </List>
        </Card>
      </div>
    );
  }
}

export default Homes;
