import React from 'react';
import config from '../../../config';

const InfoBox = React.createClass({

    render () {
        const personalLink = config.WEB_ROOT + '/personal/#' + this.props.publicKey;
        return (
                <a target='_blank' href={personalLink}>
                    <img className="imgstyle" src='/access-your-data.png' />
                </a>
        );
    }
});

export default InfoBox;
