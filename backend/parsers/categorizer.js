const _ = require('lodash');
const nconf = require("nconf");
const debug = require('debug')('parsers:categorizer');
const { JSDOM } = require("jsdom");

const mongo3 = require('../lib/mongo3');
const shared = require('./shared');

async function categorize(envelop, previous) {

    if(previous.nature.type !== 'home') return false;

    const mongoc = await mongo3.clientConnect({concurrency: 1});
    const catinfo = [];

    for(section of previous.home.sections) {
        for(video of section.videos) {

            let cinfo = await mongo3.readOne(mongoc,
                nconf.get('schema').categories, { videoId: video.videoId });

            if(!cinfo) {
                const e = await mongo3.readOne(mongoc,
                    nconf.get('schema').retrieved, { videoId: video.videoId });
                const dom = new JSDOM(e.html).window.document;
                const t = shared.getCategories(dom);
                cinfo = await mongo3.writeOne(mongoc, nconf.get('schema').categories, {
                    videoId: video.videoId,
                    categories: t,
                    when: new Date()
                });
            }
            catinfo.push(cinfo);
        }
    }

    await mongoc.close();
    return catinfo;
};

module.exports = categorize;