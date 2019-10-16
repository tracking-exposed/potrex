
var apiListVersion1 = {
    /* POST from the userscript */
    processEvents:    require('./events').processEvents,

    /* not API, serving static pages from sections/*.pug */
    getPage:          require('./staticpages').getPage,

    /* for revision */
    unitById:         require('./htmlunit').unitById,

    /* return basic data, the video-impression unit, and support optional parameters */
    getBasicData:     require('./basic').all,

    /* return the content for one supporter only */
    getSelectedData:  require('./basic').selected,

    /* return contenr formatted for radarChart */
    getRadarData:     require('./basic').radar,

    /* imported from yttrex */
    statistics:       require('./statistics').statistics,
};

module.exports = {
    implementations: apiListVersion1
};
