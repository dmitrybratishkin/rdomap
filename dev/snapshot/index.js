console.log('Welcome!');

/** @type {Object[]} The collection of sites that will be used for screenshotting. */
let sites = [];

// Imports, yada yada, boring.
const ProgressBar = require('progress');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Here we see my laziness, instead of finding the file on my FS, I just launch a local server and download them.
function downloadFileSync(url) {
  return require('child_process').execFileSync('curl', ['--silent', '-L', url], { encoding: 'utf8' });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Set up the URL bases.
const collectorBase = 'http://localhost/?z=4&ft=-75,110&c=red&theme=black';
const rdoMapBase = 'http://localhost/rdo/?z=4&ft=-75,110&c=red&theme=black';

/**
 * COLLECTOR ITEMS
 * Get all categories and items for each cycle in the items.json file.
 * If an item has 1 location on the map, make it a short image to be clearer.
 */
let collectorItems = downloadFileSync('http://localhost/data/items.json');
collectorItems = JSON.parse(collectorItems);

Object.keys(collectorItems).forEach(k => {
  const category = collectorItems[k];
  Object.keys(category).forEach(ck => {
    // Category items.
    sites.push({
      name: `${k}_${ck}`,
      type: 'long',
      url: `${collectorBase}&q=${k}&cycles=${ck}`,
    });

    // Individual items.
    const items = collectorItems[k][ck];
    items.forEach(item => {
      if (item.text.includes('random')) return;
      if (item.text.match(/_[0-9]$/)) {
        const name = item.text.replace(/_[0-9]$/, '');
        if (sites.some(s => s.name === `${name}_${ck}`)) return;

        sites.push({
          name: `${name}_${ck}`,
          type: 'long',
          url: `${collectorBase}&q=${name}&cycles=${ck}`,
        });
      } else {
        sites.push({
          name: `${item.text}_${ck}`,
          type: 'short',
          url: `${collectorBase}&q=${item.text}&cycles=${ck}`,
        });
      }
    });
  });
});

/**
 * ANIMAL ITEMS
 * Will add each animal heatmap to the list of sites, they are always long images.
 */
let animalItems = downloadFileSync('http://localhost/rdo/data/hm.json');
animalItems = JSON.parse(animalItems);

animalItems.forEach(category => {
  category.data.forEach(animal => {
    sites.push({
      name: animal.key,
      type: 'long',
      url: `${rdoMapBase}&q=${animal.key}`,
    });
  });
});

/**
 * ENCOUNTER ITEMS
 * Will add encounters to the list, while there isn't a single location encounter for now,
 * check it just to be safe and to be future-proof.
 */
let encounterItems = downloadFileSync('http://localhost/rdo/data/encounters.json');
encounterItems = JSON.parse(encounterItems);

encounterItems.forEach(item => {
  sites.push({
    name: item.key,
    type: item.locations.length !== 1 ? 'long' : 'short',
    url: `${rdoMapBase}&q=${item.key}`,
  });
});

/**
 * CAMP ITEMS
 * Will add camps to the list, while there isn't a single location camp for now,
 * check it just to be safe and to be future-proof.
 */
let campItems = downloadFileSync('http://localhost/rdo/data/camps.json');
campItems = JSON.parse(campItems);

campItems.forEach(item => {
  sites.push({
    name: item.key,
    type: item.locations.length !== 1 ? 'long' : 'short',
    url: `${rdoMapBase}&q=${item.key}`,
  });
});

/**
 * MISC ITEMS
 * Will add misc items to the list, while there isn't a single location for now,
 * check it just to be safe and to be future-proof.
 */
let miscItems = downloadFileSync('http://localhost/rdo/data/items.json');
miscItems = JSON.parse(miscItems);

miscItems.forEach(item => {
  sites.push({
    name: item.key,
    type: item.locations.length !== 1 ? 'long' : 'short',
    url: `${rdoMapBase}&q=${item.key}`,
  });
});

/**
 * ENCOUNTER ITEMS
 * Will add plants to the list, while there isn't a single location plant for now,
 * check it just to be safe and to be future-proof.
 */
let plantItems = downloadFileSync('http://localhost/rdo/data/plants.json');
plantItems = JSON.parse(plantItems);

plantItems.forEach(item => {
  sites.push({
    name: item.key,
    type: item.locations.length !== 1 ? 'long' : 'short',
    url: `${rdoMapBase}&q=${item.key}`,
  });
});

/**
 * SHOP ITEMS
 * Will add shops to the list, tackle has only one location, so check for it.
 */
let shopItems = downloadFileSync('http://localhost/rdo/data/shops.json');
shopItems = JSON.parse(shopItems);

shopItems.forEach(item => {
  sites.push({
    name: item.key,
    type: item.locations.length !== 1 ? 'long' : 'short',
    url: `${rdoMapBase}&q=${item.key}`,
  });
});

/**
 * TREASURE ITEMS
 * Treasures will always be zoomed in on the map, so they are always short images.
 */
let treasureItems = downloadFileSync('http://localhost/rdo/data/treasures.json');
treasureItems = JSON.parse(treasureItems);

treasureItems.forEach(item => {
  sites.push({
    name: item.text,
    type: 'short',
    url: `${rdoMapBase}&q=${item.text}`,
  });
});

/**
 * GUN FOR HIRE ITEMS
 * Will add gfh to the list, certain gfhs have only 1 location, so check for it.
 */
let gfhItems = downloadFileSync('http://localhost/rdo/data/gfh.json');
gfhItems = JSON.parse(gfhItems);

gfhItems.forEach(item => {
  sites.push({
    name: item.key,
    type: item.locations.length !== 1 ? 'long' : 'short',
    url: `${rdoMapBase}&q=${item.key}`,
  });
});

/**
 * LEGENDARY ANIMALS ITEMS
 * Legendaries will always be zoomed in on the map, so they are always short images.
 */
let legendaryItems = downloadFileSync('http://localhost/rdo/data/animal_legendary.json');
legendaryItems = JSON.parse(legendaryItems);

legendaryItems.forEach(item => {
  sites.push({
    name: item.text,
    type: 'short',
    url: `${rdoMapBase}&q=${item.text}`,
  });
});

/**
 * NAZAR ITEMS
 * Nazar has 12 locations, just use a for loop to add them all.
 */
for (let i = 0; i < 12; i++) {
  sites.push({
    name: `nazar_${i}`,
    type: 'short',
    url: `${rdoMapBase}&q=nazar&nazar=${i}`,
  });
}

/**
 * BOUNTIES
 * Bounties are split into multiple categories, just use a for loop to add them all.
 */
let bountyItems = downloadFileSync('http://localhost/rdo/data/bounties.json');
bountyItems = JSON.parse(bountyItems);

bountyItems.forEach(item => {
  item.locations.forEach(bounty => {
    const full = `${item.key}_${bounty.text}`;
    sites.push({
      name: full,
      type: 'short',
      url: `${rdoMapBase}&q=${full}`,
    });
  });
});

/**
 * CONDOR EGGS
 * Condor Eggs has 3 locations, just use a for loop to add them all.
 */
let condorItems = downloadFileSync('http://localhost/rdo/data/fme_condor_egg.json');
condorItems = JSON.parse(condorItems);

condorItems.forEach(item => {
  sites.push({
    name: item.text,
    type: 'short',
    url: `${rdoMapBase}&q=${item.text}`,
  });
});

/**
 * SALVAGE
 * Salvage has 3 locations, just use a for loop to add them all.
 */
let salvageItems = downloadFileSync('http://localhost/rdo/data/fme_salvage.json');
salvageItems = JSON.parse(salvageItems);

salvageItems.forEach(item => {
  sites.push({
    name: item.text,
    type: 'short',
    url: `${rdoMapBase}&q=${item.text}`,
  });
});

sites.sort((a, b) => a.name.localeCompare(b.name, 'en-US', { numeric: true, ignorePunctuation: true }));

/** @type {ProgressBar} The ProgressBar instance to use for displaying the progress bar in console. */
const bar = new ProgressBar('[:bar] :current/:total (:percent)', {
  complete: '=',
  incomplete: ' ',
  total: sites.length,
  width: 80,
});

/**
 * Use Puppeteer to create a 4K-resolution image of a certain item.
 * @param {string} url The URL to screenshot.
 * @param {string} siteType Used to determine the folder the image will be created in.
 * @param {string} siteName Used to determine the name of the image.
 */
async function doScreenCapture(url, siteType, siteName) {
  // Specifically outside of the try catch to prevent retries on "hard" crashes.
  const browser = await puppeteer.launch({
    defaultViewport: {
      width: 3840,
      height: 2160,
    },
  });

  const page = await browser.newPage();
  const writeDir = path.join(__dirname, `_${siteType}`);
  const fileDir = path.join(writeDir, `${siteName}.jpg`);

  if (!fs.existsSync(writeDir)) fs.mkdirSync(writeDir);

  try {
    await page.goto(url, {
      waitUntil: 'networkidle2',
    });

    // Wait for our app to finish loading.
    await page.waitForFunction('window.loaded === true');

    // Some extra sleep for safety.
    await sleep(1000 * 3);

    // Set up contrast for the app. This Puppeteer evaluate method is pretty neat.
    await page.evaluate(() => {
      $('#map').css('background-color', '#202020');
      $('.leaflet-pane.leaflet-tile-pane').css('filter', 'contrast(0.75)');

      // Hacks to make the icons more visible.
      $('[src="./assets/images/icons/condor_egg_small.png"]').css('filter', 'brightness(0) invert(10%) sepia(95%) saturate(5895%) hue-rotate(21deg) brightness(97%) contrast(132%) drop-shadow(black 0px 0px 2px)');
      $('[src="./assets/images/icons/salvagemounds.png"]').css('filter', 'brightness(0) invert(10%) sepia(95%) saturate(5895%) hue-rotate(21deg) brightness(97%) contrast(132%) drop-shadow(black 0px 0px 2px)');
      $('[src="./assets/images/icons/salvagepickups.png"]').css('filter', 'brightness(0) invert(10%) sepia(95%) saturate(5895%) hue-rotate(21deg) brightness(97%) contrast(132%) drop-shadow(black 0px 0px 2px)');
      $('[src="./assets/images/icons/salvagechests.png"]').css('filter', 'drop-shadow(red 0px 0px 2px)');
    });

    // Take the screenshot. :-)
    await page.screenshot({
      fullPage: true,
      type: 'jpeg',
      quality: 100,
      path: fileDir,
    });

    await browser.close();
  } catch (error) {
    console.error(`Page ${siteName} (at ${url}) failed to load, retrying...`);

    // Properly dispose of the current browser to not clog memory.
    // If this throws, just throw out of this catch and crash.
    await browser.close();

    // Try again. Reached when Puppeteer throws timeout (>30000ms).
    await doScreenCapture(url, siteType, siteName);
  }
}

fs.writeFileSync('_manifest.json', JSON.stringify(sites.map(i => i.name)));

/**
 * The main thread logic. This spawns 8 instances of screenshotting at a time to speed up the process.
 * TODO: Clean this up at some point, no rush.
 */
async function run() {
  let i, j, chunk = 8;

  for (i = 0, j = sites.length; i < j; i += chunk) {
    const thisChunk = sites.slice(i, i + chunk);
    const workArray = [];

    for (let k = 0; k < thisChunk.length; k++) {
      const thisItem = thisChunk[k];
      if (!thisItem) continue;
      workArray.push(doScreenCapture(thisItem.url, thisItem.type, thisItem.name));
    }

    await Promise.all(workArray);
    bar.tick(workArray.length);
  }

  if (bar.complete)
    console.log('\nDone!\n');
  else
    console.error('\nSomething went wrong.\n');
}

console.log('Starting the screenshotting process...');
run();
