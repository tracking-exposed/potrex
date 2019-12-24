ret = db.metadata.createIndex({id: 1}, {unique: true }); checkret('metadata id', ret);
ret = db.metadata.createIndex({videoId: 1}); checkret('metadata videoId', ret);
ret = db.metadata.createIndex({"related.videoId": 1}); checkret('metadata related.videoId', ret);
ret = db.metadata.createIndex({"producer.href": 1}); checkret('metadata producer.href', ret);
ret = db.metadata.createIndex({"sections.videos.href": 1}); checkret('metadata sections.videos.href', ret);
ret = db.metadata.createIndex({authorName: 1}); checkret('metadata authorName', ret);
ret = db.metadata.createIndex({publicKey: 1}); checkret('metadata publicKey', ret);
ret = db.metadata.createIndex({savingTime: -1}); checkret('metadata savingTime', ret);
ret = db.metadata.createIndex({type: -1}); checkret('metadata type', ret);

ret = db.supporters.createIndex({ publicKey: 1 }, { unique: true }); checkret('supporters publicKey:', ret);

ret = db.htmls.createIndex({ id: 1 }, { unique: true} ); checkret('htmls id', ret);
ret = db.htmls.createIndex({ savingTime: -1 }); checkret('htmls savingTime', ret);
ret = db.htmls.createIndex({ publicKey: -1 }); checkret('htmls publicKey', ret);
ret = db.htmls.createIndex({ metadataId: -1 }); checkret('htmls metadataId', ret);

ret = db.retrieved.createIndex({ id: 1 }, { unique: true} ); checkret('retrieved id', ret);
ret = db.retrieved.createIndex({ savingTime: -1 }); checkret('retrived savingTime', ret);

ret = db.thumbnails.createIndex({ id: 1 }, { unique: true} ); checkret('thumbnails id', ret);
ret = db.thumbnails.createIndex({ savingTime: -1 }); checkret('thumbnails savingTime', ret);

function checkret(info, retval) {
    retval.info = info;
    printjson(retval);
};
