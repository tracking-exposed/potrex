const _ = require('lodash');
const nconf = require("nconf");
const debug = require('debug')('parsers:categorizer');
const { JSDOM } = require("jsdom");

const mongo3 = require('../lib/mongo3');
const shared = require('./shared');

async function attemptCatInfo(mongoc, videoId) {

    let cinfo = await mongo3.readOne(mongoc,
        nconf.get('schema').categories, { videoId });

    if(!cinfo) {
        const e = await mongo3.readOne(mongoc,
            nconf.get('schema').retrieved, { videoId });
        const dom = new JSDOM(e.html).window.document;
        const t = shared.getCategories(dom);
        cinfo = await mongo3.writeOne(mongoc, nconf.get('schema').categories, {
            videoId,
            categories: t,
            when: new Date()
        });
    }
    return cinfo;
}

async function categorize(envelop, previous) {

    if(previous.nature.type !== 'home') return false;

    const mongoc = await mongo3.clientConnect({concurrency: 1});
    const catinfo = [];

    for(section of previous.home.sections) {
        for(video of section.videos) {
            try {
                const cinfo = await attemptCatInfo(mongoc, video.videoId);
                catinfo.push(cinfo);
            } catch(error) {
                debug("Unacceptable error in categorize: %s", error.message);
            }
        }
    }

    await mongoc.close();
    return catinfo;
};

module.exports = categorize;