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

var stats = { error: 0, success: 0 };

function parseVideoPage(metadata, html) {

    debug("Processing HTML %s scraped from %s", metadata.id, metadata.href);
    let retval = null;

    try {
        const urlInfo = parsedet.attributeURL(metadata.href);
        retval = _.extend(metadata, urlInfo);
    } catch(error) {
        stats.error++;
        debug("-------------- fail in attributeURL [%s]: %s", metadata.href, metadata.clientTime, error);
        return _.extend(metadata, { processed: false, error: 'attributeURL' });
    }

    try {
        const meta = parsedet.getMetadata(html);
        retval = _.extend(retval, meta);
    } catch(error) {
        stats.error++;
        debug("-------------- fail in getMetadata of [%s]: %s", metadata.href, error);
        return _.extend(metadata, { processed: false, error: 'getMetadata' });
    }

    try {
        const related = parsedet.getRelated(html);
        retval = _.extend(retval, related);
    } catch(error) {
        stats.error++;
        debug("-------------- fail in getRelated [%s]: %s", metadata.href, error);
        return _.extend(metadata, { processed: false, error: 'getRelated' });
    }

    try {
        const categories = parsedet.getCategories(html);
        retval = _.extend(retval, categories);
    } catch(error) {
        stats.error++;
        debug("-------------- fail in getCategories [%s]: %s", metadata.href, error);
        return _.extend(metadata, { processed: false, error: 'getCategories' });
    }

    retval = _.extend(retval, {
        processed: true,
        videoParser: true
    });

    stats.success++;
    debug("OK: %j", stats);
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

