angular.module('bhima.services')
.service('exportFile', function () {
	var LF = '%0A',
			SP = '%20',
			HT = '%09',
			FF = '%44';

	var exportFile = {};

	function publish(file, format, fileName) {
		fileName = fileName || 'Exportation';
		// Export stringData to file
		switch(format) {
			case 'csv' : 
				// Export to csv fileformat
				csv(file, fileName);
			break;
			case 'tsv' : 
				// Export to tsv fileformat
				tsv(file, fileName);
			break;
			case 'json' : 
				// Export to csv fileformat
				json(file, fileName, true);
			break;
			default:
				// Default csv
				csv(file, fileName);
			break;
		}
	}

	function isValidStructure(fileData) {
		/*
			* =============================
			* Parameters (fileData)
			* =============================
			* => fileData = {
			* 	  column : ['',...],
			* 	  data   : [{}, {}, ...]
			*    }
			* 
		*/
		var verdict = false;
		if ('data' in fileData && 'column' in fileData) {
			if (Array.isArray(fileData.data) && Array.isArray(fileData.column)) {
				var bColumn = fileData.column.every(function (item) {
					return typeof item !== 'function' && typeof item !== 'object';
				});
				var bData = fileData.data.every(function (item) {
					return typeof item !== 'function';
				});
				verdict = bColumn && bData;
			}
		}
		return verdict;
	}

	function sanitize(str) {
		return (typeof str === 'string') ? str.replace(/,/g, FF).replace(/ /g, SP) : str;
	}

	function preDataCSV(fileData, separator) {
		separator = separator || ',';

		var columns = '';
		fileData.column.forEach(function (item, index) {
			columns += (index !== fileData.column.length - 1) ? sanitize(item) + separator : sanitize(item);
		});
		columns += LF;

		var data = '';
		fileData.data.forEach(function (objectItem, index) {
			var row = '';
			for (var i in objectItem) {
				row += (i !== objectItem.length - 1) ? sanitize(objectItem[i]) + separator : sanitize(objectItem[i]);
			}	
			data += row + LF;
		});
		
		return columns + data;
	}

	function preDataTSV(fileData) {
		var columns = '';
		fileData.column.forEach(function (item, index) {
			columns += (index !== fileData.column.length - 1) ? sanitize(item) + HT : sanitize(item);
		});
		columns += LF;

		var data = '';
		fileData.data.forEach(function (objectItem, index) {
			var row = '';
			for (var i in objectItem) {
				row += (i !== objectItem.length - 1) ? sanitize(objectItem[i]) + HT : sanitize(objectItem[i]);
			}	
			data += row + LF;
		});
		
		return columns + data;
	}

	function preDataJSON(fileData) {
		return JSON.stringify(fileData, ['column', 'data'], 2);
	}

	function preDataJSONV2(fileData) {
		var result = [];
		for (var i in fileData.data) {
			var obj = {};
			for (var j in fileData.column) {
				obj[fileData.column[j]] = fileData.data[i][j];
			}
			result.push(obj);
		}
		return JSON.stringify(result, null, 2);
	}

	function builder(preData, fileName, fileFormat) {
		var e,
				today = new Date(),
    		date = today.toISOString().slice(0, 19).replace('T', '-').replace(':', '-').replace(':', '-'),
    		path = fileName + '-' + date + '.' + fileFormat;

    e = document.createElement('a');
    e.href = 'data:attachment/'+ fileFormat +',' + preData;
    e.className = 'no-print';
    e.target = '_blank';
    e.download = path;
    document.body.appendChild(e);
    e.click();
	}

	function csv(fileData, fileName, separator) {
		/*
			* ========================================
			* Parameters (fileData, fileName, option)
			* ========================================
			* => fileData = {
			* 	  column : ['',...],
			* 	  data   : [{}, {}, ...]
			*    }
			* => fileName // The name of the new file to generate
			* => separator // The separator to use
		*/
		separator = separator || ',';

		if (isValidStructure(fileData)) {
			var preData = preDataCSV(fileData, separator);
			builder(preData, fileName,'csv');
		} else {
			console.warn('Exportation CSV: Invalid data structure');
		}
	}

	function tsv(fileData, fileName) {
		/*
			* ========================================
			* Parameters (fileData, fileName)
			* ========================================
			* => fileData = {
			* 	  column : ['',...],
			* 	  data   : [{}, {}, ...]
			*    }
			* => fileName // The name of the new file to generate
		*/
		if (isValidStructure(fileData)) {
			var preData = preDataTSV(fileData);
			builder(preData, fileName,'tsv');
		} else {
			console.warn('Exportation TSV: Invalid data structure');
		}
	}

	function json(fileData, fileName, option) {
		/*
			* ========================================
			* Parameters (fileData, fileName, option)
			* ========================================
			* => fileData = {
			* 	  column : ['',...],
			* 	  data   : [{}, {}, ...]
			*    }
			* => fileName // The name of the new file to generate
			* => option // if true the function return an array of object
			* 					// if false the function return an array of array
		*/
		option = option || false;

		if (isValidStructure(fileData)) {
			var preData = option ? preDataJSONV2(fileData) : preDataJSON(fileData);
			builder(preData, fileName,'json');
		} else {
			console.warn('Exportation JSON: Invalid data structure');
		}
	}

	exportFile = {
		publish  : publish,
		csv      : csv,
		tsv      : tsv,
		json     : json
	};

	return exportFile;
});
