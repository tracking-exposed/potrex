const _ = require('lodash');
const debug = require('debug')('parser:search');

const shared = require('./shared');

function search(envelop, previous) {

    if(previous.nature.type !== "search")
        return false;

    let retval = shared.getFeatured(envelop.jsdom);
    return { results: retval };
};

module.exports = search;