var fs = require('fs'),
	q = require('q'),
	accountFilePath = "./pcgc.csv",
	enterprise_id = 200,
	locked = 0,
	is_ohada = 0;


//read file content

readContentFile(accountFilePath)
.then(processContent);


//functions

function readContentFile (path){
	var deferred = q.defer();
	fs.readFile(path, 'utf8', function(readError, readResult) {
	  if(readError) throw readError;
	  deferred.resolve(readResult);
	});
  return deferred.promise;
}

function processContent (content){
	var parent, classe, account_type_id;
	//INSERT INTO account (id, account_type_id, enterprise_id, account_number, account_txt, parent, locked, classe)
	var account_list = content.split(',');
	var string_request = [];

	//checking

	var errors = [];

	account_list.forEach(function (item, index) {
		if(item !== '' && item !== undefined){
			if(!Number.isNaN(Number(item))){
				if(!Number.isNaN(Number(account_list[index + 1]))) {
					errors.push(item);
				}
			}else{
				if(Number.isNaN(Number(account_list[index + 1]))) {
					if (index < account_list.length - 1) errors.push(item);
				}
			}
		}
	})

	if(errors.length > 0){
		errors.forEach(function (item){
			if(!Number.isNaN(Number(item))){
				console.log('Pas de noms pour le compte :', item);
			}else{
				console.log('Confusion pour  :', item);
			}
		});
		return;
	}

	account_list.forEach(function (item, index) {
		if(item !== '' && item !== undefined){
			var chaines;
			if(!Number.isNaN(Number(item))){
				if(item.length === 1){
					parent = 0; classe = item; account_type_id = 3;
				}

				if(item.length === 2){
					parent = item.substring(0,1); classe = item.substring(0,1); account_type_id = 3;
				}

				if(item.length === 3){
					parent = item.substring(0,2); classe = item.substring(0,1); account_type_id = 3;
				}

				if(item.length === 4){
					parent = item.substring(0,3); classe = item.substring(0,1); account_type_id = 3;
				}

				if(item.length > 4){
					parent = item.substring(0, 4); classe = item.substring(0,1);
					account_type_id = (Number(classe) >= 6) ? 1 : 2;
				}

				var acc_txt = parseString(account_list[index + 1].trim());

				if(acc_txt.length > 0){
					chaines = [account_type_id, enterprise_id, account_list[index], acc_txt , parent, locked, classe, is_ohada].join(', ');
					string_request.push('(' + chaines + ')');
				}
			}
		}
	});

	var request = 'INSERT INTO account (account_type_id, enterprise_id, account_number, account_txt, parent, locked, classe, is_ohada) VALUES ' +
					string_request.join(', ') + ";";
	console.log(request);
}

function parseString (string) {
	return '"' + String(string).replace(/"/g, '\\"') + '"';
}


