angular.module('bhima.directives')
.directive('findAccount', ['$compile', 'validate', 'messenger', 'appcache', 
			   function($compile, validate, messenger, Appcache) {
  return {
    restrict: 'A',
    templateUrl : 'partials/templates/findaccount.tmpl.html',
    link : function(scope, element, attrs) {
      var dependencies = {},
          searchCallback = null,
          resetCallback = null,
          submitCallback = scope[attrs.onSubmit],
          selectedAccount = null;

      if (!submitCallback) { throw new Error('Account search account directive must implement onSubmit callback function'); }

      // Get optional callback functions
      if ('onSearchComplete' in attrs) {
	searchCallback = scope[attrs.onSearchComplete];
	}
      if ('onReset' in attrs) {
	resetCallback = scope[attrs.getReset];
	}

      scope.findAccount = {
	valid : null,
	enableReset : false
	};

      // See if the reset button should be shown
      if ('enableReset' in attrs) {
	scope.findAccount.enableReset = true;
	}

      // Define the database query
      dependencies.accounts = {
	query : {
          tables : {
            'account' :{
              columns : ['id', 'account_txt', 'account_number']
            }
          }
	}
      };
 
      //TODO Downloads all accounts for now - this should be swapped for an asynchronous search
      validate.process(dependencies).then(function (models) {
	scope.accounts = models.accounts.data;
      });


      function getAccount(accountId) {
	if (isNaN(accountId)) {
	  return null;
	}
	var data = scope.accounts.filter(function (obj) { 
	  return obj.id === scope.accountId; 
	});
	if (data.length !== 1) {
	  throw new Error('Error in findAccount directive: account not found!');
	  }
	return data[0];
      }


      function formatAccount(account) {
	if (account) {
	  if (!isNaN(account)) {
	    var data = getAccount(scope.accountId);
	    if (data) {
	      selectedAccount = data;
	      scope.accountId = data.account_txt + ' [' + data.account_number + ']';
	      scope.findAccount.valid = true;
	      }
	  }
	}
	if (selectedAccount) {
	  return selectedAccount.account_txt + ' [' + selectedAccount.account_number + ']';
	  }
	else {
	  return account ? account.account_txt : '';
	}
      }

      function requestAccount() {
	var account = getAccount(scope.accountId);
	if (account && searchCallback) {
	  searchCallback(account);
	}
      }

      function submitAccount() {
	submitCallback(selectedAccount);
      }

      function resetSearch() {
	scope.accountId = null;
	selectedAccount = null;
	scope.findAccount.valid = false;
	if (resetCallback) {
	  resetCallback();
	}
      }

      scope.findAccount.format = formatAccount;
      scope.findAccount.request = requestAccount;
      scope.findAccount.submit = submitAccount;
      scope.findAccount.reset = resetSearch;
    }
  };
}]);
