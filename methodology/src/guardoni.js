const _ = require('lodash');
const debug = require('debug')('methodology:test-1');
const bcons = require('debug')('browser:console');
const puppeteer = require("puppeteer-extra")
const { TimeoutError } = require("puppeteer/lib/api");
const pluginStealth = require("puppeteer-extra-plugin-stealth");
const nconf = require('nconf');
const fetch = require('node-fetch');
const path = require('path');

nconf.argv().env();

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
  const dist = path.resolve(path.join(cwd, '..', 'extension', 'dist'));
  const udd = path.resolve(path.join(cwd, 'profiles', 'qualcosa'));
  debug("%s %s", dist, udd);
  try {
    puppeteer.use(pluginStealth());
    const browser = await puppeteer.launch({
        headless: false,
        args: ["--no-sandbox",
          "--disabled-setuid-sandbox",
          "--load-extension=" + dist,
          "--disable-extensions-except=" + dist,
          "--user-data-dir=" + udd,
        ],
    });
    await operateBroweser(browser, directives);
  } catch(error) {
    console.log("cdcsdcsd errore", error);
    await browser.close();
    process.exit(1);
  }

}

async function operateBroweser(browser, directives) {
    const page = (await browser.pages())[0];
//    await page.setViewport({width: 1024, height: 768});
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
              debug("%j", extensioninfo);
          }
        })
        .on('pageerror', ({ message }) => debug('error' + message))
        .on('response', response =>
          debug(`response: ${response.status()} ${response.url()}`))
        .on('requestfailed', request =>
          debug(`requestfail: ${request.failure().errorText} ${request.url()}`));

      await page.waitFor(4000);
      const innerWidth = await page.evaluate(_ => { return window.innerWidth });
      const innerHeight = await page.evaluate(_ => { return window.innerHeight });
      debug("Completed! %s %s", innerHeight, innerWidth);

      try {

        const y = await page.evaluate(_ => { return document.querySelector('html')} );
        debug("frames -- html %j", y);
      }
      catch(error) {
        debug("error in primo test %s", error);
        process.exit(1);
      }

      await page.close();
    }

}

main ();
