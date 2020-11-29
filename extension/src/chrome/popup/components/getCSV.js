import React from 'react';
import config from '../../../config';

import Link from '@material-ui/core/Link';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import DashboardIcon from '@material-ui/icons/Dashboard';
import OndemandVideoIcon from '@material-ui/icons/OndemandVideo';
import HomeIcon from '@material-ui/icons/Home'

function ListItemLink(props) {
    return (
        <ListItem button component="a" {...props} />
    );
}

class InfoBox extends React.Component{

    render () {
        const homecsv = config.API_ROOT + '/personal/' + this.props.publicKey + '/home' + '/csv';
        const videocsv = config.API_ROOT + '/personal/' + this.props.publicKey + '/video' + '/csv';
        const personalLink = config.WEB_ROOT + '/personal/#' + this.props.publicKey;

        return (
          <List component="nav">

            <ListItemLink href={personalLink} target="_blank">
              <ListItemIcon>
                <HomeIcon color="primary" style={{ fontSize: 35 }}/>
              </ListItemIcon>
             <ListItemText primary="Personalization Page" secondary="compare results" />
            </ListItemLink>

            <ListItemLink href={homecsv} target="_blank">
              <ListItemIcon>
                <DashboardIcon color="primary" style={{ fontSize: 35 }} />
              </ListItemIcon>
              <ListItemText primary="Download Homepage Data" secondary="collected homepages .csv" />
            </ListItemLink>

            <ListItemLink href={videocsv} target="_blank">
              <ListItemIcon>
                <OndemandVideoIcon color="primary" style={{ fontSize: 35 }} />
              </ListItemIcon>
              <ListItemText primary="Download Related Videos Data" secondary="collected video recommendations .csv" />
            </ListItemLink>

          </List>
        );
    }
};

export default InfoBox;
