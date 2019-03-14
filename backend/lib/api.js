
var apiListVersion1 = {
    /* POST from the userscript */
    processEvents:    require('./events').processEvents,

    /* not API, serving static pages from sections/*.pug */
    getPage:          require('./staticpages').getPage,

    /* for revision */
    unitById:         require('./htmlunit').unitById,

    /* return basic data, the video-impression unit, and support optional parameters */
    getBasicData:     require('./basic'),
};

module.exports = {
    implementations: apiListVersion1
};
