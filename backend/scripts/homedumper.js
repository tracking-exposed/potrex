const _ = require('lodash');
const debug = require('debug')('routes:research');
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
const research_Home = { 
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
        if(!c) missing++;
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
    fs.writeFileSync("downloadable/" + filename + ".json", JSON.stringify(data, undefined, 1));
}

function dataFilterAndEnhancement(data) {
    const preserved = _.filter(data, function(entry) {
        return _.startsWith(entry.sectionName, 'Recommended');
    });
    debug("From %d elements we filtered %d [ %d%% ]",
        _.size(data), _.size(preserved), _.round( ( 100 / _.size(data) ) * _.size(preserved), 1) );

    debugger;
    let categories = _.uniq(_.map(_.flatten(_.map(preserved, 'categories')), 'name'));
    debugger;
    const enhanced = _.map(preserved, function(entry) {
        _.each(categories, function(catname) {
            let isPresent = !!_.find(entry.categories, { name: catname });
            _.set(entry, catname, isPresent);
        });
        _.unset(entry, 'categories');
        return entry;
    });
    debug("Enhanment completed! a random sample looks like:")
    console.log(_.sample(enhanced));
    return enhanced;
}

async function produceCSV(userList, filename) {
    debug("Produring %s from %d entries", filename, _.size(_.keys(userList)));
    const json = await returnJSONfromKeys(userList);
    if(!json.json.data) {
        console.log("Not produced any data for ", filename, ": missing data");
        process.exit(1);
    }

    let csv = null;
    if(filename !== 'enhanced') {
        writeJSON(json.data.data, fiename);
        const nodes = _.map(json.json.data, function(entry) {
            entry.categorylist = _.map(entry.categories, 'name').join('+');
            entry.macrolist = _.map(entry.categories, 'macro').join('-');
            return _.omit(entry, ['thumbnail','categories']);
        });
        csv = CSV.produceCSVv1(nodes);
    } else {
        /* no JSON for the enhanced file */
        const nodes = dataFilterAndEnhancement(json.json.data);
        csv = CSV.produceCSVv1(nodes);
    }

    debug("researchHomeCSV: produced %d bytes from %d homes %d videos, returning %s",
        _.size(csv), json.json.data.length, _.size(nodes), filename);

    if(!_.size(csv))
        return { text: "Error: no CSV generated 🤷" };

    debug("Writing CSV...");
    fs.writeFileSync("downloadable/" + filename + ".csv", csv);
    console.log("Writing complete");
};

(async function() {
    await produceCSV(enhanced_Selection, 'enhanced');
    // await produceCSV(personalized_Activity, 'personalized-history');
    // await produceCSV(research_Home, 'research-home');
})();