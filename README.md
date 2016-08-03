# Google scraper

Google scraper is a simple tool to scrape google search engine writen for nodejs.
Based on SpookyJS / CasperJS / PhantomJS. This work has been inspired by `node-google-search-scraper` package, and the usage is similar.


## Usage

```
var GoogleScraper = require('google-scraper');
GoogleSearchScraper.search({
  query : 'site:nodejs.org', // Query for google engine
  limit: 10, // Limit number of results
  keepPages: true, // Populate results.pages with rendered HTML content.
  solver: GoogleScraper.commandLineSolver, // Optional solver for resolving captcha (see commandLineSolver.js)
  headers: { // Default http headers for PhantomJS
    'Accept-Language': 'ru-RU,en,*'
  },
  spooky: { // Custom config for SpookyJS
    child: {
      'ignore-ssl-errors': 'yes' // This will be pass to phantomJS command line.
    }
  }
}, function(err, results){
  console.log(results);
});

```
