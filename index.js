var Spooky = require('spooky');
var fs = require('fs');
var _ = require('lodash');
var debug = require('debug')('node-google-scraper');

process.env.PHANTOMJS_EXECUTABLE = __dirname + "/node_modules/phantomjs-prebuilt/bin/phantomjs";

function search(options, callback){
  _.defaultsDeep(options, {
    host: 'www.google.com',
    userAgent: 'Mozilla/5.0 (Windows NT 6.3; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/37.0.2049.0 Safari/537.36',
    limit: 1000,
    keepPages: false,
    spooky: {
      child: {
        command: __dirname + '/node_modules/casperjs/bin/casperjs',
        transport: 'http'
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
  var captchaSolution = {};
  var spooky = new Spooky(options.spooky, function (err) {
    if (err) {
      throw err;
    }

    spooky.start();
    spooky.userAgent(options.userAgent);
    spooky.then([{ headers: options.headers }, function(){
      this.page.customHeaders = headers;
    }]);
    spooky.thenOpen('https://' + options.host);
    spooky.waitForSelector('form[action="/search"] input[name="q"]', [{
      search: options.query
    }, function(){
      this.__gs__captchaSolution = {};
      this.sendKeys('form[action="/search"] input[name="q"]', search);
      this.sendKeys('form[action="/search"] input[name="q"]', this.page.event.key.Enter);
    }], function(){
      this.emit('done', {err: 'connection_timeout', message: 'Failed to reach google host.'});
      this.exit();
    }, 15000);

    function waitForResult(){
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
            casper.exit();
          }
        }
        scrapeResults();
      }], function(){

        if(!/\/sorry/.test(this.getCurrentUrl())){
          this.emit('done', {err: 'results_timeout', message: 'End on url : ' + this.getCurrentUrl() });
          this.exit();
        }else if(!!this.__gs__captchaSolution.solution){
          this.emit('done', {err: 'invalid_captcha', captcha: this.__gs__captchaSolution});
          this.exit();
        }
      }, 5000);
    };

    waitForResult();

    spooky.then(function(){
      if(/\/sorry/.test(this.getCurrentUrl())){
        this.solution = null;
        this.emit('captcha', this.captureBase64('jpg', 'img'));
      }
    });

    spooky.waitFor(function waitSolution(){
        return !!this.__gs__captchaSolution.solution;
      }, function then(){
        this.fillSelectors('form', {
          'input[name=captcha]': this.__gs__captchaSolution.solution
        }, true);
      }, function(){
        this.emit('done', {err: 'captcha_timeout'});
        this.exit();
      }, 120000);

    waitForResult();

    spooky.run();
  });

  spooky.on('error', function (err){
    debug(err);
  });

  spooky.on('extractContent', function (content) {
    output.urls = output.urls.concat(content.urls);
    if(options.keepPages){
      output.pages.push(content.html);
    }
  });

  spooky.on('done', function(error){
    if(error && error.err === 'invalid_captcha' && options.solver && options.solver.report){
      options.solver.report(captcha.id, error);
    }
    process.nextTick(function(){
      callback(error, output);
    });
  });

  var debugP = require('debug')('phantomjs');
  spooky.on('log', function (log) {
      debugP(log.message);
  });

  spooky.on('captcha', function(img){
    if(options.solver){
      options.solver.solve( new Buffer(img, 'base64'), function(err, id, solution){
        if(err){
          callback(err, output);
          return spooky.destroy();
        }
        spooky.evaluateInCasper([{ solutionData: { id: id, solution: solution }}, function(){
          this.__gs__captchaSolution = solutionData;
        }]);
      });
    }else{
      debug('Detect a captcha, need a solver to continue.');
      process.nextTick(function(){
        callback(null, output);
      });
      spooky.destroy();
    }
  });

}

module.exports.search = search;
module.exports.commandLineSolver = require('./commandLineSolver');
