import db from '../db';
const bo = chrome || browser;


bo.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'chromeConfig') {
        db
        .get('/settings')
        .then(settings => {
            sendResponse({
                userId: "local",

                // Expose only what we need
                settings: settings ? {
                    lessInfo: settings.lessInfo,
                    tagId: settings.tagId,
                    isStudyGroup: settings.isStudyGroup
                } : {
                    lessInfo: false,
                    tagId: null,
                    isStudyGroup: false
                },

                logo16: bo.extension.getURL('potrex16.png'),
                logo48: bo.extension.getURL('potrex48.png'),
                logo128: bo.extension.getURL('potrex128.png')
            });
        });
        return true;
    }
});
