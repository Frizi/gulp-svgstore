/* global describe, it, before, after */

var username = process.env.SAUCE_USERNAME || 'SAUCE_USERNAME';
var accessKey = process.env.SAUCE_ACCESS_KEY || 'SAUCE_ACCESS_KEY';
var tunnelIdentifier = process.env.TRAVIS_JOB_NUMBER;
var port = process.env.PORT || 8888;
var wd = require('wd');
var assert = require('assert');
var Q = wd.Q;
var fs = require('fs');
var gm = require('gm');
var tmp = require('tmp');


tmp.setGracefulCleanup();


function writeScreenshot (data) {
  return Q.Promise(function (resolve, reject) {
    tmp.tmpName(function (err, path) {
      if (err) reject(new Error(err));
        fs.writeFile(path, data, 'base64', function (err) {
            if (err) reject(new Error(err));
            resolve(path);
        });
    })
  })
}


function compareScreenshots (path1, path2) {
    return Q.Promise(function (resolve, reject) {
        gm.compare(path1, path2, function (err, isEqual, equality, raw) {
            if (err) reject(new Error(err));
            resolve(isEqual, equality, raw);
        });
    });
}


describe('gulp-svgstore usage test', function () {

    this.timeout(10000);

    var browser;

    before(function (done) {
        browser = wd.promiseChainRemote('ondemand.saucelabs.com', 80, username, accessKey);
        browser
            .init({
                browserName: 'chrome', 'tunnel-identifier': tunnelIdentifier
            })
            .nodeify(done);
    })

    after(function (done) {
        browser.quit().nodeify(done);
    })

    it('stored image should equal original svg', function (done) {
        var screenshot1, screenshot2
        browser
            .get('http://localhost:' + port + '/inline-svg.html')
            .title()
            .then(function (title) {
                assert.equal(title, 'gulp-svgstore', 'Test page is not loaded')
            })
            .takeScreenshot()
            .then(writeScreenshot)
            .then(function (path) {
                screenshot1 = path;
            })
            .get('http://localhost:' + port + '/dest/inline-svg.html')
            .takeScreenshot()
            .then(writeScreenshot)
            .then(function (path) {
                screenshot2 = path;
            })
            .then(function () {
                return compareScreenshots(screenshot1, screenshot2);
            })
            .then(function (isEqual, equality, raw) { // jshint ignore:line
                assert.ok(isEqual, 'Screenshots are different')
            })
            .nodeify(done);
    })

});
