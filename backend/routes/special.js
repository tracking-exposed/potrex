const _ = require('lodash');
const moment = require('moment');
const debug = require('debug')('routes:special');
const nconf = require('nconf');

const CSV = require('../lib/CSV');
const mongo3 = require('../lib/mongo3');

/*
function fixHomeSimply(e) {
    let v = _.get(e, 'sections.videos');
    v.sectionName = e.sections.display;
    v.sectionHref = e.sections.href;
    v.sectionOrder = e.sections.order;
    v.profileStory = e.profileStory;
    v.savingTime = new Date(e.savingTime);
    try {
        v.categories = _.map(_.first(e.categories).categories, 'name');
    } catch(error) {
        debug("Error in accessing categories: %s", error.message);
        v.categories = [ "error-investigate" ];
    }
    v.site = e.site;
    return v;
}

function unNestHome(memo, metadata) {
    const nested = _.map(metadata.sections || [], function(section) {
        return _.map(section ? section.videos || [] : [], function(video, o) {
            return _.extend(video, {
                sectionOrder: section.order + 1,
                sectionName: section.display,
                sectionHref: section.href,
                videoOrder: o + 1,
                metadataId: metadata.id,
                site: metadata.site,
                publicKey: metadata.publicKey,
                suppseudo: metadata.publicKey.substr(0, 6),
                profileStory: metadata.profileStory,
                savingTime: metadata.savingTime,
            });
        })
    });
    return _.concat(memo, _.flatten(nested));
}

function unNestQuery(memo, metadata) {
    // remind self, search query without result have a 'reason' for not having a 
    // * result, but they are not technically 'videos' 
    const unnested = _.map(metadata.results, function(video, o) {
        return _.extend(video, {
            query: metadata.params.query,
            page: metadata.params.page,
            href: metadata.href,
            relatedN: _.size(metadata.related),
            videoOrder: o + 1,
            metadataId: metadata.id,
            site: metadata.site,
            publicKey: metadata.publicKey,
            suppseudo: metadata.publicKey.substr(0, 6),
            profileStory: metadata.profileStory,
            savingTime: metadata.savingTime,
            related: metadata.related,
            reason: metadata.reason,
        });
    });
    if(!metadata.results.length) {
        // this happens with reason = 'no results for this query' || 'banned query'
        debug("A dummy video-entry for search query results: %s", metadata.reason)
        unnested.push({
            query: metadata.params.query,
            page: metadata.params.page,
            href: metadata.href,
            relatedN: 0,
            metadataId: metadata.id,
            site: metadata.site,
            publicKey: metadata.publicKey,
            suppseudo: metadata.publicKey.substr(0, 6),
            profileStory: metadata.profileStory,
            savingTime: metadata.savingTime,
            reason: metadata.reason,
        })
    }
    return _.concat(memo, unnested);
}
*/

async function recommendedCategoryAnalysis(publicKey) {
    // this function returns only the name of the 'sections'
    // and the video title + author + categories associated
    // it return it aggregated by YYYY-MM-DD

    const mongoc = await mongo3.clientConnect({concurrency: 1});

    const homedata = await mongo3.aggregate(mongoc, nconf.get('schema').metadata, [
        { $match: { ...publicKey, type:'home' } },
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
        if(_.startsWith(metae.sections.display, "Recommended Cat")) {
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
        }

        if(metae.sections.display !== "Recommended For You")
            return null;

        return {
            savingTime: metae.savingTime,
            sectionName: metae.sections.display,
            // Recommended For You
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

    console.table(ready); /*
    const csv = CSV.produceCSVv1(ready);
     return {
        headers: {
            "Content-Type": "csv/text",
            "Content-Disposition": "attachment; filename=" + ("RAW_" + ready.length + "_" + csv.length + ".csv")
        },
        text: csv,
    }; */
    // const grouped = _.groupBy(ready, 'day');
    return { json: ready };
};

async function special(req) {
    const analysis = req.params.analysis;
    const allow = ['recommended-category']

    const k = req.params.publicKey;
    if(analysis === allow[0])
        return await recommendedCategoryAnalysis({ publicKey: k });
    else
        return { 'text': "Error, only allow: " + allow }
};

module.exports = {
    special,
};
