const _ = require('lodash');
const expect    = require("chai").expect;
const nconf = require("nconf");
const Promise = require("bluebird");
const moment = require("moment");
const debug = require("debug")("test:parser");
const fs = Promise.promisifyAll(require('fs'));

// const testutils = require('lib/testutils');
const mongo = require("../lib/mongo");
const parsedet = require('../lib/parsedetails');

nconf.argv().env().file({ file: "config/settings.json" });

const videoList = [
    "ph5b5b77335fe46", "ph59c99c36df3bb", "ph5991dc924b852", "ph5b93ee01bac02",
    "ph5b826d89c763b", "ph5ba3eab94be8a", "ph5b7dfec88bdf1", "ph5bffea22805dc",
    "ph5bf1d70e186c9", "ph5bf471385873e"
];

describe("Load data (database and HTML)", function() {

  let dbloaded = [];
  it(`Load the ${_.size(videoList)} videos`, function() {
    return Promise.map(videoList, function(vId) {
      return mongo
        .readOne(nconf.get('schema').videos, {videoId: vId})
        .then(function(v) {
          dbloaded.push(v);
          return v.id ? true : null
        });
    }, { concurrency: 1})
    .then(_.compact)
    .tap(function(x) {
      expect(x).to.have.lengthOf(_.size(videoList));
      debug("%d, %d", _.size(_.keys(dbloaded)), _.size(videoList));
      expect(_.keys(dbloaded)).to.have.lengthOf(_.size(videoList));
    });
  });

  it(`Check URL parsing for ${_.size(dbloaded)} videos`, function() {
    _.each(dbloaded, function(video) {
      let result = parsedet.attributeURL(video.href);
      expect(result).has.keys(['href', 'type', 'videoId']);
      expect(result.type).to.be.equal('video');
    });
  });

  let fsloaded = [];
  it(`Load the HTMLs`, function() {
    return Promise.map(dbloaded, function(video) {
      return fs
        .readFileAsync(video.htmlOnDisk, 'utf-8')
        .then(function(content) {
          if(_.size(content) < 1000) return null;

          _.set(video, 'html', content);
          fsloaded.push(video);
        })
      }, { concurrency: 1})
      .tap(function() {
        debug("Video avail after html loading: %d", _.size(fsloaded));
        expect(_.size(fsloaded)).to.be.gt(0);
      });
  });

  it(`Check video metadata extraction from page ${_.size(fsloaded)} videos`, function() {
    _.each(fsloaded, function(video) {
      let meta = parsedet.getMetadata(video.html);
      expect(meta.title).to.be.instanceOf(String);
    });
  });

});
