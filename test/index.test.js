const assert = require('assert'),
      GoogleSearchScraper = require('../index'),
      fs = require('fs'),
      debug = require('debug')('google-search-scraper:test');

describe('GoogleSearchScraper', function() {
  describe('OptionLimit', function() {

    it('Without limit option', function(done){
      this.timeout(60000);
      GoogleSearchScraper.search({ query : 'site:www.npmjs.com', phantomLogLevel: 'info' }, function(err, result){
        if(err){
          return done(err);
        }
        debug(result);
        assert.notEqual(result.urls.length, 0, 'Request site:nodejs.org can\'t have 0 results.');
        if(result.urls.length < 100){
          assert.fail(result.urls.length, 100, 'Request site:nodejs.org can\'t have less than 100 results.');
        }
        done();
      });
    });

    it('With 20 limit results', function(done){
      this.timeout(30000);
      GoogleSearchScraper.search({ query : 'site:wikipedia.fr', limit: 20 }, function(err, result){
        if(err){
          return done(err);
        }
        assert.strictEqual(result.urls.length, 20, 'Must be equal to 20 results.');
        done();
      });
    });

  });

  describe('OptionKeepPages', function() {

    it('Without keepPages', function(done){
      this.timeout(10000);
      GoogleSearchScraper.search({ query : 'site:www.npmjs.com', limit: 10 }, function(err, result){
        if(err){
          return done(err);
        }
        assert.strictEqual(result.pages.length, 0, 'Scraper should not return a page.');
        assert.notEqual(result.urls.length, 0, 'Request site:nodejs.org can\'t have 0 results.');
        if(result.urls.length < 10){
          assert.fail(result.urls.length, 10, 'Request site:nodejs.org can\'t have less than 10 results.');
        }
        done();
      });
    });

    it('With keepPages', function(done){
      this.timeout(10000);
      GoogleSearchScraper.search({ query : 'site:www.npmjs.com', limit: 10, keepPages: true }, function(err, result){
        if(err){
          return done(err);
        }
        assert.strictEqual(result.pages.length, 1, 'Scraper should return a page.');
        assert.notEqual(result.urls.length, 0, 'Request site:nodejs.org can\'t have 0 results.');
        if(result.urls.length < 10){
          assert.fail(result.urls.length, 10, 'Request site:nodejs.org can\'t have less than 10 results.');
        }
        //require('fs').writeFileSync('outputpage.html', result.pages[0]);
        done();
      });
    });

  });

  describe('ViewPortSize DPI Options', function() {
    this.timeout(30000);
    it('1080p', function(done){
      GoogleSearchScraper.search({
        query : 'facebook',
        limit: 10,
        keepPages: true,
        solver: GoogleSearchScraper.commandLineSolver,
        headers: {
          'Accept-Language': 'fr-FR,fr,*'
        },
        viewportSize: {
          width: 1920,
          height: 1080
        }
      }, function(err, result){
        assert.strictEqual(result.urls.length, 10, 'Must return 10 results');
        fs.writeFileSync( '1920x1080.html', result.pages[0]);
        done(err);
      });
    });
    it('Little screen portrait.', function(done){
      GoogleSearchScraper.search({
        query : 'facebook',
        limit: 10,
        keepPages: true,
        solver: GoogleSearchScraper.commandLineSolver,
        headers: {
          'Accept-Language': 'fr-FR,fr,*'
        },
        viewportSize: {
          width: 768,
          height: 1024
        }
      }, function(err, result){
        assert.strictEqual(result.urls.length, 10, 'Must return 10 results');
        fs.writeFileSync( '768x1024.html', result.pages[0]);
        done(err);
      });
    });
    it('1080p with 300ppi', function(done){
      GoogleSearchScraper.search({
        query : 'facebook',
        limit: 10,
        keepPages: true,
        solver: GoogleSearchScraper.commandLineSolver,
        headers: {
          'Accept-Language': 'fr-FR,fr,*'
        },
        viewportSize: {
          width: 1920,
          height: 1080
        },
        dpi: 300
      }, function(err, result){
        assert.strictEqual(result.urls.length, 10, 'Must return 10 results');
        fs.writeFileSync( '1920x1080-300dpi.html', result.pages[0]);
        done(err);
      });
    });
  });

  describe('Proxy option', function() {

    it('With proxy option', function(done){
      this.timeout(300000);
      GoogleSearchScraper.search({ query : 'site:test.com',
      limit: 10,
      keepPages: true,
      solver: GoogleSearchScraper.commandLineSolver,
      headers: {
        'Accept-Language': 'ru-RU,en,*'
      },
      phantomOptions: [
        '--proxy-type=socks5',
        '--proxy=localhost:9050'
      ]}, function(err, result){
        if(err){
          if(err.details) require('fs').writeFileSync('error.html', err.details.html);
          console.log(err.details.url);
          return done(err);
        }
        assert.strictEqual(result.pages.length, 1, 'Scraper should return a page.');
        assert.notEqual(result.urls.length, 0, 'Request site:nodejs.org can\'t have 0 results.');
        if(result.urls.length < 10){
          assert.fail(result.urls.length, 10, 'Request site:nodejs.org can\'t have less than 10 results.');
        }
        done();
      });
    });
  });

});
