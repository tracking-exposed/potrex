const _ = require('lodash');
const fs = require('fs');
const JSDOM = require('../backend/node_modules/jsdom/lib/api').JSDOM;

const ac = JSON.parse(fs.readFileSync('allcategories.json'));
console.log(`Loaded ${_.size(ac)} categories`);

const fname = process.argv[2].replace(/\"/g, '');
const name = fname.replace(/\.html/, '');

let html = fs.readFileSync( 'downloaded/' + fname , 'utf-8');
let dom = new JSDOM(html).window.document;

let c = _.find(ac, { name: name });
if(!c)
    c = _.find(ac, { name: 'Old/Young' });

let ts = dom.querySelectorAll('.tagTopSuggestions');
if(ts.length === 0) {
    console.log(`Nothing to do with ${c.name}`);
}

c.related = [];
_.each(ts, function(node) {
    let clean = node.textContent.replace(/[\n]/g, '').replace(/\ \ ?/g, '')
    c.related.push(clean);
});
console.log(`Processed ${c.name} and we got ${_.size(c.related)} categories`);

fs.writeFileSync('created/' + name + '.json', JSON.stringify(c, undefined, 2));
