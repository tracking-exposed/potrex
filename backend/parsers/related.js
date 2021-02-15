const _ = require('lodash');
const debug = require('debug')('parser:related');

function related(envelop, previous) {

    if(previous.nature.type !== "search")
        return false;

    const relatedS = envelop.jsdom.querySelector('.relatedSearchTermsBottom');
    const retval = _.map(relatedS.querySelectorAll('a'), function(anchor) {
        return {
            name: anchor.textContent,
            href: anchor.getAttribute('href')
        };
    })
    return { related: retval };
};

module.exports = related;