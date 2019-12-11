const _ = require('lodash');
const debug = require('debug')('lib:parsedetails');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

function attributeURL(href) {

    if(href.match(/viewkey=/)) {
        return {
            href: href,
            type: 'video',
            videoId: href.replace(/.*viewkey=/, '')
        };
    }

    const chunks = href.split('/');
    if(_.size(chunks) == 4 && chunks[3] == "") {
        /* homepage: ["https:","","www.pornhub.com",""] */
        return {
            href,
            type: 'home'
        }
    }

    debug("UNMANAGED url %s match video", href);
    return { href: href, type: null };
};

function getFeatured(html) {
    const dom = new JSDOM(html);
    const D = dom.window.document;
    
    let titles = D.querySelectorAll('.sectionTitle');

    const sections = _.map(titles, function(node, order) {
        const secondTag = node.children[1].tagName;
        if(!(node.children[1].children && node.children[1].children[0] &&
             node.children[1].children[0].tagName) ) {
                debug("nope in %d", order)
                return null;
            }

        let videos = 
          _.map(node.parentNode.querySelectorAll(".linkVideoThumb"), function(v) {
            let tre = v.parentNode.parentNode.parentNode.querySelector('.usernameWrap');
            let linked = tre ? tre.querySelector('a') : null;

            return {
              title: v.getAttribute('data-title'),
              authorName: tre ? tre.textContent.trim() : null,
              authorLink: linked ? linked.getAttribute('href') : null,
              duration: v.parentNode.querySelector('.duration').textContent,
              href: v.getAttribute('href')
            }
          });
        if(_.startsWith(secondTag,'H')) {
            return {
                order,
                tagName: node.children[1].tagName,
                href: node.children[1].children[0].getAttribute('href'),
                display: node.children[1].children[0].textContent.trim(),
                videos,
            }
        }   
        return null;
    });

    debug("Potential titles %d -> %s",
        _.size(titles), _.map(sections, 'display'));
    return { sections };
}

function getMetadata(html) {
  const dom = new JSDOM(html);
  const D = dom.window.document;
  
  const vTitle = D.querySelectorAll("h1")[0].querySelector("span").textContent;
  const views = D.querySelector('div.views');

  let counting = -1;
  try {
    counting = views.querySelector(".count").textContent;
  } catch(err) {
    debug("Views extractor failure (%s): %s", viewx.textContent, err);
  }

  /* the producer metadata */
  let producer = {};
  try {
    producer = {
        name: D.querySelectorAll('[data-type="user"] > a.bolded')[0].textContent,
        href: D.querySelectorAll('[data-type="user"] > a.bolded')[0].getAttribute('href'),
    };
  } catch(error) {
    const ref = D.querySelectorAll('.video-detailed-info')[0].querySelector('a');
    // const v = !!D.querySelectorAll('.video-detailed-info')[0].querySelector('span.verified-icon');

    producer = {
        name: ref.textContent,
        href: ref.getAttribute('href'),
        // verified: v,
    };
  } 

  if(producer && producer.href) {
      if ( _.startsWith(producer.href, '/channel') ) {
          producer.type = 'Channel';
      } else /* startsWith /pornstar */ {
          producer.type = 'Pornstar';
      }
  }

  return {
    title: vTitle,
    views: counting,
    producer
  };
};

function getRelated(html) {
  const dom = new JSDOM(html);
  const D = dom.window.document;
  const relatedUrls = D.querySelectorAll('ul#relatedVideosCenter > li');
  console.log(D.querySelectorAll('ul#relatedVideosCenter > li').length);

  let related = [];

  _.each(relatedUrls, function(e) {
    const t = e.querySelector('img').getAttribute('alt')
    const thumbnail  = e.querySelector('img').getAttribute('src')
    const link = e.querySelector('a');
    let h = link.getAttribute('href');
    let k = h ? h.match(/viewkey=/) : null;

    if(!t || !h || !k) return;

    let rating = e.querySelector('.value');
    let view = e.querySelector('.views > var');
    let duration = e.querySelector('.duration');

    related.push({ 
        thumbnail,
        title: t,
        href: h,
        rating: rating.textContent,
        views: view.textContent,
        duration: duration.textContent,
        videoId: h.replace(/.*viewkey=/, '')
    });
  });

  debug("From %d related",  _.size(related));
  return { related };
};

function getCategories(html) {
  const dom = new JSDOM(html);
  const D = dom.window.document;
  const cats = D.querySelectorAll('.categoriesWrapper');

  if(_.size(cats) !== 1)
    debug("Odd? the categories are not 1? %d", _.size(cats));

  let categories = [];
  _.each(cats[0].querySelectorAll('a'), function(e) {
    if(!_.startsWith(e.textContent, '+'))
        categories.push(e.textContent);
  });
  return { categories: categories };
};


module.exports = {
    attributeURL:attributeURL,
    getFeatured, getFeatured,
    getMetadata: getMetadata,
    getRelated: getRelated,
    getCategories: getCategories
};
