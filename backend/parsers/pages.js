const _ = require('lodash');
const nconf = require("nconf");
const debug = require('debug')('parser:video');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const parsedet = require('../lib/parsedetails');

const stats = { skipped: 0, error: 0, suberror: 0, success: 0 };
nconf.argv().env().file({ file: "config/settings.json" });

function page(envelop) {

    let retval = _.omit(envelop.impression, ['html', '_id']);
    const dom = new JSDOM(envelop.impression.html);
    const D = dom.window.document;

    debug("[K %d] Processing HTML %s scraped from %s", 
        _.size(_.keys(retval)), retval.id, retval.href);

    /* the first check look at the URL and figure out if we're home or video */
    try {
        const urlInfo = parsedet.attributeURL(retval.href);
        retval = _.extend(retval, urlInfo);
        debug("Added %d keys from attributeURL, total %d",
            _.size(_.keys(urlInfo)), _.size(_.keys(retval)));
    } catch(error) {
        stats.error++;
        debug("-------------- fail in attributeURL [%s]: %s", retval.href, retval.clientTime, error);
        return _.extend(retval, { processed: false, error: 'attributeURL' });
    }

    if(retval.type == 'home') {
        try {
            const featured = parsedet.getFeatured(D);
            retval = _.extend(retval, featured);
            debug("Added %d 'sections' from getFeatured in homepage", _.size(featured.sections));
            retval.processed = true;
            stats.success++;
        } catch(error) {
            stats.error++;
            debug("-------------- fail in getFeatured of [%s]: %s", retval.href, error);
            return _.extend(retval, { processed: false, error: 'getFeatured' });
        }
        return retval;
    } else if(retval.type == 'recommended') {
        try {
            const sequence = parsedet.getSequence(D);
            retval = _.extend(retval, { sequence });
            debug("Added %d 'sequence' from getSequence in recommended", _.size(sequence));
            retval.processed = true;
            stats.success++;
        } catch(error) {
            stats.error++;
            debug("-------------- fail in getSequence of [%s]: %s", retval.href, error);
            return _.extend(retval, { processed: false, error: 'getSequence' });
        }
        return retval;
    } else if(retval.type != 'video')
        throw new Error("Unrecognized content type from URL " + retval.href);

    /* else, video has a sequence of function for scraping */
    try {
        const meta = parsedet.getMetadata(D);
        retval = _.extend(retval, meta);
        debug("Added %d keys from getMetadata, total %d",
            _.size(_.keys(meta)), _.size(_.keys(retval)));
    } catch(error) {
        stats.error++;
        debug("-------------- fail in getMetadata of [%s]: %s", retval.href, error);
        return _.extend(retval, { processed: false, error: 'getMetadata' });
    }

    try {
        const related = parsedet.getRelated(D);
        retval = _.extend(retval, related);
        debug("Added %d keys from getRelated, total %d, related = %d",
            _.size(_.keys(related)), _.size(_.keys(retval)), _.size(related.related) );
    } catch(error) {
        stats.error++;
        debug("-------------- fail in getRelated [%s]: %s", retval.href, error);
        return _.extend(retval, { processed: false, error: 'getRelated' });
    }

    try {
        const categories = parsedet.getCategories(D);
        retval = _.extend(retval, categories);
        debug("Added %d keys from getCategories, total %d, categories = %d",
            _.size(_.keys(categories)), _.size(_.keys(retval)), _.size(categories.categories) );
    } catch(error) {
        stats.error++;
        debug("-------------- fail in getCategories [%s]: %s", retval.href, error);
        return _.extend(retval, { processed: false, error: 'getCategories' });
    }

    retval.processed = true;

    stats.success++;
    return retval;
};


module.exports = {
    page,
};
