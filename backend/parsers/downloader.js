const _ = require('lodash');
const nconf = require('nconf');
const debug = require('debug')('parsers:downloader');
const fetch = require('node-fetch');
const path = require('path');
const fs = require('fs');

const utils = require('../lib/utils');
const mongo3 = require('../lib/mongo3');

nconf.argv().env().file({ file: 'config/settings.json' });

async function checkDuplicates(mongoc, listof, dbColumn) {
    const redo = !!nconf.get('redo');
    const unexistent = [];
    for (const t of listof) {
        const exists = await mongo3.count(mongoc, dbColumn, { id: t.id });
        if(exists == 0 || (exists == 1 && redo) )
            unexistent.push(t);
        else if(exists == 1) {
            // debug("Duplicated %s %s", dbColumn, t.id)
            return;
        }
        else
            debug("absurd error! (do you forget the unique index too?)");
    }
    debug("returning %s - %d", dbColumn, _.size(unexistent));
    return unexistent;
}

async function fetchContent(mongoc, listof, dbColumn, storage) {
    for (const d of listof) {
        debug("Connecting to fetch: %s", d.url);
        let response = await fetch(d.url);
        d.destpath = path.join(storage, d.id + '.raw');
        let c = await response.buffer();
        console.log(c);
        debugger;
        fs.writeFileSync(d.destpath, c);
        d.headers = response.headers.raw();
        debug("Written file %s -> %s", d.destpath, d.rtitle);
        await mongo3.upsertOne(mongoc, dbColumn, {id: d.id}, d);
    }
}

async function update(metadata) {

    if(!nconf.get('storagethumb') || !nconf.get('storagertrvd')) {
        debug("Storage not configured, downloader.update disabled");
        return null;
    }

    const thumbnails = _.compact(_.map(metadata.related, function(r) {
        if(_.startsWith(r.thumbnail, 'data:image'))
            return null;

        return {
            id: utils.hash({ url: r.thumbnail, type: 'thumbnail' }),
            url: r.thumbnail,
            metadataId: metadata.id,
            rtitle: r.title,
            savingTime: new Date()
        };
    }));

    const relatedvids = _.map(metadata.related, function(r) {
        return {
            id: utils.hash({ url: r.href, type: 'related' }),
            url: 'http://www.pornhub.com' + r.href,
            metadataId: metadata.id,
            rtitle: r.title,
            savingTime: new Date()
        };
    });

    const mongoc = await mongo3.clientConnect({concurrency: 1});

    /* check in the DB if the ID exists */
    const downloadablet = await checkDuplicates(mongoc, thumbnails, nconf.get('schema').thumbnails);
    const downloadablev = await checkDuplicates(mongoc, relatedvids, nconf.get('schema').retrieved);

    debug("%s (%s)-> retrive: %d (videos) from %d, %d (thumbnails) %d", 
            metadata.id, metadata.title,
            _.size(downloadablev), _.size(relatedvids),
            _.size(downloadablet), _.size(thumbnails) );

    if(_.size(downloadablet))
        await fetchContent(mongoc, downloadablet,
            nconf.get('schema').thumbnails, nconf.get('storagethumb') );

    if(_.size(downloadablev))
        await fetchContent(mongoc, downloadablev,
            nconf.get('schema').retrieved, nconf.get('storagertrvd') );

    mongoc.close();
    return ( _.size(downloadablev) + _.size(downloadablet) );
}

module.exports = {
    update
}
