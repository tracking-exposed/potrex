#!/usr/bin/env node
const _ = require('lodash');
const nconf = require("nconf");
const Promise = require("bluebird");
const moment = require("moment");
const debug = require('debug')('parser:video');
const fs = Promise.promisifyAll(require('fs'));

const mongo = require("../lib/mongo");
const parsedet = require('../lib/parsedetails');
const parse = require('../lib/parse');

const jsdom = require("jsdom");
const { JSDOM } = jsdom;

nconf.argv().env().file({ file: "config/settings.json" });

var stats = { skipped: 0, error: 0, suberror: 0, success: 0 };

function parseVideoPage(metadata, html) {

    debug("Processing video %s", metadata.videoId);
    let retval = null;

    try {
        const urlInfo = parsedet.attributeURL(metadata.href);
        const meta = parsedet.getMetadata(html);
        const related = parsedet.getRelated(html);
        const categories = parsedet.getCategories(html);

        retval = _.extend(metadata, urlInfo, meta, {
            categories,
            related,
            processed: true,
            skipped: false
        });

        stats.success++;

    } catch(error) {
        debug("unacceptable error! [%s] from %s: %s", metadata.href, metadata.clientTime, error);
        stats.error++;
        retval = _.extend(metadata, { processed: false, skipped: false });
    }
    retval.videoParser = true;
    debug("%s %s processed\t%s", retval.href, retval.id, retval.processed);
    return retval;
};


const videoPage = {
    'name': 'videoParser',
    'requirements': {},
    'implementation': parseVideoPage,
    'since': "2018-06-13",
    'until': moment().format('YYYY-MM-DD 23:59:59')
};

return parse.please(videoPage);

