// An exemple for using fast-csv
// for more exemple please visit www.npmjs.com/package/fast-csv 

var csv = require('fast-csv');
var file = 'fichier.csv';

csv.fromPath(file)
.on('data', function (data) {
	console.log(data);
})
.on('end', function () {
	console.log('end of file');
});
