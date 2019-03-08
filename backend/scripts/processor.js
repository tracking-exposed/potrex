#!/usr/bin/env node
var _ = require('lodash');
var moment = require('moment');
var debug = require('debug')('parser:video');
var parse = require('../lib/parse');

var jsdom = require("jsdom");
var { JSDOM } = jsdom;

var stats = { skipped: 0, error: 0, suberror: 0, success: 0 };

function extractSubVideo(htmln, n) {
    debugger;

    var t = htmln.getAttribute('title');
    var l = htmln.getAttribute('href');

    if(!t || !l) {
        debug("%d] Broked subVideo: t[%s], l[%s]", n, t, l);
        return null;
    }

    return { 
        title: t,
        href: l,
        id: l.replace(/.*viewkey=/)
    };

    return 0;
};

function parseVideoPage(metadata, html) {

    var retval = null;

    if(!(metadata.href.match(/viewkey=/))) {
        console.log("Skipping page", metadata.href);
        stats.skipped++;
        retval = _.extend(metadata, { processed: true, skipped: true });
        return retval;
    }

    try {
        var dom = new JSDOM(html);
        var D = dom.window.document;

        var vTitle = D.querySelectorAll("h1")[0].querySelector("span").textContent;
        if(!vTitle) {
            debugger;
            debug("Expected 1 and %d", _.size(D.querySelectorAll("h1")) );
            throw new Error("unable to get title");
        }

        let subVideosNfo = D.querySelectorAll('[data-related-url]');
        debug("Found %d subVideos in [%s]", _.size(subVideosNfo), vTitle);
        var subVideos = _.compact(_.map(subVideosNfo, extractSubVideo));
        debug("Extracted with precision %d", _.size(subVideos));

        /* more info? viewers, etc and shit? analysis and extraction goes here */
        var extracted = {
            title: vTitle,
            subVideos: subVideos,
        };
        debugger;

        stats.success++;
        retval = _.extend(metadata, extracted, { processed: true, skipped: false });
    } catch(error) {
        debug("unacceptable error! [%s] from %s: %s", metadata.href, metadata.clientTime, error);
        stats.error++;
        retval = _.extend(metadata, { processed: false, skipped: false });
    }
    retval.videoParser = true;
    debug("%s %s [%s], %j", retval.href, retval.id, retval.title, stats);
    return retval;
};

var videoPage = {
    'name': 'videoParser',
    'requirements': { processed: { $exists: false} },
    'implementation': parseVideoPage,
    'since': "2018-06-13",
    'until': moment().format('YYYY-MM-DD 23:59:59')
};

return parse.please(videoPage);
