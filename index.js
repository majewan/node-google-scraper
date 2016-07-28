var Spooky = require('spooky');
var fs = require('fs');
var _ = require('lodash');
var debug = require('debug')('node-google-scraper');

process.env.PHANTOMJS_EXECUTABLE = __dirname + "/node_modules/phantomjs-prebuilt/bin/phantomjs";

function search(options, callback){
  _.defaultsDeep(options, {
    host: 'www.google.com',
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Ubuntu Chromium/49.0.2623.108 Chrome/49.0.2623.108 Safari/537.36',
    limit: 1000,
    keepPages: false,
    spooky: {
      child: {
        command: __dirname + '/node_modules/casperjs/bin/casperjs'
      },
      casper: {
        logLevel: 'debug',
        verbose: true
      }
  }});
  var output = {
    urls: [],
    pages: []
  };
  var spooky = new Spooky(options.spooky, function (err) {
    if (err) {
      throw err;
    }

    spooky.start();
    spooky.userAgent(options.userAgent);
    spooky.thenOpen('https://' + options.host);
    spooky.waitForSelector('form[action="/search"] input[name="q"]', [{
      search: options.query
    }, function(){
      this.sendKeys('form[action="/search"] input[name="q"]', search);
      this.sendKeys('form[action="/search"] input[name="q"]', this.page.event.key.Enter);
    }]);
    spooky.waitForSelector('#res #ires h3', [{
      options: options
    }, function(){
      var casper = this;
      var resultsCount = 0;
      function scrapeResults(){
        var links = casper.evaluate(function getLinks() {
            var links = document.querySelectorAll('.g h3 a');
            return Array.prototype.map.call(links, function(e) {
                return e.getAttribute('href');
            });
          });
        resultsCount += links.length;
        casper.emit('extractContent', { html: (options.keepPages) ? casper.getHTML() : null, urls: links });
        if(casper.exists('#pnnext') && options.limit > resultsCount){
          casper.click('#pnnext');
          casper.waitForSelectorTextChange('#resultStats', scrapeResults);
        }else{
          casper.emit('done');
        }
      }
      scrapeResults();
    }]);

    spooky.run();
  });

  spooky.on('error', function (err){
    console.error(err);
  });

  spooky.on('extractContent', function (content) {
    output.urls = output.urls.concat(content.urls);
    if(options.keepPages){
      output.pages.push(content.html);
    }
  });

  spooky.on('done', function(){
    process.nextTick(function(){
      callback(null, output);
    });
    spooky.exit();
  });

  spooky.on('log', function (log) {
    if (log.space === 'remote') {
      debug(log.message);
    }
  });

  spooky.on('url.changed',function(url) {
    debug('Url change to %s', url);
  });

}

module.exports.search = search;
