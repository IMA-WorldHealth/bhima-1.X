/* Budget controller */

var csv = require('fast-csv');

module.exports = {
	upload : uploadFile
};

function uploadFile(req, res) {
	var file = req.files.file;
	console.dir(file);
	res.sendStatus(200);
}