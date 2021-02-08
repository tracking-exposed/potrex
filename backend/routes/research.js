const _ = require('lodash');
const moment = require('moment');
const debug = require('debug')('routes:research');

const automo = require('../lib/automo');
const CSV = require('../lib/CSV');

/* this file implement API developed for research purpose, they might not have any 
 * use outside of Q1-2021 experiments */

async function researchHome(req) {
    const method = {
        "HBtwj85xBbpBhH2JrC85JkQ6Wwjqps85NDhjqvZbm269": 1,
        "BbWJgn7r9RY66Ta81FxTkBZp5BUZSXLRK2D5jiUyg5w5": 2,
        "48jnnhZBB8YiL1Jxoj7dEGZfbQZaz2sUVWAfFv8Sjqr4": 3,
        "3c2VSiQvA9M9USH39Vcrhd8bgS13sTpjGCjiTjjdo3Hm": 4,
        "5TppRXJWpELBznYWQFTbHniez7MFJVCWB33DC51CpJvj": 5,
        "BjSQFkY3Vcv51D4Ls28pYZhQnUBt3qkhyvRXuVTrnzCt": 6,
        "E6ZmTHNUqu44ygJLehRaViiJSiUcQJQ6NhAYeGvcgDHq": 7,
        "A47vq1ohohHoCVwhkTEYftS4aJ2km1KGfn2C1RGBGcmQ": 8,
        "5N3pbGboWWA355gBZRT2y5ex6dSRckG2zuntY8WTtZP6": 9,
        "FxecQ6iVn9piumUY7BrGxewN7ykAfUiAGd4yDJAt5vFS": 10,
        "BLMLXkByUZwUVych67DriYNtnqi9AvjDycHveP2zinUw": 11,
        "H3aF8frTuGp1KoPYWKNnFPTnFpq7hSqP87DSod1vAvoB": 12,
        "2m7hoG8moguroX3NwrWox1gtaZJWHWEPqKiupUofmX3d": 13,
        "5GBj6eroihe5Qy5YrrvVg6uZq7k4BCrvDoEe9WRUfumV": 14,
        "6FwTzraFsx1Hcf1CSmE9qm7Ed9LNYyUR4xSUiHHWvCsm": 15,
        "FmXrCoBwP2t6Pf8gHeg4wv7ZpNrV5hzDjv7VtScbrvFN": 16,
        "CwrmxQUiq4DvpTcj63VxvabQ14Vu5KoCQaKMPQYiXkUf": 3,
        "1PYHyhqJD1V6baGktNTVhkTgXdpW6UBNhbq5duiMT6Y":  4,
        "5zuMxNj2w5ja1KgdJCa9yj11xuVMahnWirpFVK26q4tB": 9,
        "6zU5x5YoqipLnHrmiZ3y9YDVguAszQJZHJ8UFYh23L6t": 10,
        "7YJyHav9qDZohgt8SGjr3M2pNi1DYnAze5TbmDmPdsiQ": 11,
        "FU6eLaMjXsJfdwPF6Kb6Qoz5qDunUvTn38G4LqWPJyC9": 12 
    };
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
