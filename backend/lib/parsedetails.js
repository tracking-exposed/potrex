const _ = require('lodash');
const debug = require('debug')('lib:parsedetails');

const jsdom = require("jsdom");
const { JSDOM } = jsdom;

function attributeURL(href) {

    if(href.match(/viewkey=/)) {
        debug("url %s match video", href);
        return {
            href: href,
            type: 'video',
            videoId: href.replace(/.*viewkey=/, '')
        };
    }

    debug("broken!");
    return { href: href, type: null };
};

function getMetadata(html) {
  const dom = new JSDOM(html);
  const D = dom.window.document;

  let vTitle = null;
  try {
      vTitle = D.querySelectorAll("h1")[0].querySelector("span").textContent;
  } catch(error) { }

  debugger;
  return {
    title: vTitle,
  };

};

function getRelated(html) {
  const dom = new JSDOM(html);
  const D = dom.window.document;
  const relatedUrls = D.querySelectorAll('[data-related-url]');
  let related = [];

  _.each(relatedUrls, function(e) {
    let t = e.getAttribute('title');
    let h = e.getAttribute('href');
    let k = h.match(/viewkey=/);

    if(!t || !h || !k) return;

    related.push({ 
        title: t,
        href: l,
        videoId: h.replace(/.*viewkey=/)
    };
  });
  debug("From %d data-related-url found %d related", _.size(relatedUrls), _.size(related));
  return related; 
};


module.exports = {
    attributeURL:attributeURL,
    getMetadata: getMetadata,
    getRelated: getRelated,
};
