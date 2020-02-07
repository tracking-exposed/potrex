#!/usr/bin/env node
const _ = require('lodash');
const moment = require('moment');
const debug = require('debug')('scripts:potest-1-generator');
const begin = require('debug')('new contributor input:');
const nconf = require('nconf');
const fs = require('fs');

const csv = require('../lib/CSV');
const utils = require('../lib/utils');
const mongo3 = require('../lib/mongo3');

nconf.argv().env().file({ file: 'config/settings.json' });

async function findPlausibleContributor(urlList, filter) {
    /* this function do a distinct of all the publicKey which contributed
     * to the necessary URL, and return a list of potential contributors */
    const mongoc = await mongo3.clientConnect({concurrency: 1});

    let partialf = _.partial(_.intersection);
    for (url of urlList) {
        filter.href = url;
        let k = await mongo3.distinct(mongoc, nconf.get('schema').htmls, 'publicKey', filter);
        debug("by checking htmls per href %s: %d potential contributors", url, _.size(k));
        partialf = _.partial(partialf, k);
    }

    await mongoc.close();
    _.unset(filter, 'href');
    return partialf();
}

async function extractContributions(keys, urlSeq, filter) {

    const mongoc = await mongo3.clientConnect({concurrency: 1});
    const treasure = [];
    for (key of keys) {
        filter.publicKey = key;
        let evidences = await mongo3.read(mongoc, nconf.get('schema').metadata, filter, { savingTime: -1});
        if(_.size(evidences)) {
            begin("processing %d evidence [%s] ",
                _.size(evidences), 
                moment.duration(
                    moment(_.first(evidences).savingTime) -
                    moment(_.last(evidences).savingTime)
                ).humanize() 
            );
        }
        treasure.push(mineSequence(evidences, urlSeq));
    }

    await mongoc.close();

    const retval = _.map(_.flatten(_.flatten(treasure)),
        function(n) {
            if(!_.startsWith(n.thumbnail, 'http'))
                _.unset(n, 'thumbnail');
            return _.omit(n, ['id', 'isVideo', 'version', 'thumbnails' ]);
        });

    const jsonfeatures = _.uniq(_.flatten(_.map(retval, function(evid) {
            return _.map(evid, function(v, k) {
                return k;
            })
        })
    ));

    debug(jsonfeatures);
    const first = _.reduce(jsonfeatures, function(memo, kname) {
        _.set(memo, kname, _.get(_.first(retval), kname, ""));
        return memo;
    }, {});
    /* this is because the CSV generate a number of keys in the first 
     * row, as much as there are in the first object. so we extend the 
     * retval[0] with all the keys, to be sure a default "" whould be there é*/
    _.set(retval, 0, first);
    return retval;
}

function mineSequence(s, urlSeq) {
    const ready = _.reduce(s, function(memo, node) {
        if(node.href == urlSeq[memo.counter]) {
            memo.partial.push(node);
            memo.counter++;
        } else {
            /* debug("not-a-match at position %d collected %d | is [%s] should %s", memo.counter, 
                _.size(memo.partial), node.href, urlSeq[memo.counter]) */
        }
        if(memo.counter  == _.size(urlSeq)) {
            memo.final.push(_.map(memo.partial, function(selectedNode, step) {
                selectedNode.step = step;
                selectedNode.session = memo.session;
                selectedNode.pseudo = utils.string2Food(selectedNode.publicKey);
                selectedNode = _.omit(selectedNode, ['publicKey', '_id' ]);

                let nodes = []
                if(selectedNode.type == 'video' ) {
                    _.each(selectedNode.related, function(r, order) {
                        let unwind = _.extend(r, 
                            selectedNode.producer,
                            _.omit(selectedNode, ['related', 'href', 'title', 'categories', 'views', 'videoId', 'producer']));
                        debugger;
                        unwind.displayOrder = order;
                        unwind.watchedTitle = selectedNode.title;
                        unwind.watchedVideoId = selectedNode.videoId;

                        nodes.push(unwind);
                    });
                }

                if(selectedNode.type == 'home') {
                    _.each(_.filter(selectedNode.sections, null), function(s) {
                        _.each(s.videos, function(v, videoOrder) {
                            let unwind = _.extend(v, 
                                _.omit(selectedNode, ['sections', 'href']));
                            unwind.sectionName = s.display;
                            unwind.sectionHref = s.href;
                            unwind.sectionOrder = s.order;
                            unwind.displayOrder = videoOrder;
                            nodes.push(unwind);
                        })
                    })
                }

                if(selectedNode.type == 'recommended') {
                    _.each(selectedNode.sequence, function(r) {
                        let unwind = _.extend(r, 
                            _.omit(selectedNode, ['sequence', 'href']));
                        unwind.displayOrder = unwind.order;
                        _.unset(unwind, 'order');
                        nodes.push(unwind);
                    });
                }
                return nodes;
            }));
            memo.session++;
            memo.counter = 0;
            memo.partial = [];
        }
        return memo;
    }, { final: [], partial: [], counter: 0, session: 1});
    debug("   + %d (partial %d) counter left at %d session %d session size: %d",
        _.size(ready.final), _.size(ready.partial), ready.counter, ready.session,
        _.size(s));

    if(!_.size(ready.final))
        return [];

    return _.flatten(_.flatten(ready.final));
}

const potcfg = {
    sequence: [
        'https://www.pornhub.com/',
        'https://www.pornhub.com/recommended',
        'https://www.pornhub.com/view_video.php?viewkey=e77c73d25861c37acea8',
        'https://www.pornhub.com/recommended',
        'https://www.pornhub.com/view_video.php?viewkey=ph5e22e4f60abd6',
        'https://www.pornhub.com/',
    ],
    timefilter: {
        'clientTime': {
            "$gte": new Date('2020-01-19 00:00:00'),
            "$lte": new Date('2020-01-20 00:00:00')
        }
    },
    outputf: 'potest1-v2'
};
const TEST_NUMBER = 1;


async function main() {
    debug("Extracting content for potest #%d: %s",
        TEST_NUMBER, JSON.stringify(potcfg, undefined, 2));
    const keys = await findPlausibleContributor(
        _.uniq(potcfg.sequence), potcfg.timefilter);
    debug("Found %d plausible contributors", _.size(keys));
    const result = await extractContributions(keys, potcfg.sequence, potcfg.timefilter);
    debug("Extracted %d complete sequences", _.size(result));
    fs.writeFileSync(potcfg.outputf + '.json', JSON.stringify(result, undefined, 2));
    const csvtext = csv.produceCSVv1(result);
    debug("Produced %d bytes", _.size(csvtext));
    fs.writeFileSync(potcfg.outputf + '.csv', csvtext);
}

try {
    main();
} catch(e) {
    console.log("Error in main()", e.message);
}
