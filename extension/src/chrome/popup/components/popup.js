import React from 'react';
import InfoBox from './infoBox';

const Popup = React.createClass({
    render () {
        return (
            <div className="containerstyle">
              <div className="headerstyle">
                <a href="https://pornhub.tracking.exposed" target="_blank">
                  <img className="svglimit" src="/header-logo-pornhub.svg" alt="logo" />
                </a>
              </div>
              <div className="textstyle">
                <p>
                  This is <a target="_blank" href='https://tracking.exposed'>Tracking Exposed</a>. Thank you for believing in our dirtiest side project ;)
                </p>
              </div>
              <InfoBox {...this.props} />
              <div className="textstyle">
                <p>Running on
                  <span> </span>
                  <a target="_blank" href="https://github.com/tracking-exposed/potrex/">free software</a>, for any question 
                  <span> </span>
                  <a target="_blank" href="https://tracking.exposed/connect">contact us</a>.
                </p>
              </div>
            </div>
        );
    }
});

export default Popup;
