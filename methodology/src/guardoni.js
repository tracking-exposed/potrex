const _ = require('lodash');
const debug = require('debug')('guardoni');
const bcons = require('debug')('browser:console');
const puppeteer = require("puppeteer-extra")
const { TimeoutError } = require("puppeteer/lib/api");
const pluginStealth = require("puppeteer-extra-plugin-stealth");
const nconf = require('nconf');
const fetch = require('node-fetch');
const path = require('path');
const util = require('util');
const fs = require('fs');

nconf.argv().env();
const DELAY = nconf.get('delay') || 10000;
const skip = nconf.get('skip') || 0;
const fatal = nconf.get('fatal') || false;

const defaults = {
  'windows': "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  'linux': "/usr/bin/google-chrome"
};

function findChromeExe(offered) {

  if(!offered || !_.size(offered)) {

    const lucky = _.compact(_.map(defaults, function(cpath, syname) {
      if(fs.existsSync(cpath)) {
        console.log("Guessed you're on", syname, "using chrome from:", cpath);
        return cpath;
      } else
        return null;
    }))

    if(lucky.length) // we're lucky to guess the chrome path
      return lucky.pop();

    console.log("Mandatory you specify with --chrome the absolute path of chrome executable. For example:");
    console.log(JSON.stringify(defaults, undefined, 2));
    process.exit(1)
  }

  if(!fs.existsSync(offered)) {
    console.log("The --chrome <absolute path> specifiy point at NON EXISTENT FILE\n", offered, "\nPlease review the --chrome option");
    console.log("Defaults:", JSON.stringify(defaults, undefined, 2));
    process.exit(1)
  }
  return offered;
}

async function localbrowser() {
  const readdir = util.promisify(fs.readdir);
  const localchromium = path.join(process.cwd(), 'node_modules', 'puppeteer', '.local-chromium');
  const files = await readdir(localchromium);
  // node_modules/puppeteer/.local-chromium/win64-722234/chrome-win/chrome.exe*
  const platformdir = path.join(localchromium, files[0]);
  const scndfiles = await readdir(platformdir);
  const effectivedir = path.join(platformdir, scndfiles[0]);
  if(scndfiles[0] == 'chrome-win') {
    return path.join(effectivedir, 'chrome.exe');
  } else if(scndfiles[0] == 'chrome-linux') {
    return path.join(effectivedir, 'chrome');
  } else {
    console.log("We assume you're not on windows nor in Linux— so please talk to claudio and tell him you're using mac");
    process.exit(1)
  }
}

async function main() {

  const homeOnly = !!nconf.get('home') || false;
  const sourceUrl = nconf.get('source');
  let directives = null;
  if(homeOnly) {
    console.log("Loading a single directive to PH homepage");
    directives = [ 'https://www.pornhub.com' ]
  } else {
    if(!sourceUrl) {
      console.log("The directive should be a JSON file passed with --source option, for example:");
      console.log("--source https://pornhub.tracking.exposed/json/twenty-homepages.json");
      process.exit(1);
    }
  }

  try {
    if(!directives) {
      const response = await fetch(sourceUrl);
      directives = await response.json();
      if(!directives.length) {
        console.log("The directive downloaded looks like an empty list");
        process.exit(1);
      }
      if(!_.startsWith(directives[0], 'http')) {
        console.log("The directive downloaded do not contain a list with an URL.");
        process.exit(1);
      }
    }
  } catch (error) {
    debug("Error: %s", error.message);
    console.log(error.response.body);
    process.exit(1);
  }

  const chromeExecutable = findChromeExe(nconf.get('chrome'));

  // console.log("[XXXX IMPORTANT XXXXXX] you should run this command to build your dummy profile:\n",
  // await localbrowser(), "--user-data-dir=profiles/your-new-profile");
  // not true anymore, and 'localbrowser' function isn't invoked anymore.

  const cwd = process.cwd();
  const dist = path.resolve(path.join(cwd, 'extension', 'dist'));

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
  const udd = path.resolve(profile);
  if(!fs.existsSync(udd)) {
    console.log("--profile directory do not exist" + udd);
    console.log(await localbrowser(), "--user-data-dir=profiles/your-new-profile");
    process.exit(1)
  }
  if(DELAY < 10000)
    console.log("Warning delay is less than 10 seconds (--delay expect milliseconds)")
  let browser = null;
  try {
    puppeteer.use(pluginStealth());
    browser = await puppeteer.launch({
        headless: false,
        userDataDir: udd,
        executablePath: chromeExecutable,
        args: ["--no-sandbox",
          "--disabled-setuid-sandbox",
          "--load-extension=" + dist,
          "--disable-extensions-except=" + dist
        ],
    });
    try {
      await operateBrowser(browser, directives, sourceUrl);
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
  // await page.setViewport({width: 1024, height: 768});
  let counter = 0;
  await setPageEvent(page);
  for (const directive of directives) {
    counter++;
    if(!(skip >= counter)) {
      try {
        console.log("Loading directive", counter, "url:", directive, "from", sourceUrl);
        await page.goto(directive, { 
          waitUntil: "networkidle0",
        });
        debug("Loaded page! waiting", DELAY);
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
        console.log("Profile story (video logged in localstorage):", 
          profileStory ? profileStory.length: -1, "videos associated to this profile");
      } catch(error) {
        console.log("[!!!] Error in loading:", directive, "number", counter, "error", error.message, "details:\n", error.stack);
        // if it is fatal, it is because an explicit option say so
        if(fatal)
          process.exit(1);
      }
    } else {
      console.log("Skipping directive", counter, directive, "from", sourceUrl);
    }
  }
  console.log("Loop done, processed directives:", directives.length);
}

main ();

      // const innerWidth = await page.evaluate(_ => { return window.innerWidth });
      // const innerHeight = await page.evaluate(_ => { return window.innerHeight });