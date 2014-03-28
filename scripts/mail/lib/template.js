var util = require('util');

var template = exports;

var route = { 
  structure : '../template/template.html',
  header : '../template/header.template.html',
  section : '../template/section.template.html'
};

//module.exports = (function (param) { });

(function () { 
  util.log('Initialising template');
})();

template.produceReport = function (bodyString, outputFile) { 

};
