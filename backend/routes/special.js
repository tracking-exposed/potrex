const _ = require('lodash');
const moment = require('moment');
const debug = require('debug')('routes:special');
const nconf = require('nconf');

const CSV = require('../lib/CSV');
const mongo3 = require('../lib/mongo3');

async function recommendedCategoryAnalysis(contribFilter) {
    // this function returns only the name of the 'sections'
    // and the video title + author + categories associated
    // it return it aggregated by YYYY-MM-DD

    const mongoc = await mongo3.clientConnect({concurrency: 1});

    const homedata = await mongo3.aggregate(mongoc, nconf.get('schema').metadata, [
        { $match: { ...contribFilter, type:'home' } },
        { $unwind: "$sections" },
        { $unwind: "$sections.videos" },
        { $lookup: {
            from: 'categories',
            localField: "sections.videos.videoId",
            foreignField: 'videoId',
            as: 'categories'
        } }
    ]);

    await mongoc.close();

    const ready = _.compact(_.map(homedata, function(metae) {

        if(!_.startsWith(metae.sections.display, "Recommended Cat") &&
            metae.sections.display !== "Recommended For You")
            return null;

        return {
            savingTime: metae.savingTime,
            sectionName: metae.sections.display,
            publicKey: metae.publicKey,
            profileStory: metae.profileStory === -1 ? 0: metae.profileStory,
            pornHubHentai:
                 _.map(metae?.categories[0]?.categories, 'name').indexOf('Hentai') !== -1,
            categories: _.map(metae?.categories[0]?.categories, 'name').join(","),
            videoTitle: metae.sections.videos.title,
            authorName: metae.sections.videos.authorName,
            authorLink: "https://www.pornhub.com" + metae.sections.videos.authorLink,
            id: metae.id,
        }
    }));

    // console.table(ready);
    const csv = CSV.produceCSVv1(ready);
     return {
        headers: {
            "Content-Type": "csv/text",
            "Content-Disposition": "attachment; filename=" + ("vids_" + ready.length + "_" + csv.length + ".csv")
        },
        text: csv,
    };
    // const grouped = _.groupBy(ready, 'day');
    return { json: ready };
};

async function special(req) {
    const analysis = req.params.analysis;
    const allow = ['recommended-category', 'for-you', 'all'];

    const keys = req.params.publicKey.split(',');
    debug("found %d keys as parameters", keys.length);
    const filter = {"$in": keys };
    try {
        const retval = await recommendedCategoryAnalysis({ publicKey: filter });
        return retval;
    } catch(error) {
        debug("Error in special: %s", error.message);
        console.log(error.stack);
        return { "text": error.message };
    }
};

module.exports = {
    special,
};
