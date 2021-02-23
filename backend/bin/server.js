#!/usr/bin/env node
const express = require('express');
const app = express();
const server = require('http').Server(app);
const _ = require('lodash');
const bodyParser = require('body-parser');
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
async function dispatchPromise(name, req, res) {
    var func = _.get(APIs.implementations, name, null);
    if(_.isNull(func)) {
        debug("API name %s (%s): ERROR: missing function", name, req.url);
        return returnHTTPError(req, res, name, "Server Error");
    }
    try {
        const httpresult = await func(req);

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

    } catch(error) {
        debug("API %s %s - Trigger an Exception: %s",
            name, req.url, error);
        return returnHTTPError(req, res, name, "Exception");
    }
};

/* everything begin here, welcome */
server.listen(nconf.get('port'), nconf.get('interface'));
console.log(" Listening on http://" + nconf.get('interface') + ":" + nconf.get('port'));
/* configuration of express4 */
app.use(cors());
app.use(bodyParser.json({limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true, parameterLimit: 10 }));

app.get('/api/v1/uptime', async (req, res) => {
    res.send("OK");
});

/* LEGACY TO BE VERIFIED */
app.get('/api/v1/basic', async (req, res) => {
    return await dispatchPromise('getBasicData', req, res);
});
app.get('/api/v1/selected/:pseudo', async (req, res) => {
    return await dispatchPromise('getSelectedData', req, res);
});
app.get('/api/v1/radar/:pseudos', async (req, res) => {
    return await dispatchPromise('getRadarData', req, res);
});
app.get('/api/v2/statistics/:name/:unit/:amount', async (req, res) => {
    return await dispatchPromise('getStatistics', req, res);
});

app.get('/api/v2/random', async (req, res) => {
    return await dispatchPromise('getRandomRecent', req, res);
});

/* SOON TO BECOME STANDARD */
app.get('/api/v1/last', async (req, res) => {
    return await dispatchPromise('getLast', req, res);
});
app.get('/api/v1/videoId/:query', async (req, res) => {
    return await dispatchPromise('getVideoId', req, res);
});
app.get('/api/v1/related/:query', async (req, res) => {
    return await dispatchPromise('getRelated', req, res);
});
app.get('/api/v1/videoCSV/:query/:amount?', async (req, res) => {
    return await dispatchPromise('getVideoCSV', req, res);
});
app.get('/api/v1/home/:amount?', async (req, res) => {
    return await dispatchPromise('getHomes', req, res);
});
app.get('/api/v1/homeUnwindedCSV', async (req, res) => {
    return await dispatchPromise('getUnwindedHomeCSV', req, res);
});
app.get('/api/v1/homeCSV/:amount?', async (req, res) => {
    return await dispatchPromise('getHomeCSV', req, res);
});
app.get('/api/v1/author/:query/:amount?', async (req, res) => {
    return await dispatchPromise('getByAuthor', req, res);
});
app.post('/api/v:version/validate', async (req, res) => {
    return await dispatchPromise('validateKey', req, res);
});
app.post('/api/v2/events', async (req, res) => {
    return await dispatchPromise('processEvents2', req, res);
});
app.get('/api/v1/personal/:publicKey/csv', async (req, res) => {
    return await dispatchPromise('getPersonalCSV', req, res);
});
app.get('/api/v1/personal/:publicKey/:what?', async (req, res) => {
    return await dispatchPromise('getPersonal', req, res);
});
app.delete('/api/v2/personal/:publicKey/selector/id/:id', async (req, res) => {
    return await dispatchPromise('removeEvidence', req, res);
});
app.get('/api/v2/personal/:publicKey/selector/:key/:value', async (req, res) => {
    return await dispatchPromise('getEvidences', req, res);
});
/* delete a group from your profile, create a new tagId */
app.delete('/api/v2/profile/:publicKey/tag/:tagId', async (req, res) => {
    return await dispatchPromise('removeTag', req, res);
});
app.post('/api/v2/profile/:publicKey/tag', async (req, res) => {
    return await dispatchPromise("createTag", req, res);
});

/* update and current profile */
app.get('/api/v2/profile/:publicKey/tag', async (req, res) => {
    return await dispatchPromise('profileStatus', req, res);
});
app.post('/api/v2/profile/:publicKey', async (req, res) => {
    return await dispatchPromise("updateProfile", req, res);
});

/* new since react */
app.get('/api/v2/raw/:publicKey/:paging?', async (req, res) => {
    return await dispatchPromise('getSubmittedRAW', req, res);
});

/* reserarch api */
app.get('/api/v2/research/homes/errors', async (req, res) => {
    return await dispatchPromise('researchErrors', req, res);
});
app.get('/api/v2/research/queries/:keylist', async (req, res) => {
    return await dispatchPromise('queries', req, res);
});
app.get('/api/v2/research/queries/:keylist/CSV', async (req, res) => {
    return await dispatchPromise('queriesCSV', req, res);
});
app.get('/api/v2/research/query/:metadataId/guardoni', async (req, res) => {
    return await dispatchPromise('guardoniv1ByMetadata', req, res);
});

/* ADMIN */
app.get('/api/v1/mirror/:key', async (req, res) => {
    return await dispatchPromise('getMirror', req, res);
});

/* monitor for admin */
    app.get('/api/v2/monitor/:minutes?', async (req, res) => {
    return await dispatchPromise('getMonitor', req, res);
});

// https://pornhub.tracking.exposed/api/v2/file/personalized-history.csv
app.get('/api/v2/file/personalized-history.csv', function(req, res) {
    const file = `${__dirname}/../downloadable/personalized-history.csv`;
    debug("Downloading %s", file);
    res.download(file); 
});
// https://pornhub.tracking.exposed/api/v2/file/research-home.csv
app.get('/api/v2/file/research-home.csv', function(req, res) {
    const file = `${__dirname}/../downloadable/research-home.csv`;
    debug("Downloading %s", file);
    res.download(file); 

// https://pornhub.tracking.exposed/api/v2/file/personalized-history.json
app.get('/api/v2/file/personalized-history.json', function(req, res) {
    const file = `${__dirname}/../downloadable/personalized-history.json`;
    debug("Downloading %s", file);
    res.download(file); 
});
// https://pornhub.tracking.exposed/api/v2/file/research-home.json
app.get('/api/v2/file/research-home.json', function(req, res) {
    const file = `${__dirname}/../downloadable/research-home.json`;
    debug("Downloading %s", file);
    res.download(file); 
});

/* Capture All 404 errors */
app.use(async (req, res, next) => {
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

