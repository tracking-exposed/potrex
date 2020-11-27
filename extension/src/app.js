// # Welcome to the extension docs!
// Here you can learn how the extension works and, if this is what you aim for,
// where to put your hands to hack the code.
//
// ## Structure of the extension
// The extension has two parts:
//  - a content script
//  - event pages.
//
// The **content script** is the JavaScript code injected into the pornhub.com
// website. It can interact with the elements in the page to scrape the data and
// prepare the payload to be sent to the API.
//
// On the other side there are **event pages**. They are scripts triggered by
// some events sent from the **content script**. Since they run in *browser-space*,
// they have the permission (if granted) to do cross-domain requests, access
// cookies, and [much more](https://developer.chrome.com/extensions/declare_permissions).
// All **event pages** are contained in the [`./background`](./background/app.html) folder.
// (the name is **background** for historical reasons and it might be subject of changes
// in the future).
//

// # Code

// Import other utils to handle the DOM and scrape data.
import $ from 'jquery';
import _ from 'lodash';
import moment from 'moment';

import config from './config';
import hub from './hub';
import { registerHandlers } from './handlers/index';


const PH_GENERIC_SELECTOR = 'h1';
const PH_RECOMMENDED = '.recommendedVideosContainer';
const NUMBER_OF_RETRANSMISSION = 3;

// bo is the browser object, in chrome is named 'chrome', in firefox is 'browser'
const bo = chrome || browser;

// variable used to spot differences due to refresh and url change
let randomUUID = "INIT" + Math.random().toString(36).substring(2, 13) +
                Math.random().toString(36).substring(2, 13);

let amountGrossDimension = -1;

// Boot the user script. This is the first function called.
// Everything starts from here.
function boot () {

    if(_.endsWith(window.location.origin, 'pornhub.tracking.exposed')) {
        if(_.isUndefined($("#extension--parsable").html())) {
            return null;
        } else {
            // $(".extension-missing").hide();
            return null;
        }
    } else if(_.endsWith(window.location.origin, 'pornhub.com')) {

        // this get executed on pornhub.com and it is the start of potrex extension
        console.log(`potrex version ${config.VERSION} loading; Config object:`);
        console.log(config);

        // is an hidden div, created on pornhub.com domain,
        // visibile when the recording is triggered
        createLoadiv();

        // Register all the event handlers.
        // An event handler is a piece of code responsible for a specific task.
        // You can learn more in the [`./handlers`](./handlers/index.html) directory.
        registerHandlers(hub);

        let x = localStorage.getItem('watchedVideoIds');
        try {
            let y = JSON.parse(x);
            if(!y || _.size(y) == 0 )
                amountGrossDimension = 0;
            else if(_.size(y) > 0 && _.size(y) < 10)
                amountGrossDimension = 1;
            else if(_.size(y) > 10 && _.size(y) < 50)
                amountGrossDimension = 2;
            else if(_.size(y) >= 50)
                amountGrossDimension = 3;
            else {
                console.log("Is this even possible?");
                amountGrossDimension = -1;
            }
            console.log("watchedVideoIds", y, _.size(y), "anonymized info we'll send:", amountGrossDimension);
        } catch(e) {
            console.log("Error while looking at watchedVideoIds", e);
            amountGrossDimension = 0;
        }

        return localLookup(response => {
            // `response` contains the user's public key and its status,
            console.log("localLookup responded:", response);
            hrefUpdateMonitor();
            flush();
        });

    } else if(_.startsWith(window.location.origin, 'localhost')) {
        console.log("localhost: ignored condition");
        return null;
    }
}

function createLoadiv() {
    // this is bound to #loadiv and appears on the right bottom
    var div = document.createElement('div');

    // from this coordinates the span below would be appeneded
    div.style.position = 'fixed';
    div.style.width = '48px';
    div.style.height = '48px';
    div.style.right = '10px';
    div.style.bottom= '10px';
    div.style['z-index'] = '9000';

    div.setAttribute('id', 'loadiv');
    document.body.appendChild(div);

    $("#loadiv").show();
};

/*
 * phases are all the div which can appears on the right bottom.
 * the function below is called in the code, when the condition is
 * met, and make append the proper span */
const phases = {
    'adv': {'seen': advSeen },
    'video': {'seen': videoSeen, 'wait': videoWait, 'send': videoSend},
    'counters' : {
        'adv': { seen: 0 },
        'video': { seen: 0, wait: 0, send: 0}
    }
}
function phase(path) {
    const f = _.get(phases, path);
    f(path);
}

/* below the 'span creation' function mapped in the dict phases above */
function videoWait(path) {
    buildSpan({
        path,
        position: 1,
        text: 'waiting...',
        duration: 400,
    });
}
function videoSeen(path) {
    buildSpan({
        path,
        position: 2,
        text: 'Evidence collected',
        duration: 11500,
    });
    $("#video-seen").css('background-color', '#F98E05');
    $("#video-seen").css('background-position', 'center');
    $("#video-seen").css('cursor', 'cell');
    $("#video-seen").click(function() {
        if( testElement($('body').html(), 'body') ) {
            phase('video.send');
        }
    })
}
function videoSend(path) {
    buildSpan({
        path,
        position: 2,
        text: 'Evidence sent',
        duration: 400,
    });
    $("#video-seen").css('background-color', '#F98E05');
    $("#video-seen").css('color', 'white');
}
function advSeen(path) {
    buildSpan({
        path,
        position: 4,
        text: 'seen adv',
        duration: 400,
    });
};

/* this function build the default span, some css sytes are
 * overriden in the calling function */
function buildSpan(c) {
    var cnt = _.get(phases.counters, c.path);
    cnt +=1;
    var id = _.replace(c.path, /\./, '-');
    _.set(phases.counters, c.path, cnt);

    var infospan = null;
    var fullt = c.text; /* `${cnt} ▣ ${c.text}`; */
    if(cnt == 1) {
        // console.log("+ building span for the first time", c, cnt);
        infospan = document.createElement('span');
        infospan.setAttribute('id', id);
        infospan.style.position = 'fixed';
        infospan.style.width = '120px';
        infospan.style.textAlign = 'right';
        infospan.style.height = '20px';
        infospan.style.right = '5px';
        infospan.style.color = 'lightgoldenrodyellow';
        infospan.style.bottom = (c.position * 16) + 'px';
        infospan.style.size = '0.6em';
        infospan.style.padding = '4px';
        infospan.style['z-index'] = '9000';
        infospan.style['border-radius'] = '10px';
        infospan.style.background = '#798e05';
        infospan.textContent = fullt;
        document.body.appendChild(infospan);
        /* change infospan in jquery so no proble in apply .fadeOut */
        infospan = $("#" + id);
    } else {
        infospan = $("#" + id);
        infospan.text(fullt);
    }

    $("#loadiv").show();
    infospan.css('display', 'flex');
    infospan.fadeOut({ duration: c.duration});
}

const videoPeriodicTimeout = 5000;
var lastVideoURL = null;
var lastVideoCNT = 0;
function hrefUpdateMonitor() {

    window.setInterval(function() {
        // phase('video.wait');
        let diff = (window.location.href != lastVideoURL);

        // client might duplicate the sending of the same
        // video. using a random identifier, we spot the
        // clones and drop them server side.
        // also, here is cleaned the cache declared below
        if(diff) {
            phase('video.seen');
            cache = [];
            refreshUUID();
        }

        lastVideoURL = window.location.href;
        document
            .querySelectorAll(PH_GENERIC_SELECTOR)
            .forEach(function () {
                return processData(PH_GENERIC_SELECTOR, $('body'));
            });
        document
            .querySelectorAll(PH_RECOMMENDED)
            .forEach(function() {
                return processData(PH_RECOMMENDED, $(PH_RECOMMENDED));
            });
            
        function processData(selector, e) {
            // console.log("check", selector, e, e.length, e.html());
            if(!diff) {
                lastVideoCNT++;
                if(lastVideoCNT > NUMBER_OF_RETRANSMISSION) {
                    // console.log(`Ignoring this URL (${lastVideoURL}), been sent already two times`);
                    return;
                }
            }
            console.log("Selector match in ", window.location.href,
                ", sending", _.size(e.html()),
                " <- size:", e.length, "counters:",
                lastVideoCNT, NUMBER_OF_RETRANSMISSION );
            if( testElement($('body').html(), 'body') )
                phase('video.send');
        };

    }, videoPeriodicTimeout);
}

let cache = [];
function testElement(nodeHTML, selector) {
    // this function look at the LENGTH of the proposed element.
    // if an element with the same size has been already sent with
    // this URL, this duplication is ignored.

    const s = _.size(nodeHTML);
    const exists = _.reduce(cache, function(memo, e, i) {
        const evalu = _.eq(e, s);
        /* console.log(memo, s, e, evalu, i); */
        if(!memo)
            if(evalu)
                memo = true;

        return memo;
    }, false);

    if(exists)
        return false;

    if(!s)
        return false;

    cache.push(s);

    hub.event('newVideo', {
        element: nodeHTML,
        href: window.location.href,
        when: Date(),
        selector,
        size: s,
        randomUUID,
        amountGrossDimension,
    });
    console.log("->",
        _.size(cache),
        "new element sent, selector", selector,
        Date(), "size", s,
        cache,
    );
    return true;
}

var lastCheck = null;
function refreshUUID() {
    const REFERENCE = 3;
    if(lastCheck && lastCheck.isValid && lastCheck.isValid()) {
        var timed = moment.duration( moment() - lastCheck);
        if(timed.asSeconds() > REFERENCE) {
            // here is an example of a non secure random generation
            // but doesn't matter because the query on the server we
            // has this with the user publicKey, so if someone wants to
            // corrupt their data: they can ¯\_(ツ)_/¯
            randomUUID = Math.random().toString(36).substring(2, 15) +
                Math.random().toString(36).substring(2, 15); /*
            console.log(
                "-> It is more than", REFERENCE, timed.asSeconds(),
                "Refreshed randomUUID", randomUUID); */
        } else { /*
            console.log("-> It is less then", REFERENCE, timed.asSeconds()); */
        }
    };
    lastCheck = moment();
}



// The function `localLookup` communicates with the **action pages**
// to get information about the current user from the browser storage
// (the browser storage is unreachable from a **content script**).
function localLookup (callback) {
    bo.runtime.sendMessage({
        type: 'localLookup',
        payload: {
            userId: config.userId
        }
    }, callback);
}

// The function `remoteLookup` communicate the intention
// to the server of performing a certain test, and retrive 
// the userPseudonym from the server
function remoteLookup (callback) {
    bo.runtime.sendMessage({
        type: "remoteLookup",
        payload: {
            // window.location.pathname.split('/')
            // Array(4) [ "", "d", "1886119869", "Soccer" ]
            // window.location.pathname.split('/')[2]
            // "1886119869"
            testId: window.location.pathname.split('/')[2]
        }
    }, callback);
}

function flush () {
    window.addEventListener('beforeunload', (e) => {
        hub.event('windowUnload');
    });
}

// Before booting the app, we need to update the current configuration
// with some values we can retrieve only from the `chrome`space.
bo.runtime.sendMessage({type: 'chromeConfig'}, (response) => {
    Object.assign(config, response);
    boot();
});
