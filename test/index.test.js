
var assert = require('assert'),
    GoogleSearchScraper = require('../index');

describe('GoogleSearchScraper', function() {
  describe('OptionLimit', function() {

    it('Without limit option', function(done){
      this.timeout(30000);
      GoogleSearchScraper.search({ query : 'site:nodejs.org' }, function(err, result){
        if(err){
          return done(err);
        }
        assert.notEqual(result.urls.length, 0, 'Request site:nodejs.org can\'t have 0 results.');
        if(result.urls.length < 100){
          assert.fail(result.urls.length, 100, 'Request site:nodejs.org can\'t have less than 100 results.');
        }
        done();
      });
    });

    it('With 20 limit results', function(done){
      this.timeout(10000);
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
      GoogleSearchScraper.search({ query : 'site:nodejs.org', limit: 10 }, function(err, result){
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
      GoogleSearchScraper.search({ query : 'site:nodejs.org', limit: 10, keepPages: true }, function(err, result){
        if(err){
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

  describe('Spooky proxy option', function() {

    it('With proxy option', function(done){
      this.timeout(20000);
      GoogleSearchScraper.search({ query : 'site:nodejs.org',
      limit: 10,
      keepPages: true,
      solver: GoogleSearchScraper.commandLineSolver,
      headers: {
        'Accept-Language': 'ru-RU,en,*'
      },
      spooky: {
        child: {
          proxy: 'localhost:9050',
          'proxy-type': 'socks5'
          //'ignore-ssl-errors': 'yes'
        }
      }}, function(err, result){
        if(err){
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
