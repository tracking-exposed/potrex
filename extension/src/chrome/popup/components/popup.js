import React from 'react';
import InfoBox from './infoBox';
import Settings from './settings';
import config from '../../../config';

const divstyles = {
    width: "300px",
    'textAlign': "center",
    overflow: "hidden",
    'background-color': "#f7fbfa",
    'font-family': "Trex-Regular",
};

const headerstyle = {
    height:"80px",
    'background-color': "#1b1b1b",
    'border-style': "solid",
    'border-width': "0px 0px 8px 0px",
    'border-color': "#F98E05",
};

const imgtrimmed = {
    width: "200px",
    align: "left",
    'padding-top': "15px",
    'padding-left': "15px"
}

const devColors = "linear-gradient(to left, #f1b9b9, #a2cff7, #c8e485, #f7c4f3)";

const Popup = React.createClass({
    render () {

        /*if(config.NODE_ENV == 'development')
            styles['background-image'] = devColors;*/

        return (
            <div style={divstyles}>

                <div style={headerstyle}> 
                    <a href="http://pornhub.tracking.exposed"> 
                        <img style={imgtrimmed} src="/header-logo-pornhub.svg" alt="logo"/> 

                    </a> 
                </div> 
                blablabla
                <p>
                    This is <a target="_blank" href='https://tracking.exposed'>Tracking Exposed</a>                    <span> </span>
                    — 
                    <span> </span>
                    control your data:
                </p>
                <InfoBox {...this.props} />
                <smaller>Running on 
                    <span> </span>
                    <a target="_blank" href="https://github.com/tracking-exposed/potrex/">                        free software
                    </a>, we welcome contributions.
                </smaller>
            </div>
        );
    }
});

export default Popup;

