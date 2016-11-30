'use strict';
var readline = require('readline');
var fs = require('fs');
var exec = require('child_process').exec,
    child;
var Promise = require('bluebird');

module.exports.solve = function(image){
  fs.writeFileSync('tmp.jpg', image);
  //Use eog (gnome tool) to display captcha image
  child = exec('eog tmp.jpg');

  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return (new Promise(function(resolve){
    rl.question('Captcha please ?', resolve);
  })).then(function(solution){
    rl.close();
    return {solution: solution};
  });
};
