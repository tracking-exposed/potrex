#!/usr/bin/env node
const _ = require('lodash');
const debug = require('debug')('scripts:potest-1-creampiechart');
const nconf = require('nconf');
const fs = require('fs');

const mongo3 = require('../lib/mongo3');

nconf.argv().env().file({ file: 'config/settings.json' });

async function getSectionNamesCount(mongoc, sectionOrder) {
  /*
    let partial = "sections." + _.parseInt(sectionOrder);
    let innerM = {};
    innerM[partial] = { "$exists": true };
    innerM['type'] = { "$exists": true };
    let matchQuery = { "$match" : innerM };
    debug("* %j", matchQuery);
    */
        // this could been simpler as { $match: { 'section.order': sectionOrder }}
        // section order was broken due to:
        // https://github.com/tracking-exposed/pornhub.tracking.exposed/issues/23
    return await mongo3.aggregate(mongoc, nconf.get('schema').metadata, [
        { $match: { type: 'home' } },
        { $match: { clientTime: {
            "$gte": new Date("2020-01-19"),
            "$lte": new Date("2020-01-20") } }
        },
        { $project: { "sections.display": 1, 'selected': { $arrayElemAt: [ "$sections", sectionOrder ]}, "sections.href": 1, "_id": 0 }},
        { $unwind: "$selected" },
        { $group: {
            _id: "$selected.href",
            names: { "$push": "$selected.display" },
            // names should be enabled when you've to translate
            // href such as "_id": "/video?c=28", into a meaningful name
            amount : { "$sum": 1 } }
        }
    ]);
}

async function main() {
    debug("Looping over section number 0..5");
    const mongoc = await mongo3.clientConnect({concurrency: 1});
    let results = [];
    for (sectionOrder of [0, 1, 2, 3, 4 ]) {
        const sv = await getSectionNamesCount(mongoc, sectionOrder);
        debug("Extracted section view %d (%d)", sectionOrder, _.size(sv));
        results = _.concat(results, _.map(sv, function(o) {
            o.section = sectionOrder + 1;
            o.column = [ o._id, o.amount ];
            return o;
        }));
    }
    await mongoc.close();

    fs.writeFileSync(
        'sections.json',
        JSON.stringify(results, undefined, 2)
    );

    const maxAmount = _.max(_.map(results, 'amount'));
    const fontSizeParam = 26 / maxAmount;
    const hugo = _.join(_.map([1, 2, 3, 4, 5 ], function(sectionOrder) {
        const elements = _.filter(results, { section: sectionOrder});

        const numberOfSamples = _.sum(_.map(elements, 'amount'));

        const namesInSpan = _.join(_.map(elements, function(e) {
            if(!e._id)
              return null;
            if(!e._id.match)
              debug(e._id);

            const fontSize = _.round( 0.4 + ((fontSizeParam * e.amount) / 10) , 1);
            let name = null;
            let color = null;
            if(e._id.match(/o=ht/)) {
                const countryCode = e._id.replace(/.*&cc=/, '');
                if(_.size(countryCode) == 2)
                    name = "Hot Video in " + _.upperCase(countryCode);
                else
                    name = "Hot Video Internationally";
                color = "#f900aa";
            } else if(e._id.match(/o=mv/)) {
                const countryCode = e._id.replace(/.*&cc=/, '');
                if(_.size(countryCode) == 2)
                    name = "Most View in " + _.upperCase(countryCode);
                else
                    name = "Most View";
                color = "#ffaa00";
            } else if(e._id == '/recommended') {
                name = "Recommended For You";
                color = "#55aadd";
            } else if(_.startsWith(e._id, '/video?')) {
                const catnum = e._id.replace(/.*?c=/, '');
                name = _.first(e.names);
                color = "#ffaa00";
            } else if(e._id == '/video') {
                name = "Recently Featured XXX";
                color = "#dfda44";
            } else if(_.startsWith(e._id, '/categories/')) {
                name =  "Recommended " + e._id.replace(/.categories./, '');
                color = "#40f";
            } else if(e._id == '/popularwithwomen') {
                name =  "Popular With Woman";
                color = "#d48";
            } else {
                name = "<%% " + _.first(e.names) + " %%>"
                color = "#333";
            }

            return `<button style="font-size:${fontSize}em;color:${color}">${name}</button>`;
        }), "");

        const html = `
  <div class="col-sm-6">
    <div class="card">
      <div class="card-body">
        <h5 class="card-title">Section ${sectionOrder}</h5>
        <p class="card-text">
          ${namesInSpan}
        </p>
      </div>
      <div class="card-footer">
        <small class="text-muted">total here ${numberOfSamples}</small>
      </div>
    </div>
  </div>
`;
        return html;
    }), "\n");
    fs.writeFileSync( 'hugosnippet.text', hugo);
}

try {
    main();
} catch(e) {
    console.log("Error in main()", e.message);
}
