var phantom = require('phantom');
var fs = require('fs');
var _ = require('lodash');
var Promise = require('bluebird');

function search(options, callback){
  _.defaultsDeep(options, {
    host: 'www.google.com',
    userAgent: 'Mozilla/5.0 (Windows NT 6.3; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/37.0.2049.0 Safari/537.36',
    limit: 1000,
    keepPages: false,
    timeout: {
      waitSearchForm: 30000,
      captcha: 120000,
      getResults: 10000
    }
  });
  if(options.solver) Promise.promisifyAll(options.solver);
  var output = {
    urls: [],
    pages: []
  };

  function handleErrorFromCasper(casperReturns){
    if(casperReturns && casperReturns.err){
      var error = new Error(casperReturns.err.message);
      error.details = casperReturns.err.details;
      throw error;
    }else{
      return casperReturns;
    }
  }

  function catchCaptcha(retryCall){
    return function(err){
      if(err.message === 'captcha_detected' && options.solver){
        return page.invokeAsyncMethod('getCaptchaImg').then(handleErrorFromCasper)
        .then(function(casperReturns){
          return options.solver.solveAsync(new Buffer(casperReturns.captcha, 'base64'));
        })
        .then(function(captcha){
          return page.invokeAsyncMethod('fillCaptchaSolution', captcha.solution).then(handleErrorFromCasper);
        })
        .then(retryCall);
      }else{
        throw err;
      }
    };
  }

  var sharedContext = { resultsCount: 0, endOfResults: false };

  var phInstance, page;
  phantom.create(options.phantomOptions, {
    logLevel: 'error'
  })
  .then(function(instance){
    phInstance = instance;
    return instance.createPage();
  })
  .then(function(_page){
    page = _page;
    page.defineMethod('setupCasper', function(options, callback){
      var lastError;
      phantom.casperPath = './node_modules/casperjs';
      phantom.injectJs(phantom.casperPath + '/bin/bootstrap.js');
      var casper = require('casper').create();
      objectSpace.casper = casper;
      casper.start();
      casper.userAgent(options.userAgent);
      casper.then(function(){
        if(options.headers){
          this.page.customHeaders = options.headers;
        }
        console.log('Setup casper done, open https://' + options.host);
      });
      casper.thenOpen('https://' + options.host);
      casper.run(function(){
        console.log('Casper loaded ' + this.getCurrentUrl());
        if(/\/sorry/.test(this.getCurrentUrl())){
          lastError = { message: 'captcha_detected' };
        }
        callback({ err: lastError });
      });
    });

    page.defineMethod('searchGoogle', function(options, callback){
      var casper = objectSpace.casper, lastError;
      console.log('Start wait Google form to be ready');
      casper.waitForSelector('form[action="/search"] input[name="q"]', function(){
        console.log('Send query ' + options.query + ' to Google.');
        this.sendKeys('form[action="/search"] input[name="q"]', options.query);
        this.sendKeys('form[action="/search"] input[name="q"]', this.page.event.key.Enter);
      }, function(){
        if(!/\/sorry/.test(this.getCurrentUrl())){
          lastError = { message: 'form_not_found', details: { url: this.getCurrentUrl(), html: this.getHTML() } };
        }else{
          lastError = { message: 'captcha_detected' };
        }
      }, options.timeout.waitSearchForm);
      casper.waitForUrl(/#q=|\/sorry/, function(){
        if(/\/sorry/.test(this.getCurrentUrl())){
          lastError = { message: 'captcha_detected' };
        }
      }, function(){
        console.log('Timeout on ' + this.getCurrentUrl());
      }, 10000);
      casper.run(function(){
        console.log('Query sended get ' + this.getCurrentUrl());
        callback({ err: lastError });
      });
    });

    page.defineMethod('scrapeResults', function(options, sharedContext, callback){
      var casper = objectSpace.casper, lastError, output;
      casper.waitForSelector('#res #ires h3', function(){
        console.log('Parsing results.');
        var links = this.evaluate(function getLinks() {
          var links = document.querySelectorAll('.g h3 a');
          return Array.prototype.map.call(links, function(e) {
              return e.getAttribute('href');
          });
        });
        sharedContext.resultsCount += links.length;
        output = { html: (options.keepPages) ? this.getHTML() : null, urls: links };
        if(this.exists('#pnnext') && options.limit > sharedContext.resultsCount){
          this.click('#pnnext');
          this.waitForSelectorTextChange('#resultStats');
        }else{
          sharedContext.endOfResults = true;
        }
      }, function(){
        if(!/\/sorry/.test(this.getCurrentUrl())){
          lastError = { message: 'results_not_found', details: { url: this.getCurrentUrl(), html: this.getHTML() } };
        }else{
          lastError = { message: 'captcha_detected' };
        }
      }, options.timeout.getResults);

      casper.run(function(){
        callback({ err: lastError, output: output, sharedContext: sharedContext });
      });
    });

    page.defineMethod('getCaptchaImg', function(callback){
      var casper = objectSpace.casper, lastError, captcha;
      casper.then(function(){
        if(/\/sorry/.test(this.getCurrentUrl())){
          try{
            captcha = this.captureBase64('jpg', 'img');
          }catch(err){
            lastError = { message: 'captcha_timeout', details: { url: this.getCurrentUrl() } };
          }
        }else{
          lastError = { message: 'captcha_not_needed', details: { url: this.getCurrentUrl() } };
        }
      });
      casper.run(function(){
        callback({ err: lastError, captcha: captcha });
      });
    });

    page.defineMethod('fillCaptchaSolution', function(solution, callback){
      var casper = objectSpace.casper, lastError;
      casper.then(function(){
        console.log('Fill captcha solution ' + solution + ' ' + this.getCurrentUrl());
        // TODO maybe handling error here ?
        this.fillSelectors('form', {
          'input[name=captcha]': solution
        }, true);
      });
      casper.run(function(){
        console.log('Captcha filled now GET ' + this.getCurrentUrl());
        if(/\/sorry/.test(this.getCurrentUrl())){
          lastError = { message: 'invalid_captcha', details: { url: this.getCurrentUrl() }};
        }
        callback({ err: lastError });
      });
    });

    return page.invokeAsyncMethod('setupCasper', options).then(handleErrorFromCasper);
  })
  .then(function(){
    return page.invokeAsyncMethod('searchGoogle', options).then(handleErrorFromCasper).catch(catchCaptcha());
  })
  .then(function(){
    function scrapeResults(){
      if(options.limit <= sharedContext.resultsCount || sharedContext.endOfResults){
        return output;
      }
      return page.invokeAsyncMethod('scrapeResults', options, sharedContext)
      .then(handleErrorFromCasper)
      .then(function handleSharedContext(casperReturns){
        output.urls = output.urls.concat(casperReturns.output.urls);
        if(options.keepPages){
          output.pages.push(casperReturns.output.html);
        }
        sharedContext = casperReturns.sharedContext;
        return scrapeResults();
      });
    }

    return scrapeResults().catch(catchCaptcha(scrapeResults));
  })
  .then(function(output){
    phInstance.exit();
    callback(null, output);
  })
  .catch(function(err){
    phInstance.exit();
    callback(err);
  });
}

module.exports.search = search;
module.exports.commandLineSolver = require('./commandLineSolver');
