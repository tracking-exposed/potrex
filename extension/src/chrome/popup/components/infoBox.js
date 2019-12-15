import React from 'react';
import config from '../../../config';
import { Card } from 'material-ui/Card';
import $ from 'jquery';

const imgstyle = {
    width: "20%"
};
const cardStyle = {
    'textAlign': "center",
};

const InfoBox = React.createClass({

    render () {
        const personalLink = config.WEB_ROOT + '/personal/#' + this.props.publicKey;

        return (

                <a target='_blank' href={personalLink}>
                    <img style={imgstyle} src='/potrex400.png' />
                </a>
        
        );
    }
});

export default InfoBox;
