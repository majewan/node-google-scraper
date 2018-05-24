const assert = require('assert');
const googleMock = require('./googleMock');
const GoogleSearchScraper = require('..');

describe('GoogleSearchScraper', function() {

  describe('Fake geolocation', function() {

    before(done => {
      googleMock.server.listen(8443, done);
    });

    it('Check fake position', function(done){
      googleMock.app.once('test', req => {
        assert.ifError(req.body.error);
        assert.strictEqual(req.body.payload.coords.latitude, 10, 'Latitude must equal to 10');
        assert.strictEqual(req.body.payload.coords.longitude, 10, 'Longitude must equal to 10');
        assert.strictEqual(req.body.payload.coords.accuracy, 10, 'Accuracy must equal to 10');
        done();
      });
      GoogleSearchScraper.search({
        host: 'localhost:8443',
        query : 'site:www.npmjs.com',
        phantomLogLevel: 'info',
        geolocationPos: { timestamp: Date.now(), coords: {latitude: 10, longitude: 10, accuracy: 10} }
      });
    });

    after(function(done){
      googleMock.server.close(done);
    });

  });

});
