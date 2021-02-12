const _ = require('lodash');
const debug = require('debug')('methodology:test-1');
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

async function dumpFrameTree(frame, indent) {
    const title = await frame.title();
    debug("%s %s %s (%s)", indent, frame.url(), frame.name(), title);
    for (const child of frame.childFrames()) {
        dumpFrameTree(child, indent + '  ');
    }
}


async function main() {

  const sourceUrl = nconf.get('source');
  if(!sourceUrl) throw new Error("--source");
  let directives;
  try {
    const response = await fetch(sourceUrl);
    directives = await response.json();
    debug("directives: %s", directives);
    debug("xxx: %j", response);
    if(!directives.length) throw new Error("directives missing!");
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
    await operateBroweser(browser, directives);
    await browser.close();
  } catch(error) {
    console.log("cdcsdcsd errore", error);
    await browser.close();
    process.exit(1);
  }

}

async function operateBroweser(browser, directives) {
  const page = (await browser.pages())[0];
  // await page.setViewport({width: 1024, height: 768});
  let extensioninfo = null;
  for (directive of directives) {
    await page.goto(directive, { 
      waitUntil: "networkidle0",
    });
    debug("loaded %s", directive);
    page
      .on('console', function(message) {
        bcons(`${message.text()}`);
        if(message.text().match(/publicKey/)) {
            extensioninfo = JSON.parse(message.text());
            console.log(extensioninfo);
        }
      })
      .on('pageerror', ({ message }) => debug('error' + message))
      .on('response', response =>
        debug(`response: ${response.status()} ${response.url()}`))
      .on('requestfailed', request =>
        debug(`requestfail: ${request.failure().errorText} ${request.url()}`));

    await page.waitFor(DELAY);
    // const innerWidth = await page.evaluate(_ => { return window.innerWidth });
    // const innerHeight = await page.evaluate(_ => { return window.innerHeight });

    const profileStory = await page.evaluate(() => {
      const jsonHistory = localStorage.getItem('watchedVideoIds');
      return JSON.parse(jsonHistory);
    });
    debug("Profile story (video logged in localstorage): %d  — %s",
      profileStory || 0, profileStory);
  }
  console.log("Loop done, processed directives:", directives.length);
}

main ();
