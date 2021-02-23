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
  } else {
    console.log("Assuming if you're not on windows you're on Linux");
    return path.join(effectivedir, 'chrome');
  }
}

async function main() {

  const sourceUrl = nconf.get('source');
  if(!sourceUrl) throw new Error("--source");
  let directives;
  try {
    const response = await fetch(sourceUrl);
    directives = await response.json();
    if(!directives.length)
      throw new Error("directives missing!");
    if(!_.startsWith(directives[0], 'http')) {
      console.log("The directive downloaded do not contain a list with an URL.");
    }
  } catch (error) {
    debug("Error: %s", error.message);
    console.log(error.response.body);
    process.exit(1);
  }

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
    console.log(await localbrowser(), "--user-data-dir=profiles/your-new-profile");
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