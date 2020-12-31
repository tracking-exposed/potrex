const _ = require('lodash');
const nconf = require("nconf");
const debug = require('debug')('parsers:home');
const shared = require('./shared');

function home(envelop, previous) {

    if(previous.nature.type !== "home")
        return false;

    const featured = shared.getFeatured(envelop.jsdom);
    return featured;
};

module.exports = home;
