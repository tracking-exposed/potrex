import React from 'react';
import _ from 'lodash';
import moment from 'moment';

import { Card } from '@material-ui/core';
import { Alert, AlertTitle } from '@material-ui/lab';
import FormHelperText from '@material-ui/core/FormHelperText';
import List from '@material-ui/core/List';
import Divider from '@material-ui/core/Divider';

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
      return (<h1 className="title">Loading the most recently accessed homepages...</h1>)

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

    /* <pre id={detk}>
          {JSON.stringify(rawe, undefined, 2)}
        </pre> */

    const items = []
    const grouped = _.groupBy(home, 'savingTime');
    console.log(grouped);
    const redone = _.map(grouped, function(videolist, savingTime) {
      const timeago = moment.duration(
        moment(savingTime) - moment.now()
      ).humanize(true)
      return {
        timeago,
        savingTime,
        videolist
      };
    });
    for (const e of redone) {
      console.log(e);
      const key=_.random(0, 0xffff);
      items.push(<div key={key}>
        <ul>
          <li key={_.random(0, 0xffff)} className="name">profile has story:
            {e.videolist[0].profileStory}, publishers type:
            {JSON.stringify(_.countBy(e.videolist, 'publisherType'))}</li>
          <li><span key={_.random(0, 0xfffff)} className="name">{e.timeago}</span>:
            {e.savingTime} ({e.videolist.length} videos)
            {JSON.stringify(_.countBy(e.videolist, 'sectionName'))}
          </li>
        </ul>
     </div>);
      items.push(<Divider variant="inset" component="li" />);
    }

    return (
      <div style={styles}>
        <Card>
          <FormHelperText className="helper">
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
