import React from 'react';
import config from '../../../config';
import { Card } from 'material-ui/Card';
import $ from 'jquery';

const imgstyle = {
    width: "100%"
};
const cardStyle = {
    'textAlign': "center",
};
const h1style = {
    'fontSize': "2em",
    'color': "#65b211",
    'textUnderlinePosition': "under",
    'fontWeight': "bolder",
};
const star = {
    'color': "#fe5000"
};

const InfoBox = React.createClass({

    render () {
        const personalLink = config.WEB_ROOT + '/personal/' + this.props.publicKey;

        return (
            <Card style={cardStyle}>
                <span style={h1style}>algorithms are everywhere!</span>
                <span style={h1style}>especially in pornhub ;)</span>

                <a target='_blank' href={personalLink}>
                    <img style={imgstyle} src='/potrex400.png' />
                </a>
                <a target='_blank' href={personalLink}>
                    <span style={h1style}>play some</span>
                </a>
                <span> </span>
                <a target='_blank' href={personalLink}>
                    <span style={h1style}>
                        <span style={star}> ☆ </span>
                            data porn!
                        <span style={star}> ☆ </span>
                    </span>
                </a>
            </Card>
        );
    }
});

export default InfoBox;
