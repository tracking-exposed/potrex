#!/usr/bin/env node
const _ = require('lodash');
const debug = require('debug')('guardoni:notes');
const info = require('debug')('guardoni:info');
const bcons = require('debug')('guardoni:console');
const puppeteer = require("puppeteer-extra")
const pluginStealth = require("puppeteer-extra-plugin-stealth");
const fs = require('fs');
const path = require('path');
const nconf = require('nconf');
const moment = require('moment');
const fetch = require('node-fetch');
const execSync = require('child_process').execSync;

const domainSpecific = require('../src/domainSpecific');

const EXTENSION_WITH_OPT_IN_ALREADY_CHECKED="https://github.com/tracking-exposed/potrex/releases/download/0.4.99/extension.zip";
const COMMANDJSONEXAMPLE = "https://pornhub.tracking.exposed/json/guardoni.json";

const DELAY = nconf.get('delay') || 10000;
const skip = nconf.get('skip') || 0;

nconf.defaults({
  'headless': false,
  'proxy': "",
  'config_file' : "guardoniconf.json"
});

const defaultCfgPath = path.join("config", "default.json");
nconf.argv().env();
nconf.defaults({
  config: defaultCfgPath
});
const configFile = nconf.get('config');
nconf.argv().env().file(configFile);

/* this also happens in 'src/domainSpecific' and causes debug to print regardless of the 
 * environment variable sets */
debug.enabled = info.enabled = true;

const server = nconf.get('backend') ?
  ( _.endsWith(nconf.get('backend'), '/') ? 
    nconf.get('backend').replace(/\/$/, '') : nconf.get('backend') ) : 
  'https://pornhub.tracking.exposed';

async function keypress() {
  process.stdin.setRawMode(true)
  return new Promise(resolve => process.stdin.once('data', () => {
    process.stdin.setRawMode(false)
    resolve()
  }))
}

async function dispatchBrowser(headless, profinfo) {

  const cwd = process.cwd();
  const dist = path.resolve(path.join(cwd, 'extension'));
  const chromePath = getChromePath();
  const proxy = nconf.get('proxy');

  const commandLineArg = ["--no-sandbox",
    "--disabled-setuid-sandbox",
    "--load-extension=" + dist,
    "--disable-extensions-except=" + dist,
  ];

  if(proxy) {
    if(!_.startsWith(proxy, 'socks5://')) {
      console.log("Error, --proxy must start with socks5://");
      process.exit(1);
    }
    commandLineArg.push("--proxy-server=" + proxy);
    debug("Dispatching browser: profile usage %s proxy %s",
      profinfo.profileName, proxy);
  }
  else {
    debug("Dispatching browser: profile usage %s, with NO PROXY",
      profinfo.profileName);
  }

  let browser = null;
  try {
    puppeteer.use(pluginStealth());
    browser = await puppeteer.launch({
        headless,
        userDataDir: profinfo.udd,
        executablePath: chromePath,
        args: commandLineArg,
    });

    // add this boolean to the return value as we need it in a case
    browser.newProfile = profinfo.newProfile;
    return browser;

  } catch(error) {
    console.log("Error in dispatchBrowser:", error.message);
    if(browser)
      await browser.close();
    process.exit(1);
  }
}

async function operateTab(page, directive, counter) {

  try {
    await domainSpecific.beforeLoad(page, directive);
  } catch(error) {
    debug("error in beforeLoad %s %s directive %o",
      error.message, error.stack, directive);
  }

  const loadingTime = _.parseInt(nconf.get('load')) || directive.loadFor;
  debug("— Loading %s (for %dms)", directive.urltag ?
    directive.urltag : directive.name, loadingTime);
  // Remind you can exclude directive with env/--exclude=urltag

  // TODO the 'timeout' would allow to repeat this operation with
  // different parameters. https://stackoverflow.com/questions/60051954/puppeteer-timeouterror-navigation-timeout-of-30000-ms-exceeded
  await page.goto(directive.url, { 
    waitUntil: "networkidle0",
  });

  try {
    await domainSpecific.beforeWait(page, directive);
  } catch(error) {
    console.log("error in beforeWait", error.message, error.stack);
  }

  await page.waitForTimeout(loadingTime);

  const lasturllog = await domainSpecific.memorySaving(page, {
    directiveName: directive.name,
    url: directive.url,
    accessCount: counter
  });

  if(directive.screenshotAfter) {
    debug("Collecting screenshot after an addition delay of %dms", directive.screenshotAfter)
    page.waitForTimeout(directive.screenshotAfter);
    const screenshotname = path.join('activitylogs','screenshots',
        directive.profile + "-" + directive.name + "-" + moment().format("DD-HH-mm") + ".png");
    await page.screenshot({                      // Screenshot the website using defined options
        path: screenshotname,
        fullPage: true
    });
    debug("Screenshot take in %s", screenshotname);
    lasturllog.screenshotfile = screenshotname;
  }

  const loadFor = _.parseInt(nconf.get('load')) || directive.loadFor;
  debug("Directive to URL %s, Loading delay %d (--load optional)", directive.url, loadFor);
  await page.waitForTimeout(loadFor);

  try {
    await domainSpecific.afterWait(page, directive);
  } catch(error) {
    console.log("Error in afterWait", error.message, error.stack);
  }
  debug("— Completed %s", directive.urltag ? directive.urltag : directive.name);
  return lasturllog;
}

function initialSetup() {

  const cwd = process.cwd();
  const dist = path.resolve(path.join(cwd, 'extension'));
  const manifest = path.resolve(path.join(cwd, 'extension', 'manifest.json'));
  if(!fs.existsSync(dist))
    fs.mkdirSync(dist);
  if(!fs.existsSync(manifest)) {
    console.log('Manifest in ' + dist + ' not found, the script now would download & unpack');
    const tmpzipf = path.resolve(path.join(cwd, 'extension', 'tmpzipf.zip'));
    console.log("Using " + tmpzipf + " as temporary file");
    downloadExtension(tmpzipf);
  }

  return manifest;
}


async function validateAndStart(manifest) {
  /* initial test is meant to assure the extension is an acceptable version */

  const manifestValues = JSON.parse(fs.readFileSync(manifest));
  const vblocks = manifestValues.version.split('.');
  /* guardoni versioning explained:
    1.MAJOR.MINOR, 
    MINOR that starts with 99 or more 99 are meant to be auto opt-in
    MAJOR depends on the package.json version and it is used for feature support 
    a possible version 2.x isn't foresaw at the moment
   */
  const MINIMUM_ACCEPTABLE_MAJOR = 4;
  if(_.parseInt(vblocks[1]) < MINIMUM_ACCEPTABLE_MAJOR) {
    debug("vblocks %j vblocks[1] %d < %d", vblocks, vblocks[1], MINIMUM_ACCEPTABLE_MAJOR);
    console.log("Error/Warning: in the directory 'extension/' the software is too old: remove it!");
    process.exit(1);
  }

  if(!_.startsWith(vblocks[2], '99')) {
    console.log("Warning/Reminder: the extension used might not be opt-in! YOU NEED TO DO IT BY HAND");
    console.log("<Press any key to start>");
    await keypress();
  }

  /* this finally start the main execution */
  await main ();
}

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
  console.log("\nNow you can configure your browser!\nFor example, default settings, accept cookie banners, etc...");
  console.log("This happens because it is the profile initialization");
  console.log("When you're done, press [ENTER] and the automated navigation would start");
  await keypress();
}

function timeconv(maybestr) {
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

async function fetchAndEnrichDirectives(sourceUrl, profile) {
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
      retval = JSON.parse(fs.readFileSync(sourceUrl, 'utf-8'));
      debug("directives loaded from file %s: %j", sourceUrl, _.map(retval, 'name'));
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
    /* enrich directives with profile name and conver strings to ms */
    return _.map(retval, function(d) {
      const screenshotAfterSwp = d.screenshotAfter;
      const loadForSwp = d.loadFor;

      d.loadFor = timeconv(loadForSwp);
      d.screenshotAfter = screenshotAfterSwp && screenshotAfterSwp.length ?
        timeconv(screenshotAfterSwp) : null;
      d.profile = profile;

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
  const timestr = moment().format("YYYY-MMM-DD_HH-mm");
  const actlfp = path.join('activitylogs', `${profile}-${timestr}.json`)
  if(global.publicKeySpot)
    info.publicKey = global.publicKeySpot;

  debug("Saving activity log for %s %s %j in %s", ip, profile, info, actlfp);
  fs.writeFileSync(actlfp, JSON.stringify({
    when: new Date().toISOString(),
    ip,
    ...info,
  }, undefined, 2), 'utf-8');
  debug("..saved with keys [%j]!", _.keys(info));
  return actlfp;
}

function extendActivityLogs(additional, fname, markAsError) {
  const existing = fs.readFileSync(fname, 'utf-8');
  const data = existing ? JSON.parse(existing) : { incomplete: true };

  fs.writeFileSync(fname, JSON.stringify({
    ...data,
    ...additional}, undefined, 2), 'utf-8');

  if(markAsError) {
    const errorfname = `error-${fname}`;
    const fullename = path.join('activitylogs', errorfname);
    fs.renameSync(fname, fullename);
    console.log(`Renamed ${fname} to ${fullename}`);
  }
}

function acquireCommandLineInfo() {
  const osinfo = nconf.get('os');
  const device = nconf.get('device');
  const browser = nconf.get('browser');
  const city = nconf.get('city');

  if( (!osinfo?.length || !device?.length || !browser?.length || !city?.length) && !nconf.get('nope')) {
    console.log("Mandatory options: --os --device --browser --city");
    console.log("They are usually supply from file 'config/default.json' overrided by --config");
    process.exit(1)
  }

  return {
    osinfo,
    device,
    browser,
    city
  }
}

function getChromePath() {
  // this function check for standard chrome executabled path and
  // return it. If not found, raise an error
  const knownPaths = [
    "/usr/bin/google-chrome",
    "/Program Files (x86)/Google/Chrome/Application/chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
  ];

  const chromePath = _.find(knownPaths, function(p) {
    return fs.existsSync(p);
  })
  if(!chromePath) {
    console.log("Tried to guess your Chrome executable and wasn't found");
    console.log("Solutions: Install Google Chrome in your system or contact the developers");
    process.exit(1);
  }
  return chromePath;
}

async function main() {

  let browser, activitylogfilen, setupDelay = null;
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
  const directives = await fetchAndEnrichDirectives(sourceUrl, profile);
  const yourIP = await fetchAPIFY();

  /* profile last check and possible initialization */
  const udd = path.resolve(path.join('profiles', profile));
  if(!fs.existsSync(udd)) {
    console.log("--profile name hasn't an associated directory: " + udd + "\nLet's create it!");
    // console.log(localbrowser," --user-data-dir=profiles/path to initialize a new profile");
    // process.exit(1)
    fs.mkdirSync(udd);
    setupDelay = true;
  }

  try {
    activitylogfilen = saveActivityLogs(yourIP, profile, execInfo);
  } catch(error) {
    console.log("Unable to save activity logs", error);
    process.exit(1)
  }

  try {
    puppeteer.use(pluginStealth());
    browser = await dispatchBrowser(nconf.get('headless'), {
      profileName: profile,
      udd,
      newProfile: setupDelay
    });

    if(setupDelay)
      await allowResearcherSomeTimeToSetupTheBrowser();

    try {
      const results = await operateBrowser(browser, directives, { profileName: profile });
      console.log(`GUARDONI completed! Updating ${activitylogfilen} and closing`);
      extendActivityLogs(results, activitylogfilen);
    } catch(error) {
      console.log("Fatal error in browser execution", error.message, "details", error.stack);
    }
    await browser.close();
  } catch(error) {
    console.log("Fatal error in browser management", error.message, "details", error.stack);
  }
  console.log("Closing guardoni");
  process.exit(1);
}

async function operateBrowser(browser, directives, profinfo) {
  let counter = 0;
  const page = (await browser.pages())[0];
  const version = await page.browser().version();
  const retval = {
    version,
    accessLog: []
  }

  await domainSpecific.beforeDirectives(page, profinfo);
  for (const directive of directives) {
    counter++;
    try {
      console.log(`directive ${counter} ${directive.name} ${directive.url}`);
      const lasturllog = await operateTab(page, directive, counter);
      retval.accessLog.push(lasturllog);
    } catch(error) {
      debug("operateTab in %s — error: %s", directive.urltag, error.message);
    }
  }

  debug("Final timeout to ensure all the operations are done! (4s)");
  await page.waitForTimeout(4000);
  debug("Loop done, processed directives: %d", directives.length);
  return retval
}


try {

  const manifest = initialSetup();
  if(!manifest)
    process.exit(1);

  validateAndStart(manifest);

} catch(error) {
  console.error(error);
  console.error("⬆️ Unhandled error! =( ⬆️");
  process.exit(1);
}
