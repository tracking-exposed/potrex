const _ = require('lodash');
const debug = require('debug')('lib:basic');
const nconf = require('nconf');

const mongo = require('./mongo');


/* This api simply return the basic last 69 videos */

function potrexBasic(req) {

    return mongo
        .readLimit(nconf.get('schema').videos, {}, { savingTime: -1}, 69, 0)
        .map(function(e) {
            return _.omit(e, ['_id']);
        })
        .then(function(results) {
            debug("Returning %d videes", _.size(results));
            return { json: results };
        });
};

module.exports = potrexBasic;
