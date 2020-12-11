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
  /* width: '400px', */
};

const LOCALHOST_SERVER = 'http://localhost:10000';

function getVideoURL(pkey) {
  if (window.location.origin.match(/localhost/))
    return `${LOCALHOST_SERVER}/api/v1/personal/${pkey}/`;
  return `/api/v1/personal/${pkey}/`;
}

class Videos extends React.Component{

  constructor (props) {
    super(props);
    this.state = { status: 'fetching' };
  }

  componentDidMount () {
    const url = getVideoURL(this.props.pkey);
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
      return (<div>Loading the most recently accessed vidoes...</div>)

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

    console.log("data list", this.state.data);
    const vlist = _.get(this.state.data, 'recent');

    if(!(this.state.data && vlist && vlist.length )) {
      return (
        <div style={styles}>
          <Card>
            <h3>Connection with server worked, no content found under this profileKey.</h3>
          </Card>
        </div>
      );
    }
    
    const videos = []
    try {
      for (const vid of _.filter(vlist, { type: 'video'}) ) {
        // sevid.id it is a list temporarly ignored, maybe usable in advanced searches
        videos.push(<Evidence
          term={vid.title + " " + vid.views + " " + vid.relative + " " + JSON.stringify(vid.categories)}
          amount={JSON.stringify(vid.producer)}
          totalVideos={vid.related.length}
          key={vid.metadataId} /> 
        );
        videos.push(<Divider variant="inset" component="li" />);
      }
      console.log("video added", videos.length)
    } catch(e) {
      videos.push("<p>No videos!</p>");
    }

    const homes = []
    try {
      for (const hom of _.filter(vlist, { type: 'home'}) ) {
        // sevid.id it is a list temporarly ignored, maybe usable in advanced searches
        homes.push(<Evidence
          term={JSON.stringify(_.map(hom.sections, 'display'))}
          totalVideos={JSON.stringify(_.map(hom.sections, function(s) { return _.size(s.videos)}))}
          amount={_.sum(_.map(hom.sections, function(s) { return s.videos.length }))}
          key={hom.metadataId} /> 
        );
        homes.push(<Divider variant="inset" component="li" />);
      }
      console.log("homes added", homes.length)
    } catch(e) {
      homes.push("<p>No homes!</p>");
    }

    return (
      <div style={styles}>
        <FormHelperText>Videos</FormHelperText>
        <Card>
          <List>
            {videos}
          </List>
        </Card>
        <FormHelperText>Homepage</FormHelperText>
        <Card>
          <List>
            {homes}
          </List>
        </Card>
      </div>
    );
  }
}

export default Videos;
