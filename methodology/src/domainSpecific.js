const _ = require('lodash');
const moment = require('moment');
const debug = require('debug')('guardoni:pornhub');
const logreqst = require('debug')('guardoni:requests');
const screendebug = require('debug')('guardoni:screenshots');
const bconsError = require('debug')('guardoni:error');
const bcons = require('debug')('guardoni:console');
const path = require('path');
const url = require('url');
const fs = require('fs');
const nconf = require('nconf');

debug.enabled = logreqst.enabled = screendebug.enabled = true;

global.lastScreenTime = moment().subtract(4, 'seconds');
global.currentURLlabel = null;
global.screenshotPrefix = null;
global.interval = null;
global.publicKeySpot = null;

async function memorySaving(page, info) {
    /* info is an object built with information from the called */

    const localStorageData = await page.evaluate(() => {
        let json = {};
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          json[key] = localStorage.getItem(key);
        }
        return json;
    });

    const cookies = await page._client.send('Network.getAllCookies');

    const lasturllog = {
        when: new Date(),
        localStorageData,
        cookies,
        ...info,
    };
    return lasturllog;
}


function getScreenshotFilename() {
    /* this function return null if no screenshot has to be taken,
     * and the criteria is to take max one screen every 5 seconds */
    const now = moment();
    if(moment.duration(now - global.lastScreenTime).asSeconds() < 5)
        return null;

    global.lastScreenTime = now;
    /* screenshotPrefix would exist as a directory */
    return path.join(global.screenshotPrefix,
        `${global.currentURLlabel}-${global.lastScreenTime.toISOString()}.jpeg`);
}

async function consoleLogParser(page, message) {
    /* this function is primarly meant to collect the public key,
     * but it is also an indirect, pseudo-efficent way to communicate
     * between puppeteer evaluated selectors and action we had to do */
    const consoleline = message.text();
    if( global.publicKeySpot === null && consoleline.match(/publicKey/) ) {
        const material = JSON.parse(consoleline);
        global.publicKeySpot = material.publicKey;
    }
};

async function beforeDirectives(page, profinfo) {
    page.on('console', await _.partial(consoleLogParser, page));
    page.on('pageerror', message => bconsError('Error %s', message));
    page.on('requestfailed', request => bconsError(`Requestfail: ${request.failure().errorText} ${request.url()}`));

    // await page.setRequestInterception(true);
    if(!!nconf.get('3rd')) {
        page.on('request', await _.partial(manageRequest, profinfo));
        setInterval(print3rdParties, 60 * 1000);
    } else {
        debug("3rd party trackers not monitored, enable it with --3rd");
    }
}

/* this is the variable we populate of statistics
 * on third parties, and every minute, it is printed on terminal */
const thirdParties = {};
/* and this is the file where logging happen */
let reqlogfilename;

function manageThirdParty(profinfo, reqpptr) {
    const up = url.parse(reqpptr.url());
    if(_.endsWith(up.host, 'pornhub.com') ||
       _.endsWith(up.host, 'phncdn.com') )
       return;

    const full3rdparty = {
        method: reqpptr.method(),
        host: up.host,
        pathname: up.pathname,
        search: up.search,
        type: reqpptr.resourceType(),
        when: new Date().toISOString(),
    };
    if(full3rdparty.method != 'GET')
        full3rdparty.postData = reqpptr.postData();

    reqlogfilename = path.join(
        'activitylogs',
        profinfo.profileName + "++" + 'requestlog.json'
    );
    fs.appendFileSync(
        reqlogfilename,
        JSON.stringify(full3rdparty, undefined, 1) + ",\n"
    );
    if(!thirdParties[up.host])
        thirdParties[up.host] = 1;
    else
        thirdParties[up.host] += 1;
}

function manageRequest(profinfo, reqpptr) {
    try {
        manageThirdParty(profinfo, reqpptr);
    } catch(error) {
        debug("Error in manageRequest function: %s", error.message);
    }
}

function print3rdParties() {
    logreqst("Logged third parties connections in [%s] to %o",
        reqlogfilename, thirdParties);
}

async function beforeLoad(page, directive) {
    global.currentURLlabel = directive.urltag;
}

async function completed() {
    return global.publicKeySpot;
}

async function beforeWait(page, directive) {
}

async function afterWait(page, directive) {
    // const innerWidth = await page.evaluate(_ => { return window.innerWidth });
    // const innerHeight = await page.evaluate(_ => { return window.innerHeight });
}

module.exports = {
    memorySaving,
    beforeLoad,
    beforeWait,
    afterWait,
    beforeDirectives,
    completed,
    DOMAIN_NAME: 'pornhub.com',
}
