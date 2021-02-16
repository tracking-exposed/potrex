const _ = require('lodash');
const moment = require('moment');
const debug = require('debug')('routes:research');
const nconf = require('nconf');

const automo = require('../lib/automo');
const mongo3 = require('../lib/mongo3');
const CSV = require('../lib/CSV');
const personal = require('./personal');

const collectedErrors = [];
async function researchErrors() {
    return {
        json: collectedErrors
    }
}
function addToErrors(celem) {
    if(!_.find(collectedErrors, { name: celem.name })) {
        debug("%d registering error — %j", collectedErrors.length, celem);
        collectedErrors.push(celem);
    }
}
/* this file implement API developed for research purpose, they might not have any 
 * use outside of Q1-2021 experiments */

async function researchHome(req) {

    const method = { 
        //"HBtwj85xBbpBhH2JrC85JkQ6Wwjqps85NDhjqvZbm269": 1,
        //"BbWJgn7r9RY66Ta81FxTkBZp5BUZSXLRK2D5jiUyg5w5": 2,
        //"48jnnhZBB8YiL1Jxoj7dEGZfbQZaz2sUVWAfFv8Sjqr4": 3,
        //"3c2VSiQvA9M9USH39Vcrhd8bgS13sTpjGCjiTjjdo3Hm": 4,
        //"5TppRXJWpELBznYWQFTbHniez7MFJVCWB33DC51CpJvj": 5,
        //"BjSQFkY3Vcv51D4Ls28pYZhQnUBt3qkhyvRXuVTrnzCt": 6,
        //"E6ZmTHNUqu44ygJLehRaViiJSiUcQJQ6NhAYeGvcgDHq": 7,
        //"A47vq1ohohHoCVwhkTEYftS4aJ2km1KGfn2C1RGBGcmQ": 8,
        //"5N3pbGboWWA355gBZRT2y5ex6dSRckG2zuntY8WTtZP6": 9,
        //"FxecQ6iVn9piumUY7BrGxewN7ykAfUiAGd4yDJAt5vFS": 10,
        //"BLMLXkByUZwUVych67DriYNtnqi9AvjDycHveP2zinUw": 11,
        //"H3aF8frTuGp1KoPYWKNnFPTnFpq7hSqP87DSod1vAvoB": 12,
        //"2m7hoG8moguroX3NwrWox1gtaZJWHWEPqKiupUofmX3d": 13,
        //"5GBj6eroihe5Qy5YrrvVg6uZq7k4BCrvDoEe9WRUfumV": 14,
        //"6FwTzraFsx1Hcf1CSmE9qm7Ed9LNYyUR4xSUiHHWvCsm": 15,
        //"FmXrCoBwP2t6Pf8gHeg4wv7ZpNrV5hzDjv7VtScbrvFN": 16,
        "CwrmxQUiq4DvpTcj63VxvabQ14Vu5KoCQaKMPQYiXkUf": 3,
        "1PYHyhqJD1V6baGktNTVhkTgXdpW6UBNhbq5duiMT6Y":  4,
        "5zuMxNj2w5ja1KgdJCa9yj11xuVMahnWirpFVK26q4tB": 9,
        "6zU5x5YoqipLnHrmiZ3y9YDVguAszQJZHJ8UFYh23L6t": 10,
        "7YJyHav9qDZohgt8SGjr3M2pNi1DYnAze5TbmDmPdsiQ": 11,
        "FU6eLaMjXsJfdwPF6Kb6Qoz5qDunUvTn38G4LqWPJyC9": 12,
        "AcCGvjbJtbJCum5ihscTRvNGLVaFhaDufqNHpbaoLTJH": 1, //new 12/2
        "CqajNTFmhjPRCkqHaRAb4VRFGbrYpJ19sBa4QuPFKKHk": 2,
        "H3YodFrLnpntpkc1X9pBuVDp6nmGjZXwtvYkZYQpy1Jv": 3,
        "7q5ppjHTGPWMTttK1QVNyZhcEBeguCrHmgVgAcExnr5h": 5,
        "5gpJp5VQiiWme5Ba3mWKKwGkLGtRSHxAZqw9gtDQCwFN": 6,
        "8wqWU7wUGgedVr2cdS9y9n3j9UYGbAZ1tJhwPXncvL3u": 7,
        "92QufgUFDqEVNnwQwyfgQWPHYDmAeNibdEWQhEZC99kN": 8,
        "6q8FLNaLNyF7WvQXK1JNuNuuNFHd3VDMeJvBd8de4158": 9,
        "E31uv1gHW8YeSdhvxtWu9qxsLAkvD5eMBu4pqQ5PeimU": 10,
        "7XjnMBex6xv3s4iHRTp3DwhCNpYqqdPwwHUPsh5diQqe": 16,
        "GEdipELdQeX57CKAUJYAfdE1VvZ7oDNigrdhkJzKh4bT": 4,
        "QWEF4A1QP2tYBXf7gJK2wUgQHqPbdLqofYYUUW2R17h": 11,
        "CD2WZENFGdywinSNNRGPYDhQgMgiVdR9B3dKMNDrkMxf": 12,
        "DTSckWRvhZwFbNCNT5QdKBjDtLxXANVNMbfV7fYvEh2v": 13,
        "6NvTUEkp7HaQTeViFsdZNpVcdaeHuHYxfuaF4RJCaa2j": 14,
        "7kUAH9nxfw9J8cG2FL2CuP4q8twHyGLCnKcPeca5cdrM": 15,
        "Fu2MCim9xRRWyj2yiBHeH2wLYRXTyCAt2vyHX3KsGoBk": 4, //13/02
        "Dh2RE6iKfs1GktaVVX5C3LrMyuhrQUvCKUTKvozYpYML": 11,
        "BLaz9eW41Lf1Y75LsYmcpgWTR1z8mGfBE4hXMbk8Tvxh": 12,
        "B8ibxhV4sd45sWDMHwmuXX87eFXz39eADpykDhCwFAL8": 13,
        "9emuTneBzMr7p4PS2scZKgnNGwAQteEiChs4sFCNBmxN": 14,
        "HiL7bM8GEzvyD8XVMtm9PaQkRQqFwWUFPti4mqdLUWTZ": 15,

        "3f3ymT6qyQf75jRVi2jWzHPQFsfhhaoGF5jxjMsCoTd5": "tre"
    };
        // "GyLrGkwLXzKWaUMEMFewjvm1AGtxzGx2iDeQRmL11jLe": "seicento",

    const keys = _.keys(method);
    const data = await automo.getMetadataByFilter(
        { type: 'home', publicKey: { "$in": keys } },
        { amount: 5000, skip: 0}
    );

    // get metadata by filter actually return metadata object so we need unnesting
    const unrolledData = _.reduce(data, personal.unNestHome, []);
    let extended = [];
    let missing = 0;
    debug("%d data %d unrolled (ratio %d)",
        _.size(data), _.size(unrolledData),
        _.round(_.size(unrolledData) / _.size(data), 1)
    );
    const mongoc = await mongo3.clientConnect({concurrency: 10});
    for (video of unrolledData) {
        const c = await mongo3.readOne(mongoc, nconf.get('schema').categories, { videoId: video.videoId});
        const scrapedc = c ? c.categories : [];
        video.categories = _.map(scrapedc, function(c) {
            const isSupported = _.find(MACROc, { href: c.href });
            if(isSupported)
                c.macro = isSupported.macro;
            else {
                addToErrors(c);
                c.macro = "NOT"+c.href;
            }
            return c;
        });
        if(!c) missing++;
        video.id = video.videoOrder + video.metadataId.substring(0, 7);
        video.who = method[video.publicKey];
        _.unset(video, 'publicKey');
        extended.push(video);
    }
    await mongoc.close();
    debug("researchHomes: return %d elements and %d missing",
        _.size(extended), missing);
    return { json: extended};
}


async function researchHomeCSV(req) {

    const json = await researchHome(req);

    const nodes = _.map(json.json, function(entry) {
        entry.categorylist = _.map(entry.categories, 'name').join('+');
        entry.macrolist = _.map(entry.categories, 'macro').join('-');
        return _.omit(entry, ['thumbnail','categories']);
    });

    const csv = CSV.produceCSVv1(nodes);
    const filename = 'research-homes-' + _.size(json.json) + "-" + moment().format("YYYY-MM-DD") + ".csv";

    debug("researchHomeCSV: produced %d bytes from %d homes %d videos, returning %s",
        _.size(csv), json.json.length, _.size(nodes), filename);

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

async function guardoniv1ByMetadata(req) {

    const data = await automo.getMetadataByFilter(
        { type: 'search', id: req.params.metadataId },
        { amount: 1, skip: 0}
    );

    const videoIds = _.map(data[0].results, function(video) {
        return 'https://www.pornhub.com' + video.href;
    });

    return { json: videoIds };
}

function urlkeycodify(dict) {
    /* from dict return the c-format */
    const rets = _.reduce(dict, function(memo, name, key) {
        if(memo.length)
            memo += ","
        memo += key + "-" + name;
        return memo;
    }, "");
    debug("claudify: %j -> %s", JSON.stringify(dict, undefined, 2), rets);
    return rets;
}

function urlkeyparse(string) {
    /* from sting in c-format return dict */
    const chunks = string.split(',');
    const retd = _.reduce(chunks, function(memo, identity) {
        const key = identity.replace(/-.*/, '');
        const name = identity.replace(/.*-/, '');
        _.set(memo, key, name);
        return memo;
    }, {});
    debug("clauparse: %s -> %s", string, JSON.stringify(retd, undefined, 2));
    return retd;
}

async function queries(req) {

    const example = {
        "B8ibxhV4sd45sWDMHwmuXX87eFXz39eADpykDhCwFAL8": 13,
        "9emuTneBzMr7p4PS2scZKgnNGwAQteEiChs4sFCNBmxN": 14,
    };
    let filter = null;
    try {
        filter = urlkeyparse(req.params.keylist);
    } catch(error) {
        debug("Fail parsing, error:", error.message);
        return {
            json: {
                error: error.message,
                param: req.params.keylist,
                example: urlkeycodify(example)
            }
        };
    }

    if(!_.keys(filter).length) {
        debug("Missing list like: %s", urlkeycodify(example));
        return {
            json: {
                error: "missing list, empty json",
                param: req.params.keylist,
                example: urlkeycodify(example)
            }
        };
    }

    let data = null;
    try {
        data = await automo.getMetadataByFilter(
            { type: 'search', publicKey: { "$in": _.keys(filter) } },
            { amount: 5000, skip: 0}
        );
    } catch(error) {
        debug("Error in accessing DB %s", error.message);
        throw error;
    }

    // get metadata by filter actually return metadata object so we need unnesting
    const unrolledData = _.map(_.reduce(data, personal.unNestQuery, []), function(video) {
        if(!_.isUndefined(video.videoOrder))
            video.id = video.videoOrder + video.metadataId.substring(0, 7);
        video.who = filter[video.publicKey];
        _.unset(video, 'publicKey');
        return video;
    });
    debug("query transformation: from DB data %d, %d unrolled", _.size(data), _.size(unrolledData));
    return { json: unrolledData};
}

async function queriesCSV(req) {

    const json = await queries(req);
    const nodes = _.map(json.json, function(entry) {
        entry.relatedlist = _.map(entry.related, 'name').join(',');
        return _.omit(entry, ['thumbnail','related']);
    });
    const csv = CSV.produceCSVv1(nodes);
    const filename = 'research-queries-' + _.size(json.json) + "-" + moment().format("YYYY-MM-DD") + ".csv";

    debug("queriesCSV: produced %d bytes from %d homes %d videos, returning %s",
        _.size(csv), json.json.length, _.size(nodes), filename);

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
const MACROc = [{
        name:"Vertical Video", href:"/video?c=871",
        macro:"Format"
    },{
        name:"FFM in Threesome", href:"/video?c=761",
        macro:"Practices",
    },{
        name:"FMM in Threesome", href:"/video?c=771",
        macro:"Practices",
    },{
        name:"180° in Virtual Reality", href:"/video?c=622",
        macro:"Format",
    },{
        name:"3D in Virtual Reality", href:"/video?c=642",
        macro:"Format",
    },{
        name:"POV in Virtual Reality", href:"/video?c=702",
        macro:"Format",
    },{
        "name": "Live Cams", "macro": "Format",
        "href": "/live?track=6002"
    },
    {
        "name": "Popular With Women", "macro": "Fantasies",
        "href": "/popularwithwomen"
    },
    {
        "name": "Verified Amateurs", "macro": "Format",
        "href": "/video?c=138"
    },
    {
        "name": "Verified Models", "macro": "Format",
        "href": "/video?c=139"
    },
    {
        "name": "Virtual Reality", "macro": "Format",
        "href": "/vr"
    },
    {
        "name": "German", "macro": "Appearance",
        "href": "/video?c=95"
    },
    {
        "name": "60FPS", "macro": "Format",
        "href": "/video?c=105"
    },
    {
        "name": "Amateur", "macro": "Format",
        "href": "/video?c=3"
    },
    {
        "name": "Anal", "macro": "Practices",
        "href": "/video?c=35"
    },
    {
        "name": "Arab", "macro": "Appearance",
        "href": "/video?c=98"
    },
    {
        "name": "Asian", "macro": "Appearance",
        "href": "/video?c=1"
    },
    {
        "name": "Babe", "macro": "Appearance",
        "href": "/categories/babe"
    },
    {
        "name": "Babysitter", "macro": "Fantasies",
        "href": "/video?c=89"
    },
    {
        "name": "BBW", "macro": "Appearance",
        "href": "/video?c=6"
    },
    {
        "name": "Behind The Scenes", "macro": "Format",
        "href": "/video?c=141"
    },
    {
        "name": "Big Ass", "macro": "Appearance",
        "href": "/video?c=4"
    },
    {
        "name": "Big Dick", "macro": "Appearance",
        "href": "/video?c=7"
    },
    {
        "name": "Big Tits", "macro": "Appearance",
        "href": "/video?c=8"
    },
    {
        "name": "Bisexual Male", "macro": "Fantasies",
        "href": "/video?c=76"
    },
    {
        "name": "Blonde", "macro": "Appearance",
        "href": "/video?c=9"
    },
    {
        "name": "Blowjob", "macro": "Practices",
        "href": "/video?c=13"
    },
    {
        "name": "Bondage",  "macro": "Fantasies",
        "href": "/video?c=10"
    },
    {
        "name": "Brazilian", "macro": "Appearance",
        "href": "/video?c=102"
    },
    {
        "name": "British", "macro": "Appearance",
        "href": "/video?c=96"
    },
    {
        "name": "Brunette", "macro": "Appearance",
        "href": "/video?c=11"
    },
    {
        "name": "Bukkake", "macro": "Practices",
        "href": "/video?c=14"
    },
    {
        "name": "Cartoon",  "macro": "Format",
        "href": "/video?c=86"
    },
    {
        "name": "Casting", "macro": "Fantasies",
        "href": "/video?c=90"
    },
    {
        "name": "Celebrity", "macro": "Fantasies",
        "href": "/video?c=12"
    },
    {
        "name": "Closed Captions", "macro": "Format",
        "href": "/video?c=732"
    },
    {
        "name": "College", "macro": "Fantasies",
        "href": "/categories/college"
    },
    {
        "name": "Compilation", "macro": "Format",
        "href": "/video?c=57"
    },
    {
        "name": "Cosplay", "macro": "Fantasies",
        "href": "/video?c=241"
    },
    {
        "name": "Creampie", "macro": "Practices",
        "href": "/video?c=15"
    },
    {
        "name": "Cuckold", "macro": "Fantasies",
        "href": "/video?c=242"
    },
    {
        "name": "Cumshot", "macro": "Practices",
        "href": "/video?c=16"
    },
    {
        "name": "Czech", "macro": "Appearance",
        "href": "/video?c=100"
    },
    {
        "name": "Described Video", "macro": "Format",
        "href": "/described-video"
    },
    {
        "name": "Double Penetration", "macro": "Practices",
        "href": "/video?c=72"
    },
    {
        "name": "Ebony", "macro": "Appearance",
        "href": "/video?c=17"
    },
    {
        "name": "Euro", "macro": "Appearance",
        "href": "/video?c=55"
    },
    {
        "name": "Exclusive", "macro": "Format",
        "href": "/video?c=115"
    },
    {
        "name": "Feet", "macro": "Fantasies",
        "href": "/video?c=93"
    },
    {
        "name": "Female Orgasm", "macro": "Practices",
        "href": "/video?c=502"
    },
    {
        "name": "Fetish", "macro": "Fantasies",
        "href": "/video?c=18"
    },
    {
        "name": "Fingering", "macro": "Practices",
        "href": "/video?c=592"
    },
    {
        "name": "Fisting", "macro": "Practices",
        "href": "/video?c=19"
    },
    {
        "name": "French", "macro": "Appearance",
        "href": "/video?c=94"
    },
    {
        "name": "Funny", "macro": "Fantasies",
        "href": "/video?c=32"
    },
    {
        "name": "Gangbang", "macro": "Practices",
        "href": "/video?c=80"
    },
    {
        "name": "Gay", "macro": "Fantasies",
        "href": "/gayporn"
    },
    {
        "name": "Handjob", "macro": "Practices",
        "href": "/video?c=20"
    },
    {
        "name": "Hardcore", "macro": "Fantasies",
        "href": "/video?c=21"
    },
    {
        "name": "HD Porn", "macro": "Format",
        "href": "/hd"
    },
    {
        "name": "Hentai", "macro": "Format",
        "href": "/categories/hentai"
    },
    {
        "name": "Indian", "macro": "Appearance",
        "href": "/video?c=101"
    },
    {
        "name": "Interactive", "macro": "Format",
        "href": "/interactive"
    },
    {
        "name": "Interracial",  "macro": "Fantasies",
        "href": "/video?c=25"
    },
    {
        "name": "Italian", "macro": "Appearance",
        "href": "/video?c=97"
    },
    {
        "name": "Japanese", "macro": "Appearance",
        "href": "/video?c=111"
    },
    {
        "name": "Korean", "macro": "Appearance",
        "href": "/video?c=103"
    },
    {
        "name": "Latina", "macro": "Appearance",
        "href": "/video?c=26"
    },
    {
        "name": "Lesbian", "macro": "Fantasies",
        "href": "/video?c=27"
    },
    {
        "name": "Massage", "macro": "Fantasies",
        "href": "/video?c=78"
    },
    {
        "name": "Masturbation", "macro": "Practices",
        "href": "/video?c=22"
    },
    {
        "name": "Mature", "macro": "Appearance",
        "href": "/video?c=28"
    },
    {
        "name": "MILF", "macro": "Appearance",
        "href": "/video?c=29"
    },
    {
        "name": "Muscular Men", "macro": "Appearance",
        "href": "/video?c=512"
    },
    {
        "name": "Music", "macro": "Format",
        "href": "/video?c=121"
    },
    {
        "name": "Old/Young", "macro": "Fantasies",
        "href": "/video?c=181"
    },
    {
        "name": "Orgy", "macro": "Practices",
        "href": "/video?c=2"
    },
    {
        "name": "Parody", "macro": "Fantasies",
        "href": "/video?c=201"
    },
    {
        "name": "Party", "macro": "Fantasies",
        "href": "/video?c=53"
    },
    {
        "name": "Pissing", "macro": "Practices",
        "href": "/video?c=211"
    },
    {
        "name": "Pornstar", "macro": "Format",
        "href": "/categories/pornstar"
    },
    {
        "name": "POV", "macro": "Format",
        "href": "/video?c=41"
    },
    {
        "name": "Public", "macro": "Fantasies",
        "href": "/video?c=24"
    },
    {
        "name": "Pussy Licking", "macro": "Practices",
        "href": "/video?c=131"
    },
    {
        "name": "Reality", "macro": "Format",
        "href": "/video?c=31"
    },
    {
        "name": "Red Head", "macro": "Appearance",
        "href": "/video?c=42"
    },
    {
        "name": "Role Play", "macro": "Fantasies",
        "href": "/video?c=81"
    },
    {
        "name": "Romantic", "macro": "Fantasies",
        "href": "/video?c=522"
    },
    {
        "name": "Rough Sex", "macro": "Fantasies",
        "href": "/video?c=67"
    },
    {
        "name": "Russian", "macro": "Appearance",
        "href": "/video?c=99"
    },
    {
        "name": "School", "macro": "Fantasies",
        "href": "/video?c=88"
    },
    {
        "name": "Scissoring", "macro": "Practices",
        "href": "/video?c=532"
    },
    {
        "name": "SFW", "macro": "Format",
        "href": "/sfw"
    },
    {
        "name": "Small Tits", "macro": "Appearance",
        "href": "/video?c=59"
    },
    {
        "name": "Smoking", "macro": "Fantasies",
        "href": "/video?c=91"
    },
    {
        "name": "Solo Female", "macro": "Fantasies",
        "href": "/video?c=492"
    },
    {
        "name": "Solo Male", "macro": "Fantasies",
        "href": "/video?c=92"
    },
    {
        "name": "Squirt", "macro": "Practices",
        "href": "/video?c=69"
    },
    {
        "name": "Step Fantasy", "macro": "Fantasies",
        "href": "/video?c=444"
    },
    {
        "name": "Strap On", "macro": "Practices",
        "href": "/video?c=542"
    },
    {
        "name": "Striptease", "macro": "Fantasies",
        "href": "/video?c=33"
    },
    {
        "name": "Tattooed Women", "macro": "Appearance",
        "href": "/video?c=562"
    },
    {
        "name": "Teen", "macro": "Appearance",
        "href": "/categories/teen"
    },
    {
        "name": "Threesome", "macro": "Fantasies",
        "href": "/video?c=65"
    },
    {
        "name": "Toys", "macro": "Fantasies",
        "href": "/video?c=23"
    },
    {
        "name": "Trans Male", "macro": "Appearance",
        "href": "/video?c=602"
    },
    {
        "name": "Trans With Girl", "macro": "Fantasies",
        "href": "/video?c=572"
    },
    {
        "name": "Trans With Guy", "macro": "Fantasies",
        "href": "/video?c=582"
    },
    {
        "name": "Transgender", "macro": "Appearance",
        "href": "/transgender"
    },
    {
        "name": "Verified Couples", "macro": "Format",
        "href": "/video?c=482"
    },
    {
        "name": "Vintage", "macro": "Format",
        "href": "/video?c=43"
    },
    {
        "name": "Webcam", "macro": "Format",
        "href": "/video?c=61"
    }
];


module.exports = {
    researchHome,
    researchHomeCSV,
    researchErrors,
    queriesCSV,
    queries,
    guardoniv1ByMetadata,
};
