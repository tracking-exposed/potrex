const _ = require('lodash');
const nconf = require('nconf');
const debug = require('debug')('parsers:downloader');
const moment = require('moment');
const fetch = require('node-fetch');
const fs = require('fs');

const utils = require('../lib/utils');
const mongo3 = require('../lib/mongo3');

nconf.argv().env().file({ file: 'config/settings.json' });

async function checkDuplicates(mongoc, listof, dbColumn) {
    const unexistent = [];
    for (const t of listof) {
        const exists = await mongo3.count(mongoc, nconf.get('schema')[dbColumn], { id: t.id });
        if(exists == 1)
            return;
        else if(exists == 0)
            unexistent.push(t);
        else
            debug("fatal error! (do you forget the index?)");
    }
    debug("returning %s - %d", dbColumn, _.size(unexistent));
    return unexistent;
}

async function fetchContent(mongoc, listof, dbColumn, storage) {
    for (const d of listof) {
        debug("Connecting to fetch: %s", d.url);

        await fetch(d.url)
            .then(function(response) {
                return [ response.buffer(), response.headers.raw() ];
            })
            .then(function(response) {
                d.destpath = nconf.get(storage) + '/' + d.id + '.raw';
                fs.writeFileSync(d.destpath, response[0]);
                d.headers = response[1];

                return mongo3.writeOne(mongoc, nconf.get('schema')[dbColumn], d);
            })
            .catch(function(e) {
                debug("Error in fetch %s: %s", d.url, e.message);
            });
    }
}

async function update(metadata) {

    const thumbnails = _.compact(_.map(metadata[1].related, function(r) {
        if(_.startsWith(r.thumbnail, 'data:image'))
            return null;

        return {
            id: utils.hash({ url: r.thumbnail, type: 'thumbnail' }),
            url: r.thumbnail,
            metadataId: metadata[1].id,
            savingTime: new Date()
        };
    }));

    const relatedvids = _.map(metadata[1].related, function(r) {
        return {
            id: utils.hash({ url: r.href, type: 'related' }),
            url: 'http://www.pornhub.com' + r.href,
            metadataId: metadata[1].id,
            savingTime: new Date()
        };
    });

    const mongoc = await mongo3.clientConnect({concurrency: 1});

    /* check in the DB if the ID exists */
    const downloadablet = await checkDuplicates(mongoc, thumbnails, 'thumbnails');
    const downloadablev = await checkDuplicates(mongoc, relatedvids, 'retrieved');

    debug("%s (%s) retrive: %d (videos), %d (thumbnails)", 
            metadata[1].id,
            metadata[1].title,
        _.size(downloadablev), _.size(downloadablet) );

    if(_.size(downloadablet))
        await fetchContent(mongoc, downloadablet, 'thumbnails', 'pictures');

    if(_.size(downloadablev))
        await fetchContent(mongoc, downloadablev, 'retrieved', 'htmls');

    mongoc.close();
    return ( _.size(downloadablev) + _.size(downloadablet) );
}

module.exports = {
    update
}
