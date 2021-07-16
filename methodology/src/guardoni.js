#!/usr/bin/env node
const _ = require('lodash');
const debug = require('debug')('guardoni:po-cli');
const bcons = require('debug')('browser:console');
const puppeteer = require("puppeteer-extra")
const { TimeoutError } = require("puppeteer/lib/api");
const pluginStealth = require("puppeteer-extra-plugin-stealth");
const nconf = require('nconf');
const moment = require('moment');
const fetch = require('node-fetch');
const path = require('path');
const util = require('util');
const fs = require('fs');
const execSync = require('child_process').execSync;
const { fn } = require('moment');

nconf.argv().env();
const DELAY = nconf.get('delay') || 10000;
const skip = nconf.get('skip') || 0;

const COMMANDJSONEXAMPLE = "https://pornhub.tracking.exposed/json/guardoni.json";
const EXTENSION_WITH_OPT_IN_ALREADY_CHECKED='https://github.com/tracking-exposed/potrex/releases/download/0.4.99/extension.zip';

function downloadExtension(zipFileP) {
  debug("Executing curl and unzip (if these binary aren't present in your system please mail support at tracking dot exposed because you might have worst problems)");
  execSync('curl -L ' + EXTENSION_WITH_OPT_IN_ALREADY_CHECKED + " -o " + zipFileP);
  execSync('unzip ' + zipFileP + " -d extension");
}

async function keypress() {
  process.stdin.setRawMode(true)
  return new Promise(resolve => process.stdin.once('data', () => {
    process.stdin.setRawMode(false)
    resolve()
  }))
}

async function allowResearcherSomeTimeToSetupTheBrowser() {
  console.log("\nNow you can configure your browser!\nFor example, default settings, accept cookie banners, etc\n");
  console.log("When you're done, press enter and the automated navigation would start");
  console.log("\nThis happens because it is the profile initialization");
  await keypress();
}

function timeconv(maybestr, defaultMs) {
  if(_.isInteger(maybestr) && maybestr > 100) {
    // it is already ms 
    return maybestr;
  } else if(_.isInteger(maybestr) && maybestr < 100) {
    // throw an error as it is unclear if you forgot the unit 
    throw new Error("Did you forget unit? " + maybestr + " milliseconds is too little!");
  } else if(_.isString(maybestr) && _.endsWith(maybestr, 's')) {
    return _.parseInt(maybestr) * 1000;
  } else if(_.isString(maybestr) && _.endsWith(maybestr, 'm')) {
    return _.parseInt(maybestr) * 1000 * 60;
  } else if(_.isString(maybestr) && maybestr == 'end') {
    return 'end';
  } else {
    throw new Error(`Expected time/number but got [${maybestr}]`);
  }
}

async function fetchAndEnrichDirectives(sourceUrl, profile, experiment) {
  let retval = null;
  try {
    if(_.startsWith(sourceUrl, 'http')) {
      const response = await fetch(sourceUrl);
      if(response.status !== 200) {
        console.log("Error in fetching directives from URL", response.status);
        process.exit(1);
      }
      retval = await response.json();
      debug("directives loaded from URL: %j", _.map(retval, 'name'));
    } else {
      directives = JSON.parse(fs.readFileSync(sourceUrl, 'utf-8'));
      debug("directives loaded from file: %j", _.map(retval, 'name'));
    }
    if(!retval.length) {
      console.log("URL/file do not include any directive in expected format");
      console.log("Check the example with --source ", COMMANDJSONEXAMPLE);
      process.exit(1);
    }
  } catch (error) {
    console.log("Error in retriving directive URL: " + error.message);
    // console.log(error.response.body);
    process.exit(1);
  }

  try {
    /* enrich directives with profile and experiment name */
    return _.map(retval, function(d) {
      const screenshotAfterSwp = d.screenshotAfter;
      const loadForSwp = d.loadFor;

      d.loadFor = timeconv(loadForSwp, 3000);
      d.screenshotAfter = timeconv(screenshotAfterSwp, 20000);
      d.profile = profile;
      if(experiment)
        d.experiment = experiment;

      debug("Time conversion: loadFor %s screenshotAfter %s (%j)",
        d.loadFor, d.screenshotAfter, _.keys(d));
      return d;
    });
  } catch(error) {
    console.log("Error in directive enrichment:", error);
    process.exit(1);
  }
}

async function fetchAPIFY() {
  const response = await fetch('https://api.ipify.org?format=json');
  const value = await response.json();
  debug("Your IP address is %s", value.ip);
  return value.ip;
}

function saveActivityLogs(ip, profile, info) {
  const when = moment().format("YYYY-MM-DD_HH-mm");
  const actlfp = path.join('activitylogs', `${profile}-${when}.json`)
  debug("Saving activity log for %s %s %j in %s", ip, profile, info, actlfp);
  fs.writeFileSync(actlfp, JSON.stringify({
    when,
    ip,
    ...info,
  }, undefined, 2), 'utf-8');
  debug("..saved!");
  return actlfp;
}

function extendActivityLogs(fname, additional) {
  console.log("TODO", fname, additional);
}

function acquireCommandLineInfo() {
  const os = nconf.get('os');
  const device = nconf.get('device');
  const browser = nconf.get('browser');
  const city = nconf.get('city');

  if(!os || !device || !browser || !city) {
    console.log("Mandatory options: --os --device --browser --city");
    process.exit(1)
  }

  return {
    os,
    device,
    browser,
    city
  }
}

async function main() {

  const execInfo = acquireCommandLineInfo();

  const sourceUrl = nconf.get('source');
  if(!sourceUrl) {
    console.log("Mandatory configuration! for example --source " + COMMANDJSONEXAMPLE);
    console.log("Via --source you can specify an URL <or> a filepath")
    console.log(`\nIt should be a valid JSON with objects like: [ {
      "watchFor": <number in millisec>,
      "url": "https://youtube.come/v?videoNumber1",
      "name": "optional, in case you want to see this label, specifiy DEBUG=* as environment var"
    }, {...}
]\n\tDocumentation: https://youtube.tracking.exposed/automation`);
    process.exit(1);
  }

  const cwd = process.cwd();
  const dist = path.resolve(path.join(cwd, 'extension'));
  const manifest = path.resolve(path.join(cwd, 'extension', 'manifest.json'));
  if(!fs.existsSync(manifest)) {
    console.log('Manifest in ' + dist + ' not found, the script now would download & unpack');
    const tmpzipf = path.resolve(path.join(cwd, 'extension', 'tmpzipf.zip'));
    console.log("Using " + tmpzipf + " as temporary file");
    downloadExtension(tmpzipf);
  }


  if(!fs.existsSync(dist)) {
    console.log('Directory '+ dist +' not found, please download:');
    console.log('https://github.com/tracking-exposed/potrex/releases/download/0.4.99/extension.zip');
    console.log("and be sure manifest.json is in" + dist);
    process.exit(1)
  }

  const profile = nconf.get('profile');
  if(!profile) {
    console.log("--profile it is necessary and must be an absolute path, you con configure it with:")
    process.exit(1)
  }

  /* gets directive and do a network connection to know your own IP address */
  const experiment = nconf.get('experiment');
  const directives = await fetchAndEnrichDirectives(sourceUrl, profile, experiment);
  const yourIP = await fetchAPIFY();

  /* profile last check and possible initialization */
  let setupDelay = false;
  const udd = path.resolve(path.join('profiles', profile));
  if(!fs.existsSync(udd)) {
    console.log("--profile name hasn't an associated directory: " + udd + "\nLet's create it!");
    // console.log(localbrowser," --user-data-dir=profiles/path to initialize a new profile");
    // process.exit(1)
    fs.mkdirSync(udd);
    setupDelay = true;
  }

  let browser = null;
  const puppeteerConfig = {
    headless: false,
    userDataDir: udd,
    args: ["--no-sandbox",
      "--disabled-setuid-sandbox",
      "--load-extension=" + dist,
      "--disable-extensions-except=" + dist
    ],
  };
  if(nconf.get('chrome')) 
    puppeteerConfig.executablePath = nconf.get('chrome');

  if(setupDelay)
    await allowResearcherSomeTimeToSetupTheBrowser();

  let activitylogfilen = null;
  try {
    activitylogfilen = saveActivityLogs(yourIP, profile, execInfo);
  } catch(erro) {
    console.log("Unable to save activity logs", erro);
    process.exit(1)
  }

  try {
    puppeteer.use(pluginStealth());
    browser = await puppeteer.launch(puppeteerConfig);
    try {
      const results = await operateBrowser(browser, directives, sourceUrl);
      extendActivityLogs(results, activitylogfilen);
      debug("Tasks completed: happyly closing thiz script!")
    } catch(error) {
      console.log("Error spotted in browser execution: %s", error.message, "details", error.stack);
      console.log("Please take the last directive number and execute the command with --skip <number> as option");
    }
    await browser.close();
  } catch(error) {
    console.log("Error spotted in browser management:", error.message);
    await browser.close();
  }
  process.exit(1);
}

async function setPageEvent(page) {
  page
    .on('console', function(message) {
      bcons(`${message.text()}`);
      if(message.text().match(/publicKey/)) {
          const extensioninfo = JSON.parse(message.text());
          console.log("The publicKey: ", extensioninfo.publicKey);
      }
    })
    .on('pageerror', ({ message }) => debug('error' + message)) /*
    .on('response', response =>
      debug(`response: ${response.status()} ${response.url()}`))
    .on('requestfailed', request =>
      debug(`requestfail: ${request.failure().errorText} ${request.url()}`)); */
}

async function operateBrowser(browser, directives, sourceUrl) {
  const page = (await browser.pages())[0];
  const version = await page.browser().version();
  const retval = {
    version,
    accessLog: []
  }
  // await page.setViewport({width: 1024, height: 768});
  let counter = 0;
  await setPageEvent(page);
  for (const directive of directives) {
    counter++;
    try {
      console.log(`directive ${counter} ${directive.name} ${directive.url}`);
      await page.goto(directive.url, { 
        waitUntil: "networkidle2",
      });
      debug(`Loaded page successfully, now waiting for ${DELAY}milliseconds`);
      await page.waitFor(DELAY);
      const profileStory = await page.evaluate(() => {
        const jsonHistory = localStorage.getItem('watchedVideoIds');
        try {
          return JSON.parse(jsonHistory);
        } catch(error) {
          console.log("Unable to extract profileStory, assuming it is a clean profile?");
          return [];
        }
      });
      // add cookies and localStorage 
      retval.accessLog.push({
        when: new Date(),
        what: directive.url,
        why: directive.name
      })
      const lamecookies = await page.cookies();
      const cookies = await page._client.send('Network.getAllCookies');
      debug("%j --- %j", lamecookies, cookies);
    } catch(error) {
      console.log(`Error in directive execution ${error}`);
    }
  }
  console.log("Loop done, processed directives:", directives.length);
  return retval
}

main ();
