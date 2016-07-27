var Spooky = require('spooky');
var fs = require('fs');

process.env.PHANTOMJS_EXECUTABLE = "node_modules/phantomjs-prebuilt/bin/phantomjs";

function search(options, callback){
  options.host = options.host || 'www.google.com';
  options.userAgent = options.userAgent || 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Ubuntu Chromium/49.0.2623.108 Chrome/49.0.2623.108 Safari/537.36';
  options.limit = options.limit || 1000;
  options.keepPages = options.keepPages || false;
  var output = {
    urls: [],
    pages: []
  };
  var spooky = new Spooky({
    child: {
      command: 'node_modules/casperjs/bin/casperjs'
    },
    casper: {
      logLevel: 'debug',
      verbose: true
    }
  }, function (err) {
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

  spooky.on('error', function (err, stack) {
    console.error(err);
    process.nextTick(function(){
      callback(err);
    });
  });

  spooky.on('extractContent', function (content) {
    console.log(output.urls.length);
    output.urls = output.urls.concat(content.urls);
    if(options.keepPages){
      output.pages.push(content.html);
    }
  });

  spooky.on('done', function(){
    process.nextTick(function(){
      callback(null, output);
    });
    spooky.destroy();
  });

  spooky.on('log', function (log) {
    if (log.space === 'remote') {
      console.log(log.message);
    }
  });

  spooky.on('url.changed',function(url) {
    console.log(url);
  });



}

module.exports.search = search;
