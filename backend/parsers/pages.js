const _ = require('lodash');
const nconf = require("nconf");
const moment = require("moment");
const debug = require('debug')('parser:video');

const parsedet = require('../lib/parsedetails');

const stats = { skipped: 0, error: 0, suberror: 0, success: 0 };
nconf.argv().env().file({ file: "config/settings.json" });

function page(envelop) {

    let retval = _.omit(envelop.impression, ['html', '_id']);

    debug("[K %d] Processing HTML %s scraped from %s", 
        _.size(_.keys(retval)), retval.id, retval.href);

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
            const featured = parsedet.getFeatured(envelop.impression.html);
            retval = _.extend(retval, featured);
            debug("Added %d keys from getFeatured in homepage, total %d",
                _.size(_.keys(featured)), _.size(_.keys(retval)));
            retval.processed = true;
        } catch(error) {
            stats.error++;
            debug("-------------- fail in getFeatured of [%s]: %s", retval.href, error);
            return _.extend(retval, { processed: false, error: 'getFeatured' });
        }
        return retval;
    }

    /* else, we are in type = video ... */
    try {
        const meta = parsedet.getMetadata(envelop.impression.html);
        retval = _.extend(retval, meta);
        debug("Added %d keys from getMetadata , total %d",
            _.size(_.keys(meta)), _.size(_.keys(retval)));
    } catch(error) {
        stats.error++;
        debug("-------------- fail in getMetadata of [%s]: %s", retval.href, error);
        return _.extend(retval, { processed: false, error: 'getMetadata' });
    }

    try {
        const related = parsedet.getRelated(envelop.impression.html);
        retval = _.extend(retval, related);
        debug("Added %d keys from getRelated, total %d, related = %d",
            _.size(_.keys(related)), _.size(_.keys(retval)), _.size(related.related) );
    } catch(error) {
        stats.error++;
        debug("-------------- fail in getRelated [%s]: %s", retval.href, error);
        return _.extend(retval, { processed: false, error: 'getRelated' });
    }

    try {
        const categories = parsedet.getCategories(envelop.impression.html);
        retval = _.extend(retval, categories);
        debug("Added %d keys from getCategories, total %d, categories = %d",
            _.size(_.keys(categories)), _.size(_.keys(retval)), _.size(categories.categories) );
    } catch(error) {
        stats.error++;
        debug("-------------- fail in getCategories [%s]: %s", retval.href, error);
        return _.extend(retval, { processed: false, error: 'getCategories' });
    }

    retval = _.extend(retval, {
        processed: true,
        videoParser: true
    });

    stats.success++;
    return retval;
};


module.exports = {
    page,
};