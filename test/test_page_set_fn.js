'use strict';


var http    = require('http');
var assert  = require('assert');
var driver  = require('../');


describe('page', function () {
  var server;

  before(function (done) {
    server = http.createServer(function (request, response) {
      response.writeHead(200, { "Content-Type": "text/html" });
      response.end('<html><head><script>console.log("handled on phantom-side")</script></head><body><h1>Hello World</h1></body></html>');
    }).listen(done);
  });

  it('setFn', function (done) {
    var url = 'http://localhost:' + server.address().port + '/';

    driver.create(function (err, browser) {
      if (err) {
        done(err);
        return;
      }

      browser.createPage(function (err, page) {
        if (err) {
          done(err);
          return;
        }

        var messageForwardedByOnConsoleMessage = undefined;
        var localMsg = undefined;

        page.onConsoleMessage = function (msg) {
          messageForwardedByOnConsoleMessage = msg;
        };

        page.setFn('onCallback', function (msg) {
          localMsg = msg;
          page.onConsoleMessage(msg);
        });

        page.open(url, function (err) {
          if (err) {
            done(err);
            return;
          }

          assert.ok(localMsg === undefined);
          assert.equal(messageForwardedByOnConsoleMessage, "handled on phantom-side");

          browser.on('exit', function () {
            done();
          });
          browser.exit();
        });
      });
    }, {
      ignoreErrorPattern: /CoreText performance note/,
      phantomPath: require(process.env.ENGINE || 'phantomjs').path
    });
  });

  after(function (done) {
    server.close(done);
  });
});