# Google Search Scraper

Google scraper is a simple tool to scrape google search engine writen for nodejs.
Based on phantom and Casper. This work has been inspired by `node-google-search-scraper` package, and the usage is similar.

## Features

* Scrape Google results and can return rendered page for other usecase.
* Handle old captchas :-(
* Custom user agent and custom headers
* Use JS for rendering Google
* Promise or callback results

## Usage

```
var GoogleSearchScraper = require('phantom-google-search-scraper');
GoogleSearchScraper.search({
  query : 'site:www.npmjs.com', // Query for google engine
  limit: 10, // Limit number of results
  keepPages: false, // Populate results.pages with rendered HTML content.
  solver: GoogleScraper.commandLineSolver, // Optional solver for resolving captcha (see commandLineSolver.js)
  userAgent: 'GoogleSearchScraper1.0',
  headers: { // Default http headers for PhantomJS
    'Accept-Language': 'ru-RU,en,*'
  },
  phantomOptions: [ // Command line options use for PhantomJS
    '--ignore-ssl-errors=yes'
  ]
})
.then(results => {
  console.log(results);
})
.catch(error => {
  console.error(error);
});

```
