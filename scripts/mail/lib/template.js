var util = require('util');
var fs = require('fs');
var q = require('q');

var template = exports;

// Derive from configuration
var language = 'en';
var route = {
  structure : './template/template.html',
  header : './template/header.template.html',
  section : './template/section.template.html',
  reports : './template/reports/' + language + '.json'
};
var store = {};
var structureCache, reports;

// util.format - printf

// FIXME hardcoded template
template.strong = "<strong style='font-size: 18px; color: #686868;'>%s</strong>";

// FIXME temporary method - work with general case
template.writeHeader = function (headerString, reportReference) { 
  structureCache = structureCache || template.fetch('structure');

  structureCache = template.replace(structureCache, '{{HEADERLINE}}', headerString);
  structureCache = template.replace(structureCache, '{{REPORT_REFERENCE}}', reportReference);
};

// FIXME 
template.reports = function(category, key) { 
  reports = reports || JSON.parse(template.fetch('reports'));
  return reports[category][key];
};

// FIXME
template.insertStrong = function (value) {
  if (!isNaN(value)) value = value.toString();

  return util.format(template.strong, value);
};

// FIXME
template.replace = function (source, key, content) { 
  return source.replace(key, content); 
};

// FIXME
template.fetch = function (templateKey) { 
  return store[templateKey]; 
};

// FIXME
template.compileSection = function (heading, body) { 
  var section = template.fetch('section');

  section = template.replace(section, '{{SECTION_HEADING}}', heading);
  section = template.replace(section, '{{SECTION_BODY}}', body);

  return section;
};

// FIXME accept any number of parms + key - temporary hack
template.compile = util.format;
// template.compile = function (templateKey, params) { 
//   if (!store[templateKey]) return new Error("Template not found.");
//
//   return util.format(store[templateKey], params);
// };

// FIXME
template.produceReport = function (bodyString, outputFile) { 
  structureCache = template.replace(structureCache, '{{REPORT_BODY}}', bodyString);
  return writeFile(outputFile, structureCache);
};

template.load = function (setLanguage, templateConf) { 
  var deferred = q.defer();
  var loadStatus = [], keys = Object.keys(route);
  
  templateConf = templateConf || route;
  language = setLanguage || language;

  route.reports = './template/reports/' + language + '.json';

  loadStatus = keys.map(function (key) { 
    return readFile(templateConf[key]);
  });
  
  q.all(loadStatus)
  .then(function (result) { 
    
    keys.forEach(function (key, index) { 
      store[key] = result[index];
    });

    deferred.resolve(template.compile);
  })
  .catch(function (error) { 
    util.error(error);
    deferred.reject(error);
  });

  return deferred.promise;
};

template.read = readFile;
template.write = writeFile;

// I/O
function readFile(pathToFile) { 
  var deferred = q.defer();
    
  fs.readFile(pathToFile, 'utf8', function (error, result) { 
    if(error) throw error;
    deferred.resolve(result); 
  });

  return deferred.promise;
}

function writeFile(pathToFile, fileContent) { 
  var deferred = q.defer();
  
  fs.writeFile(pathToFile, fileContent, function (error) { 
    if(error) throw error;
    deferred.resolve();
  });

  return deferred.promise;
}
