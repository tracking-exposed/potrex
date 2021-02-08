const _ = require('lodash');
const moment = require('moment');
const debug = require('debug')('routes:research');

const params = require('../lib/params');
const automo = require('../lib/automo');
const CSV = require('../lib/CSV');

/* this file implement API developed for research purpose, they might not have any 
 * use outside of Q1-2021 experiments */


async function getVideoCSV(req) {
    // /api/v1/videoCSV/:query/:amount
    const MAXENTRY = 2800;
    const { amount, skip } = params.optionParsing(req.params.paging, MAXENTRY);
    debug("getVideoCSV %s, amount %d skip %d (default %d)", req.params.query, amount, skip, MAXENTRY);
    const byrelated = await automo.getRelatedByVideoId(req.params.query, { amount, skip} );
    const csv = CSV.produceCSVv1(byrelated);
    const filename = 'video-' + req.params.query + "-" + moment().format("YY-MM-DD") + ".csv"
    debug("VideoCSV: produced %d bytes, returning %s", _.size(csv), filename);

    if(!_.size(csv))
        return { text: "Error, Zorry: 🤷" };

    return {
        headers: {
            "Content-Type": "csv/text",
            "Content-Disposition": "attachment; filename=" + filename
        },
        text: csv,
    };
};

async function getByAuthor(req) {
    /* this API do not return the standard format with videos and related inside,
     * but a data format ready for the visualization provided - this has been 
     * temporarly suspended: https://github.com/tracking-exposed/youtube.tracking.exposed/issues/18 */

    const { amount, skip } = params.optionParsing(req.params.paging, PUBLIC_AMOUNT_ELEMS);
    debug("getByAuthor %s amount %d skip %d", req.params.query, amount, skip);

    let authorStruct;
    try {
        authorStruct = await automo.getMetadataFromAuthor({
            videoId: req.params.query
        }, { amount, skip});
    } catch(e) {
        debug("getByAuthor error: %s", e.message);
        return {
            json: {
                error: true,
                message: e.message
            }
        }
    }

    const authorName = authorStruct.authorName;
    debug("getByAuthor returns %d elements from %s",
        _.size(authorStruct.content), authorName);

    const publicFields = ['id', 'title', 'savingTime', 'videoId', 'linkinfo',
        'viewInfo', 'related', 'authorName', 'authorSource', 'publicationString' ];

    const clean = _.map(authorStruct.content, function(e) {
        // id is anonymized in this way, and is still an useful unique id
        e.id = e['id'].substr(0, 20);
        return _.pick(e, publicFields)
    });

    /* first step is separate the three categories and merge infos */
    const sameAuthor = _.map(clean, function(video) {
        return _.map(_.filter(video.related, { source: authorName }), function(r) {
            return {
                watchedTitle: video.title,
                id: video.id + r.videoId,
                savingTime: video.savingTime,
                watchedVideoId: video.videoId,
                relatedVideoId: r.videoId,
                relatedTitle: r.title,
            }
        });
    });

    const foryou = _.map(clean, function(video) {
        return _.map(_.filter(video.related, { foryou: true }), function(r) {
            return {
                watchedTitle: video.title,
                id: video.id + r.videoId,
                savingTime: video.savingTime,
                watchedVideoId: video.videoId,
                relatedVideoId: r.videoId,
                relatedTitle: r.title,
                relatedAuthorName: authorName,
            }
        });
    });

    const treasure = _.map(clean, function(video) {
        debug("byAuthor quick check ø SA %d FY %d T %d (total %d)", 
            _.size(_.filter(video.related, { source: authorName })),
            _.size(_.filter(video.related, { foryou: true })),
            _.size( _.reject( _.reject(video.related, { source: authorName }), { foryou: true })),
            _.size(clean)
        );
        return _.map( _.reject( _.reject(video.related, { source: authorName }), { foryou: true }), function(r) { 
            return {
                id: video.id + r.videoId,
                watchedTitle: video.title,
                watchedVideoId: video.videoId,
                savingTime: video.savingTime,
                relatedVideoId: r.videoId,
                relatedTitle: r.title,
                relatedAuthorName: authorName,
            }
        });
    })

    /* second step to filter them by time (if needed) */
    /* and filter the fields */

    /* this step is group and count */
    const csa = _.groupBy(_.flatten(sameAuthor), 'relatedVideoId');
    const cfy = _.groupBy(_.flatten(foryou), 'relatedVideoId');
    const ct = _.groupBy(_.flatten(treasure), 'relatedVideoId');

    const reduced = {
        sameAuthor: csa,
        foryou: cfy,
        treasure: ct,
    };

    debug("byAuthor [%s], %d evidences, returning %d bytes instead of %d", 
        authorName,
        _.size(authorStruct.content),
        _.size(JSON.stringify(reduced)),
        _.size(JSON.stringify(authorStruct.content))
    );

    return { json: {
        authorName,
        content: reduced,
        authorSource: authorStruct.authorSource,
        paging: authorStruct.paging,
        total: authorStruct.total,
    }};
};

async function getRandomRecent(req) {

    const minutesago = 60 * 24 * 2;
    const maxAmount = 12;
    const lt = moment().subtract(minutesago, 'm');

    const content = await automo.getRandomRecent(new Date(lt.toISOString), maxAmount);
    debug("getRandomRecent: max %d active more then %d minutes, %s",
        maxAmount, minutesago, lt.toISOString());

    const keylist = _.map(content, function(s) {
        s.relative = moment.duration( moment(s.lastActivity) - moment() ).humanize();
        return _.pick(s, ['p', 'publicKey', 'relative']);
    });
    return { json: keylist };
};

function validateKeys(klist) {
     
}

async function researchHome(req) {
    const method = [
        { "HBtwj85xBbpBhH2JrC85JkQ6Wwjqps85NDhjqvZbm269":	1 },
        { "BbWJgn7r9RY66Ta81FxTkBZp5BUZSXLRK2D5jiUyg5w5":	2 },
        { "48jnnhZBB8YiL1Jxoj7dEGZfbQZaz2sUVWAfFv8Sjqr4":	3 },
        { "3c2VSiQvA9M9USH39Vcrhd8bgS13sTpjGCjiTjjdo3Hm":	4 },
        { "5TppRXJWpELBznYWQFTbHniez7MFJVCWB33DC51CpJvj":	5 },
        { "BjSQFkY3Vcv51D4Ls28pYZhQnUBt3qkhyvRXuVTrnzCt":	6 },
        { "E6ZmTHNUqu44ygJLehRaViiJSiUcQJQ6NhAYeGvcgDHq":	7 },
        { "A47vq1ohohHoCVwhkTEYftS4aJ2km1KGfn2C1RGBGcmQ":	8 },
        { "5N3pbGboWWA355gBZRT2y5ex6dSRckG2zuntY8WTtZP6":	9 },
        { "FxecQ6iVn9piumUY7BrGxewN7ykAfUiAGd4yDJAt5vFS":	10 },
        { "BLMLXkByUZwUVych67DriYNtnqi9AvjDycHveP2zinUw":	11 },
        { "H3aF8frTuGp1KoPYWKNnFPTnFpq7hSqP87DSod1vAvoB":	12 },
        { "2m7hoG8moguroX3NwrWox1gtaZJWHWEPqKiupUofmX3d":	13 },
        { "5GBj6eroihe5Qy5YrrvVg6uZq7k4BCrvDoEe9WRUfumV":	14 },
        { "6FwTzraFsx1Hcf1CSmE9qm7Ed9LNYyUR4xSUiHHWvCsm":	15 },
        { "FmXrCoBwP2t6Pf8gHeg4wv7ZpNrV5hzDjv7VtScbrvFN":	16 },
        { "CwrmxQUiq4DvpTcj63VxvabQ14Vu5KoCQaKMPQYiXkUf":   3 },
        { "1PYHyhqJD1V6baGktNTVhkTgXdpW6UBNhbq5duiMT6Y":    4 },
        { "5zuMxNj2w5ja1KgdJCa9yj11xuVMahnWirpFVK26q4tB":   9 },
        { "6zU5x5YoqipLnHrmiZ3y9YDVguAszQJZHJ8UFYh23L6t":   10 },
        { "7YJyHav9qDZohgt8SGjr3M2pNi1DYnAze5TbmDmPdsiQ":   11 },
        { "FU6eLaMjXsJfdwPF6Kb6Qoz5qDunUvTn38G4LqWPJyC9":   12 }
    ]
    const keys = _.keys(method);
    const homes = await automo.getArbitrary({ type: 'home', publicKey: { "$in": keys } }, 5000, 0);
    const clean = _.map(homes, function(h) {
        _.unset(h, '_id');
        h.suppseudo = h.publicKey.substr(0, 6);
        h.who = method[h.publicKey];
        _.unset(h, 'publicKey');
        return h;
    });
    debug("researchHomes: return %d elements", _.size(clean));
    return { json: clean};
}

async function researchHomeCSV(req) {

    const json = await researchHome(req);

    const csv = CSV.produceCSVv1(json.data);
    const filename = 'research-homes-' + _.size(json.data) + "-" + moment().format("YYYY-MM-DD") + ".csv";

    debug("researchHomeCSV: produced %d bytes from %d homes %d videos, returning %s",
        _.size(csv), homes.length, _.size(nodes), filename);

    if(!_.size(csv))
        return { text: "Error: no CSV generated 🤷" };

    return {
        headers: {
            "Content-Type": "csv/text",
            "Content-Disposition": "attachment; filename=" + filename
        },
        text: csv,
    };
}

module.exports = {
    researchHome,
    researchHomeCSV,
};
