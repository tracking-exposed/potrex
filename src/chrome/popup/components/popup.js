import React from 'react';
import InfoBox from './infoBox';
import Settings from './settings';

const styles = {
    width: "400px",
    'textAlign': "right"
};

const Popup = React.createClass({
    render () {
        return (
            <div style={styles}>
                <p>This belong to the research family of 
                    <span> </span>
                    <a href='https://youtube.tracking.exposed'>ytTREX</a>, our
                    <span> </span>
                    <a href='https://tracking.exposed'>manifesto</a>, and
                    <span> </span>
                    <a href='https://facebook.tracking.exposed'>fbTREX</a>
                </p>
                <InfoBox {...this.props} />
                <Settings {...this.props} />
            </div>
        );
    }
});

export default Popup;
