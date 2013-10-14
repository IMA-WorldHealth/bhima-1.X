'use strict';

//FIXME: Format code correctly in seperate files/modules etc.
var bika = angular.module('bika', ['bika.services', 'bika.controllers', 'angularTreeview']);

function bikaconfig($routeProvider) { 
	$routeProvider.
	when('/budgeting', {
		controller: 'budgetController',
		templateUrl: 'partials/budgeting.html'
	}).
	when('/user', { 
		controller: 'userController',
		templateUrl: 'partials/userpermissions.html'
	}).
	when('/debtors', { 
		controller: 'debtorsController',
		templateUrl: 'partials/debtors.html'
	});
}

bika.config(bikaconfig);


