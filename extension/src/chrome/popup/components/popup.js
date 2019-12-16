import React from 'react';
import InfoBox from './infoBox';
import Settings from './settings';
import config from '../../../config';


const headerstyle = {
    height:"80px",
    'backgroundColor': "#1b1b1b",
    'borderStyle': "solid",
    'borderWidth': "0px 0px 8px 0px",
    'borderColor': "#F98E05",
};

const containerstyle = {
    width:"300px"
}

const divstyles = {
    'textAlign': "left",
    'paddingLeft': "15px",
    'paddingBottom': "0px",
    overflow: "hidden",
    'backgroundColor': "#f7fbfa",
    'fontFamily': "Trex-Regular",
};

const imgtrimmed = {
    width: "200px",
    'paddingLeft' : "15px",
    'paddingTop': "15px",
}

const devColors = "linear-gradient(to left, #f1b9b9, #a2cff7, #c8e485, #f7c4f3)";

const Popup = React.createClass({
    render () {

        /*if(config.NODE_ENV == 'development')
            styles['background-image'] = devColors;*/

        return (
            <div style={containerstyle}>
              <div style={headerstyle}>
                <a href="https://pornhub.tracking.exposed">
                  <img style={imgtrimmed} src="/header-logo-pornhub.svg" alt="logo" />
                </a>
              </div>
              <div style={divstyles}>
                <p>
                  This is <a target="_blank" href='https://tracking.exposed'>Tracking Exposed</a>, thank you for supporting our dirtiest side project ;)
                </p>
                <p>Access your data here:</p>
                <InfoBox {...this.props} />
                <p>Running on
                  <span> </span>
                  <a target="_blank" href="https://github.com/tracking-exposed/potrex/">free software</a>, part of a
                  <span> </span>
                  <a target="_blank" href="https://tracking.exposed/connect">bigger picture</a>.
                </p>
              </div>
            </div>
        );
    }
});

export default Popup;
