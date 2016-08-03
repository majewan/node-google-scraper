'use strict';
var readline = require('readline');
var fs = require('fs');
var exec = require('child_process').exec,
    child;

module.exports.solve = function(image, callback){
  fs.writeFileSync('tmp.jpg', image);
  //Use eog (gnome tool) to display captcha image
  child = exec('eog tmp.jpg');

  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question('Captcha please ?', function(captcha) {
    callback(null, null, captcha);
    rl.close();
  });
};


