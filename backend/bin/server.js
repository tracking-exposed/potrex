var express = require('express');
var app = express();
var server = require('http').Server(app);
var _ = require('lodash');
var moment = require('moment');
var bodyParser = require('body-parser');
var Promise = require('bluebird');
var mongodb = Promise.promisifyAll(require('mongodb2'));
var debug = require('debug')('potrex');
var nconf = require('nconf');
var pug = require('pug');
var cors = require('cors');

var utils = require('../lib/utils');
var APIs = require('../lib/api');
var mongo = require('../lib/mongo');

var cfgFile = "config/settings.json";
var redOn = "\033[31m";
var redOff = "\033[0m";

nconf.argv().env().file({ file: cfgFile });

console.log(redOn + "ઉ nconf loaded, using " + cfgFile + redOff);

if(!nconf.get('interface') || !nconf.get('port') )
    throw new Error("check your config/settings.json, config of 'interface' and 'post' missing");

var returnHTTPError = function(req, res, funcName, where) {
    debug("%s HTTP error 500 %s [%s]", req.randomUnicode, funcName, where);
    res.status(500);
    res.send();
    return false;
};


/* This function wraps all the API call, checking the verionNumber
 * managing error in 4XX/5XX messages and making all these asyncronous
 * I/O with DB, inside this Bluebird */
function dispatchPromise(name, req, res) {

    var apiV = _.parseInt(_.get(req.params, 'version'));

    /* force version to the only supported version */
    debug("%s name %s (%s)", moment().format("HH:mm:ss"), name, req.url);

    var func = _.get(APIs.implementations, name, null);

    if(_.isNull(func)) {
        debug("Invalid function request");
        return returnHTTPError(req, res, name, "function not found?");
    }

    /* in theory here we can keep track of time */
    return new Promise.resolve(func(req))
      .then(function(httpresult) {

          if(_.isObject(httpresult.headers))
              _.each(httpresult.headers, function(value, key) {
                  debug("Setting header %s: %s", key, value);
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
              debug("Undetermined failure in API call, result →  %j", httpresult);
              console.trace();
              return returnHTTPError(req, res, name, "Undetermined failure");
          }
          return true;
      })
      .catch(function(error) {
          debug("%s Trigger an Exception %s: %s",
              req.randomUnicode, name, error);
          return returnHTTPError(req, res, name, "Exception");
      });
};

/* everything begin here, welcome */
server.listen(nconf.get('port'), nconf.get('interface'));
console.log(" Listening on http://" + nconf.get('interface') + ":" + nconf.get('port'));
/* configuration of express4 */
app.use(cors());
app.use(bodyParser.json({limit: '4mb'}));
app.use(bodyParser.urlencoded({limit: '4mb', extended: true}));


/* This to actually post the event collection */
app.post('/api/v:version/events', function(req, res) {
    return dispatchPromise('processEvents', req, res);
});
app.get('/api/v1/html/:htmlId', function(req, res) {
    return dispatchPromise('unitById', req, res);
});
/* This is the beginning project, this is a new tes to see how much does make sense */
app.get('/api/v1/basic', function(req, res) {
    return dispatchPromise('getBasicData', req, res);
});
app.get('/api/v1/selected/:pseudo', function(req, res) {
    return dispatchPromise('getSelectedData', req, res);
});
app.get('/api/v1/radar/:pseudos', function(req, res) {
    return dispatchPromise('getRadarData', req, res);
});
