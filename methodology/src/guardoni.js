const _ = require('lodash');
const debug = require('debug')('guardoni');
const bcons = require('debug')('browser:console');
const puppeteer = require("puppeteer-extra")
const { TimeoutError } = require("puppeteer/lib/api");
const pluginStealth = require("puppeteer-extra-plugin-stealth");
const nconf = require('nconf');
const fetch = require('node-fetch');
const path = require('path');
const fs = require('fs');

nconf.argv().env();
const DELAY = nconf.get('delay') || 10000;
const skip = nconf.get('skip') || 0;

async function main() {

  const sourceUrl = nconf.get('source');
  if(!sourceUrl) throw new Error("--source");
  let directives;
  try {
    const response = await fetch(sourceUrl);
    directives = await response.json();
    if(!directives.length)
      throw new Error("directives missing!");
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
    console.log("--profile it is necessary and must be an absolute path")
    process.exit(1)
  }
  const udd = path.resolve(profile);
  if(!fs.existsSync(udd)) {
    console.log("--profile directory do not exist" + udd);
    console.log("chromium --user-data-dir=profile/path to initialize a new profile");
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
      await operateBrowser(browser, directives);
    } catch(error) {
      console.log("Error spotted in browser execution: %s", error.message);
      console.log("Please take the last directive number and execute the command with --skip <number> as option");
    }
    await browser.close();
  } catch(error) {
    console.log("Error spotted in browser management:", error.message);
    await browser.close();
    process.exit(1);
  }
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

async function operateBrowser(browser, directives) {
  const page = (await browser.pages())[0];
  // await page.setViewport({width: 1024, height: 768});
  let counter = 0;
  for (directive of directives) {
    counter++;
    if(!(skip >= counter)) {
      await page.goto(directive, { 
        waitUntil: "networkidle0",
      });
      console.log("loaded", counter, "directive", directive);
      await setPageEvent(page);

      await page.waitFor(DELAY);
      // const innerWidth = await page.evaluate(_ => { return window.innerWidth });
      // const innerHeight = await page.evaluate(_ => { return window.innerHeight });

      const profileStory = await page.evaluate(() => {
        const jsonHistory = localStorage.getItem('watchedVideoIds');
        return JSON.parse(jsonHistory);
      });
      debug("Profile story (video logged in localstorage): %s", profileStory);
    } else {
      console.log("skipping directive %d: %s", counter, directive);
    }
  }
  console.log("Loop done, processed directives:", directives.length);
}

main ();
