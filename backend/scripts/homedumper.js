#!/usr/bin/env node
const _ = require('lodash');
const debug = require('debug')('scripts:homedumper');
const nconf = require('nconf');
const fs = require('fs'); 
const automo = require('../lib/automo');
const mongo3 = require('../lib/mongo3');
const CSV = require('../lib/CSV');
const personal = require('../routes/personal');
const research = require('../routes/research');

/* this file implement API developed for research purpose, they might not have any 
 * use outside of Q1-2021 experiments */

nconf.env().argv().file({file: 'config/settings.json'});

const phase1_research_Home_v2 = {
    "4bWFa6wbt8Yh29VKq1oheAWfmCd8F5So9XBa5iwz5iCu": "1_2",
    "mPr1LCeGLxYbHdU1nyjhSCduwcJ2GvnMu57ywkpo24p":  "2_2",
    "EfidbHejm1Cs2zxVg83YWK3qgFqoGgZE6LjEXDu3my5T": "3_2",
    "3EZdTYieKVL5SUXTxErrNyvB7fsetcBYeiYAXfis8Tk3": "4_2",
    "H79g88Fd88mCrv34CqWCzCnfmHyKHQEtGuHTJwGWq96T": "5_2",
    "32sTPzgshkEUEbY8ui4TpLnXAVdPQreo3uk3j8qu6dSQ": "6_2",
    "F19XjkrZRgf3uwgYVvMpUdvFkdv4suFg9MqGHkptSnue": "7_2", 
    "SZnCfiv9qteL49kQ2akCsSvKnjNgCnvbWoCeY3DHsVW": "8_2",
    "8TfcSicg981ncMRymi7QouSvLqQoNoyBCaKqsZZ48it": "9_2a",
    "3pSCWj8keAGUMu5TP32KjTK8oJ9Jydywyot3ryMDWury":"9_2b",
    "G9imEEX63r7MDSbyFie6jfmVt6HBs4EGqg7XxnF3KQF7": "10_2",
    "5ka2RBcyyRB1JqSojjiG5LnSB4RCQWVJBKcdq2QerAw7": "11_2",
    "CSCxZfrAd5H3qbRkLRjSx1AHuDkC1MQJ9NYUU8gBYQn": "12_2",
    "AfsQT25Yok9aYw2dtSC2Agpm66huaPG7JBCYSTimarsa": "13_2",
    "CJRx6Rd614NVyTdvPLuAfR5iFDGjzTKqjfqBPSQtrBUd": "14_2",
    "6sX8dFtKYeK3fPucWwhefBBc73GNgBEKeiAJxWDrP825": "15_2",
    "4epv2nCBuYboTs4hHzs9Ay3rH7PJPXzgDsjAeui2MLh8": "16_2"
}

const enhanced_Selection = {
    "6yMuccGDjFvyW12LjCJpMdsrTswPt8jkNB5ZogCZLNkb": "po4_2",
    "Ce3rXua6QJdpRzN4QYumBV7QfkfV1yDNLifC83REzkmU": "po4_3",
    "2fS3qNZoL9sfKfvY9Gwpky3hkTPsxxL9EqfiWt4x2q3k": "pouno",
    "488V9jLEg9d2GLdePP211MBw7R5odv6fjkriRpy9GimM": "podue",
    "f6EJUkfuqu9QDVAizf7LKrnq1NcriNn23kxdM8ac5oS":  "giuc_consent",
    "GUtNAFqyjcMn6iNw7WhoQkTYx9DuQn8vH95qgvEKeTXs": "giuc_fetish",
}

/* https://pornhub.tracking.exposed/api/v2/file/personalized-history.csv.gz */
const personalized_Activity = {
    "6yd7CZWjs9QLoFHStEgBnJujEZbs6PUxqw15nUgmExQm": "claudioinc",
    "6yMuccGDjFvyW12LjCJpMdsrTswPt8jkNB5ZogCZLNkb": "po4_2",
    "Ce3rXua6QJdpRzN4QYumBV7QfkfV1yDNLifC83REzkmU": "po4_3",
    "6FRVLZoyiX1VW81k7Vw3fciqAY68hEvYpFY3n7cRBLSb": "salvo_fetish",
    "14QXWmb24bhwW4JRU4hprm3oNemgF8uqtSTfRNDDmT4n": "salvo_consent",
    "488V9jLEg9d2GLdePP211MBw7R5odv6fjkriRpy9GimM": "podue",
    "2fS3qNZoL9sfKfvY9Gwpky3hkTPsxxL9EqfiWt4x2q3k": "pouno",
    "f6EJUkfuqu9QDVAizf7LKrnq1NcriNn23kxdM8ac5oS":  "giuc_consent",
    "GUtNAFqyjcMn6iNw7WhoQkTYx9DuQn8vH95qgvEKeTXs": "giuc_fetish",
}

/* research-home.csv + https://github.com/tracking-exposed/experiments-data/tree/master/potests/potest_12-19feb 
   https://pornhub.tracking.exposed/api/v2/file/research-home.json.gz (and .csv)  */
const phase1_research_Home = {
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

const research_Home = {
    "Cde2MyF7TgZ81rsvVmYUCTa1Jew2UD1F8kcT9NHRCPqe": "mille"
};

const ragazzi = {
    "4MzsSuGbjydTjMLu4W7fSpU9HCPz39sQLg9xp7yaicJg":"Maschio",
    "DSSUzhtUK6cTiHCtWK8RHRGUDm125HZKBMfjJCznk8tf":"Nessuno",
    "DafBtQsEjqX7zqtGQpw4pz2Uv7jyxCy6CJq54W81UN6r":"Femmina",
    "9dDiwexPBPs8CxAFV2Rm8z77BRzUAaTrnfUo8X63HWTD":"Coppia",
    "5ow6BYGHCTnX4f29VLzTMdCpCdSwn8pYa6QgaETF4H4A":"Coppia Donna",
    "6cfUj2ayZs9mhtQKG9C81ioSJncRCcyaJHk1srsNshxp":"Coppia Uomo",
    "8Zi3nwqj9ps4EmbjccwYREkitkiBSCZtwYvm4RRK1MuY":"Uomo trans",
    "3rcXFnkjdcK4vR51YfRhUm4oT5zmPApYhp7btt1H7ZJk":"Donna trans",
    "2eXXetwo2cPvCLT6frrsHbMy7BKUBX3z2oY22nonums3":"Altro",
    "CpUPwehJqYdhHLUDAGk93c4ZLeotzDyziHAjKpxLd3eQ":"Non binario"
}

async function returnJSONfromKeys(userList) {

    const MAXDATA = 5000;
    const keys = _.keys(userList);
    let overflow = false;
    debug("Considering %d publicKeys", _.size(keys));
    const data = await automo.getMetadataByFilter(
        { type: 'home', publicKey: { "$in": keys } },
        { amount: MAXDATA, skip: 0}
    );
    if(_.size(data) === MAXDATA) {
        console.log("Warning no paging supported, limit reach", MAXDATA);
        overflow = true;
    }

    // get metadata by filter actually return metadata object so we need unnesting
    const unrolledData = _.reduce(data, personal.unNestHome, []);
    let extended = [];
    let missing = 0;
    debug("%d data %d unrolled (ratio %d)",
        _.size(data), _.size(unrolledData),
        _.round(_.size(unrolledData) / _.size(data), 1)
    );
    const mongoc = await mongo3.clientConnect({concurrency: 10});
    let counter = 0;
    debug("Iterating over categories from %d videos", _.size(unrolledData));
    for (video of unrolledData) {
        const c = await mongo3.readOne(mongoc, nconf.get('schema').categories, { videoId: video.videoId});
        const scrapedc = c ? c.categories : [];
        video.categories = _.map(scrapedc, function(c) {
            const isSupported = _.find(research.MACROc, { href: c.href });
            if(isSupported)
                c.macro = isSupported.macro;
            else {
                console.log("Missing", c);
                c.macro = "NOT"+c.href;
            }
            return c;
        });
        if(!c.length) missing++;
        video.id = video.videoOrder + video.metadataId.substring(0, 7);
        video.who = userList[video.publicKey];
        _.unset(video, 'publicKey');
        extended.push(video);

        if( (counter++ % 2500) == 100 )
            debug("Enriched %d videos so far", _.size(extended));
    }
    await mongoc.close();
    debug("researchHomes: return %d elements and %d missing",
        _.size(extended), missing);
    return { json: { data: extended, overflow }};
}

function writeJSON(data, filename) {
    debug("Writing JSON %s.json", filename);
    fs.writeFileSync("downloadable/" + filename + "-" + _.size(data) + ".json", JSON.stringify(data, undefined, 1));
}

function dataFilterAndEnhancement(data) {
    const preserved = _.filter(data, function(entry) {
        return _.startsWith(entry.sectionName, 'Recommended');
    });
    debug("From %d elements we filtered %d [ %d%% ]",
        _.size(data), _.size(preserved), _.round( ( 100 / _.size(data) ) * _.size(preserved), 1) );

    writeJSON(preserved, "enhanced-nested");
    let categories = _.uniq(_.map(_.flatten(_.map(preserved, 'categories')), 'name'));
    const enhanced = _.map(preserved, function(entry) {
        _.each(categories, function(catname) {
            let isPresent = !!_.find(entry.categories, { name: catname });
            _.set(entry, catname, isPresent);
        });
        _.unset(entry, 'categories');
        return entry;
    });
    debug("Enhanment completed!");
    return enhanced;
}

function shrinkData(bigen) {
    const r = _.pick(bigen, ['title', 'authorName', 'publisherType', 'views', 'videoId', 'sectionOrder', 'sectionName', 'metadataId', 'savingTime']);
    r.categories = _.map(bigen.categories, 'name');
    return r;
}

function produceDot(allcatdata, filename) {
   
    // we only keep this category for this test
    const data = _.filter(allcatdata, { sectionName: 'Recommended For You'});
    const dot = Object({links: [], nodes: []})
    dot.links = _.map(data, function(video) { return { target: video.who, source: video.videoId, value: 1} });

    const vList = _.uniq(_.map(data, function(video) { return video.videoId }));
    const videoObject = _.map(vList, function(v) { return { id: v, group: 1 }});
    const pList = _.uniq(_.map(data, function(video) { return video.who }));
    const pseudoObject = _.map(pList, function(v) { return { id: v, group: 2 }});
    dot.nodes = _.concat(videoObject, pseudoObject);

    fs.writeFileSync(filename + '.dot', JSON.stringify(dot));
}

async function produceCSV(userList, filename, opts) {
    debug("Produring %s from %d entries", filename, _.size(_.keys(userList)));
    const json = await returnJSONfromKeys(userList);
    if(!json.json.data) {
        console.log("Not produced any data for ", filename, ": missing data");
        process.exit(1);
    }

    if(json.json.overflow)
        console.warn("[!]\tWarning, overflow!?");

    let data = null;
    if(opts && opts.reduced == true) {
        debug("+ applying reduction! from %d", _.size(JSON.stringify(json.json.data)));
        data = _.map(json.json.data, shrinkData);
        debug("+ to %d", _.size(JSON.stringify(data)));
    }
    else
        data = json.json.data;

    if(opts && opts.dot == true) {
        debug("producing dot format for %s", filename);
        produceDot(data, filename);
    }

    let csv = null;
    if(filename !== 'enhanced') {
        writeJSON(data, (opts && opts.reduced == true) ? filename + "-reduced" : filename);
        const nodes = _.map(data, function(entry) {
            entry.categorylist = _.map(entry.categories, 'name').join('+');
            entry.macrolist = _.map(entry.categories, 'macro').join('-');
            return _.omit(entry, ['thumbnail','categories']);
        });
        csv = CSV.produceCSVv1(nodes);
    } else {
        /* no JSON for the enhanced file */
        const nodes = dataFilterAndEnhancement(data);
        csv = CSV.produceCSVv1(nodes);
    }

    debug("researchHomeCSV: produced %d bytes from %d homes, returning %s(csv|json)",
        _.size(csv), data.length, (opts && opts.reduced == true) ? filename + "-reduced" : filename);

    if(!_.size(csv))
        return { text: "Error: no CSV generated 🤷" };

    debug("Writing CSV %s", ( (opts && opts.reduced == true) ? filename + "-reduced" : filename ) + _.size(data) + ".csv");
    fs.writeFileSync("downloadable/" + (
        (opts && opts.reduced == true) ? filename + "-reduced" : filename 
    ) + _.size(data) + ".csv", csv);
    console.log("Writing complete");
};

(async function() {
    console.log("looking for options --enhanced --phase2 --double --ragazzi and/or --home");
    if(nconf.get('enhanced'))
        await produceCSV(enhanced_Selection, 'enhanced');
    if(nconf.get('phase2'))
        await produceCSV(personalized_Activity, 'personalized-history');
    if(nconf.get('home'))
        await produceCSV(research_Home, 'research-home', { reduced: true});
    if(nconf.get('double'))
        await produceCSV(phase1_research_Home_v2, 'double', { dot: true });
    if(nconf.get('ragazzi'))
        await produceCSV(ragazzi, 'ragazzi');
})();
