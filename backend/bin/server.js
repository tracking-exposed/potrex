#!/usr/bin/env node
const express = require('express');
const app = express();
const server = require('http').Server(app);
const _ = require('lodash');
const moment = require('moment');
const bodyParser = require('body-parser');
const Promise = require('bluebird');
const debug = require('debug')('potrex');
const nconf = require('nconf');
const cors = require('cors');

const dbutils = require('../lib/dbutils');
const APIs = require('../lib/api');
const security = require('../lib/security');

const cfgFile = "config/settings.json";
const redOn = "\033[31m";
const redOff = "\033[0m";


nconf.argv().env().file({ file: cfgFile });

console.log(redOn + "ઉ nconf loaded, using " + cfgFile + redOff);

if(!nconf.get('interface') || !nconf.get('port') )
    throw new Error("check your config/settings.json, config of 'interface' and 'post' missing");

var returnHTTPError = function(req, res, funcName, where) {
    debug("%s HTTP error 500 %s [%s]", req.url, funcName, where);
    res.status(500);
    res.send();
    return false;
};


/* This function wraps all the API call, checking the verionNumber
 * managing error in 4XX/5XX messages and making all these asyncronous
 * I/O with DB, inside this Bluebird */
function dispatchPromise(name, req, res) {

    var func = _.get(APIs.implementations, name, null);

    if(_.isNull(func)) {
        debug("API name %s (%s): ERROR: missing function", name, req.url);
        return returnHTTPError(req, res, name, "Server Error");
    }
    debug("executing API %s (%s)", name, req.url);

    /* in theory here we can keep track of time */
    return new Promise.resolve(func(req))
      .then(function(httpresult) {

          if(_.isObject(httpresult.headers))
              _.each(httpresult.headers, function(value, key) {
                  // debug("Setting header %s: %s", key, value);
                  res.setHeader(key, value);
              });

          if(httpresult.json) {
              debug("%s API success, returning JSON (%d bytes)",
                  name, _.size(JSON.stringify(httpresult.json)) );
              res.json(httpresult.json)
          } else if(httpresult.text) {
              debug("%s API success, returning text (size %d)",
                  name, _.size(httpresult.text));
              res.send(httpresult.text)
          } else if(httpresult.file) {
              /* this is used for special files, beside the css/js below */
              debug("API success, returning file (%s)",
                  name, httpresult.file);
              res.sendFile(__dirname + "/html/" + httpresult.file);
          } else {
              debug("Undetermined failure in API %s %s, result → %j",
                httpresult, name, req.url);
              return returnHTTPError(req, res, name, "Undetermined failure");
          }
          return true;
      })
      .catch(function(error) {
          debug("API %s %s - Trigger an Exception: %s",
              name, req.url, error);
          return returnHTTPError(req, res, name, "Exception");
      });
};

/* everything begin here, welcome */
server.listen(nconf.get('port'), nconf.get('interface'));
console.log(" Listening on http://" + nconf.get('interface') + ":" + nconf.get('port'));
/* configuration of express4 */
app.use(cors());
app.use(bodyParser.json({limit: '8mb' }));
app.use(bodyParser.urlencoded({ limit: '8mb', extended: true, parameterLimit: 10 }));

/* LEGACY TO BE VERIFIED */
app.get('/api/v1/basic', function(req, res) {
    return dispatchPromise('getBasicData', req, res);
});
app.get('/api/v1/selected/:pseudo', function(req, res) {
    return dispatchPromise('getSelectedData', req, res);
});
app.get('/api/v1/radar/:pseudos', function(req, res) {
    return dispatchPromise('getRadarData', req, res);
});
app.get('/api/v2/statistics/:name/:unit/:amount', function(req, res) {
    return dispatchPromise('getStatistics', req, res);
});

app.get('/api/v2/random', function(req, res) {
    return dispatchPromise('getRandomRecent', req, res);
});

/* SOON TO BECOME STANDARD */
app.get('/api/v1/last', function(req, res) {
    return dispatchPromise('getLast', req, res);
});
app.get('/api/v1/videoId/:query', function(req, res) {
    return dispatchPromise('getVideoId', req, res);
});
app.get('/api/v1/related/:query', function(req, res) {
    return dispatchPromise('getRelated', req, res);
});
app.get('/api/v1/videoCSV/:query/:amount?', function(req, res) {
    return dispatchPromise('getVideoCSV', req, res);
});
app.get('/api/v1/homeCSV/:amount?', function(req, res) {
    return dispatchPromise('getHomeCSV', req, res);
});
app.get('/api/v1/homeUnwindedCSV/:amount?', function(req, res) {
    return dispatchPromise('getUnwindedHomeCSV', req, res);
});
app.get('/api/v1/author/:query/:amount?', function(req, res) {
    return dispatchPromise('getByAuthor', req, res);
});
app.post('/api/v:version/validate', function(req, res) {
    return dispatchPromise('validateKey', req, res);
});
app.post('/api/v2/events', function(req, res) {
    return dispatchPromise('processEvents2', req, res);
});
app.get('/api/v1/personal/:publicKey/csv', function(req, res) {
    return dispatchPromise('getPersonalCSV', req, res);
});
app.get('/api/v1/personal/:publicKey/:what?', function(req, res) {
    return dispatchPromise('getPersonal', req, res);
});
app.delete('/api/v2/personal/:publicKey/selector/id/:id', (req, res) => {
    return dispatchPromise('removeEvidence', req, res);
});
app.get('/api/v2/personal/:publicKey/selector/:key/:value', (req, res) => {
    return dispatchPromise('getEvidences', req, res);
});
/* delete a group from your profile, create a new tagId */
app.delete('/api/v2/profile/:publicKey/tag/:tagId', (req, res) => {
    return dispatchPromise('removeTag', req, res);
});
app.post('/api/v2/profile/:publicKey/tag', (req, res) => {
    return dispatchPromise("createTag", req, res);
});

/* update and current profile */
app.get('/api/v2/profile/:publicKey/tag', (req, res) => {
    return dispatchPromise('profileStatus', req, res);
});
app.post('/api/v2/profile/:publicKey', (req, res) => {
    return dispatchPromise("updateProfile", req, res);
});

/* new since react */
app.get('/api/v2/raw/:publicKey/:paging?', function(req, res) {
    return dispatchPromise('getSubmittedRAW', req, res);
});


/* ADMIN */
app.get('/api/v1/mirror/:key', function(req, res) {
    return dispatchPromise('getMirror', req, res);
});

/* monitor for admin */
app.get('/api/v2/monitor/:minutes?', function(req, res) {
    return dispatchPromise('getMonitor', req, res);
});

/* Capture All 404 errors */
app.use(function (req, res, next) {
    debug("Reached URL %s: not handled!", req.originalUrl);
	res.status(404).send('Unable to find the requested resource!');
});


/* the remaining code */
security.checkKeyIsSet();

Promise.resolve().then(function() {
    return dbutils
        .checkMongoWorks()
        .then(function(result) {
            if(!result) {
                console.log("mongodb is not running - check", cfgFile,"- quitting");
                process.exit(1);
            } 
            debug("mongodb connection works!");
        })
});

