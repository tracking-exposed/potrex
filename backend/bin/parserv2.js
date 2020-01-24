#!/usr/bin/env node
const _ = require('lodash');
const moment = require('moment');
const debug = require('debug')('bin:parse2');
const nconf = require('nconf');
const JSDOM = require('jsdom').JSDOM;

const pagesparser = require('../parsers/pages')
const automo = require('../lib/automo')
const downloader = require('../parsers/downloader');

nconf.argv().env().file({ file: 'config/settings.json' });

/* const echoes = require('../lib/echoes');
echoes.addEcho("elasticsearch");
echoes.setDefaultEcho("elasticsearch"); */

const FREQUENCY = _.parseInt(nconf.get('frequency')) ? _.parseInt(nconf.get('frequency')) : 10;
const backInTime = _.parseInt(nconf.get('minutesago')) ? _.parseInt(nconf.get('minutesago')) : 10;
const id = nconf.get('id');
let singleUse = !!nconf.get('single');
let nodatacounter = 0;
let lastExecution = moment().subtract(backInTime, 'minutes').toISOString();
let computedFrequency = FREQUENCY;

if(backInTime != 10) {
    const humanized = moment.duration(
        moment().subtract(backInTime, 'minutes') - moment()
    ).humanize();
    console.log(`Considering ${backInTime} minutes (${humanized}), as override the standard 10 minutes ${lastExecution}`);
}

async function newLoop() {
    let repeat = !!nconf.get('repeat');
    let htmlFilter = {
        savingTime: {
            $gt: new Date(lastExecution)
        },
    };
    htmlFilter.processed = { $exists: repeat };

    if(!!nconf.get('fix')) {
        debug("parser fixing request!");
        htmlFilter.processed = false;
    }

    if(id) {
        debug("Targeting a specific metadataId imply --single");
        htmlFilter = {
            metadataId: id
        }
        singleUse = true;
    }

    const htmls = await automo.getLastHTMLs(htmlFilter);
    if(!_.size(htmls.content)) {
        nodatacounter++;
        if( (nodatacounter % 10) == 1) {
            debug("%d no data at the last query: %j",
                nodatacounter, htmlFilter);
        }
        lastExecution = moment().subtract(2, 'm').toISOString();
        computedFrequency = FREQUENCY;
        return;
    } else {
        computedFrequency = 0.5;
    }

    if(!htmls.overflow) {
        lastExecution = moment().subtract(2, 'm').toISOString();
        debug("[%s] Matching objects %d, overflow %s",
            moment.duration(htmls.content[0].savingTime).humanize(),
            _.size(htmls.content), htmls.overflow);
    }
    else {
        lastExecution = moment(_.last(htmls.content).savingTime);
        debug("OVERFLOW: first %s last %s - lastExecution %s",
            _.first(htmls.content).savingTime, _.last(htmls.content).savingTime,
            lastExecution);
    }

    const analysis = _.map(htmls.content, function(e) {
        const envelop = {
            impression: e,
            jsdom: new JSDOM(e.html.replace(/\n\ +/g, '')).window.document,
        }

        let metadata = null;
        try {
            debug("id %s [%s] %s %d.%d %s %s",
                e.id.substr(0, 6),
                moment(e.savingTime).format("DD/MMM HH:mm:ss"),
                e.metadataId,
                e.packet, e.incremental,
                e.size, e.selector);

            if(e.selector == "body") {
                metadata = pagesparser.page(envelop);
            }
            else {
                console.log("Selector not supported!", e.selector);
                return null;
            }

            if(!metadata) {
                debug("Unexpected condition! metadata should never be null or undefined");
                return null;
            }

            if(metadata.processed == false) // no debug line because is there from parsers/video.js
                return null;

        } catch(error) {
            debug("Error in video processing: %s (%s)",
                _.pullAt(error.stack.replace(/\ \ /, '').split('\n'), [0, 1, 2])
                 .join('\n'), e.selector);
            return null;
        }

        return [ envelop.impression, metadata ];
    });


    for (const entry of _.compact(analysis)) {
        if(entry.type == 'video')
            await downloader.update(entry);
    }

    const updates = [];
    for (const entry of _.compact(analysis)) {
        let r = await automo.updateMetadata(entry[0], entry[1]);
        updates.push(r);
    }
    debug(_.countBy(updates, 'what'));

    /* reset no-data-counter if data has been sucessfully processed */
    if(_.size(_.compact(analysis)))
        nodatacounter = 0;

    /* also the HTML cutted off the pipeline, the many skipped
     * by _.compact all the null in the lists, should be marked as processed */
    const remaining = _.reduce(_.compact(analysis), function(memo, blob) {
        return _.reject(memo, { id: blob[0].id });
    }, htmls.content);

    debug("Usable HTMLs %d/%d - marking as processed the useless %d HTMLs",
        _.size(_.compact(analysis)), _.size(htmls.content), _.size(remaining));

    await automo.markHTMLsUnprocessable(remaining);
}

function sleep(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms)
    })
}

async function wrapperLoop() {
    while(true) {
        await newLoop();
        if(singleUse) {
            console.log("Single execution done!")
            process.exit(0);
        }
        await sleep(computedFrequency * 1000)
    }
}

try {
    wrapperLoop();
} catch(e) {
    console.log("Error in newLoop", e.message);
}
