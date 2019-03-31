const _ = require('lodash');
const debug = require('debug')('lib:basic');
const nconf = require('nconf');
const Promise = require('bluebird');

const mongo = require('./mongo');


/* This api simply return the basic last 69 videos */
function all(req) {
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

function selected(req) {
    const pseudo = req.params.pseudo;
    debug("Requested video selection for %s", pseudo);
    return mongo
        .readLimit(nconf.get('schema').videos, {p: pseudo}, { savingTime: -1}, 69, 0)
        .map(function(e) {
            return _.omit(e, ['_id']);
        })
        .then(function(results) {
            debug("Returning %d videes", _.size(results));
            return { json: results };
        });
};

function radar(req) {
    let a, b;
    try {
        const expectedtwo = req.params.pseudos;
        a = expectedtwo.split(',')[0];
        b = expectedtwo.split(',')[1];
    } catch(error) { }

    if(!a || !b) {
        debug("Lack of the proper parameters");
        return { json: {
            success: false,
            message: "error, it is necessary this format: /api/v1/radar/user-pseudo-first,other-user-pseudo" 
        }};
    }

    return Promise.all([
        mongo.readLimit(nconf.get('schema').videos, {p: a}, { savingTime: -1}, 69, 0),
        mongo.readLimit(nconf.get('schema').videos, {p: b}, { savingTime: -1}, 69, 0)
    ])
    .then(function(mix) {

        if(_.size(mix[0]) < 2 || _.size(mix[1]) < 2)
            throw new Error("Not enough videos associated to one of the two pseudonymis");

        const results = {};
        results.pseudos = [ mix[0].p, mix[1].p ];

        let catfirst = _.flatten(_.map(mix[0], 'categories'));
        let catsecond = _.flatten(_.map(mix[1], 'categories'));
        let categories = _.concat(catfirst, catsecond);

        results.list = _.reverse(_.sortBy(_.map(_.countBy(categories), function(c, n) { return { c, n, } }), 'c'));

        let considered = _.map(_.take(results.list, 20), 'n');

        results.tops = [];
        results.tops[0] = _.map(considered, function(cat) {
            let ref = _.countBy(catfirst);
            let amount = _.get(ref, cat, 0);
            let value = _.round(_.size(mix[0]) / amount, 2);
            return {
                axis: cat,
                value
            };
        });

        results.tops[1] = _.map(considered, function(cat) {
            let ref = _.countBy(catsecond);
            let amount = _.get(ref, cat, 0);
            let value = _.round(_.size(mix[1]) / amount, 2);
            return {
                axis: cat,
                value
            };
        });

        /* results contains 'list', 'pseudos', 'tops' */
        return { json: results };
    })
    .catch(function(error) {
        return { json: {
            success: false,
            message: error.message
        }};
    });
};


module.exports = {
    all: all,
    selected: selected,
    radar: radar,
};
