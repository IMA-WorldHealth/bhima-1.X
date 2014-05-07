(function (angular) {
  'use strict';

  var kpk = angular.module('kpk', ['kpk.controllers', 'kpk.services', 'kpk.directives', 'kpk.filters', 'ngRoute', 'ui.bootstrap', 'pascalprecht.translate']);

  function kpkconfig($routeProvider) {
    //TODO: Dynamic routes loaded from unit database?
    $routeProvider.
    when('/budgeting/:accountID?', {
      controller: 'budgetController',
      templateUrl: 'partials/budget/budget.html'
    })
    .when('/project', {
      controller : 'project',
      templateUrl: 'partials/project/project.html'
    })
    .when('/permission', {
      controller: 'permission',
      templateUrl: 'partials/user_permission/permissions.html'
    })
    .when('/enterprise', {
      controller: 'enterprise',
      templateUrl: 'partials/enterprise/enterprise.html'
    })
    .when('/posting_journal', {
      controller: 'journal.grid',
      templateUrl:'partials/journal/journal.html'
    })
    .when('/projects', {
      controller : 'project',
      templateUrl : 'partials/projects/projects.html'
    })
    .when('/fiscal', {
      controller: 'fiscal',
      templateUrl: 'partials/fiscal/fiscal.html'
    })
    .when('/patient', {
      controller: 'patientRegistration',
      templateUrl: 'partials/patient_registration/patient.html'
    })
    .when('/debitor/debitor_group', {
      controller : 'debitorGroup',
      templateUrl: 'partials/debitor/debitor_group.html'
    })
    .when('/journal_voucher', {
      controller: 'journalVoucher',
      templateUrl: 'partials/journal_voucher/journal_voucher.html'
    })
    .when('/inventory', {
      controller: 'inventoryController',
      templateUrl: '/partials/inventory/inventory.html'
    })
    .when('/inventory/view', {
      controller : 'inventoryView',
      templateUrl:'/partials/inventory/view/view.html'
    })
    .when('/inventory/register', {
      controller: 'inventoryRegister',
      templateUrl: '/partials/inventory/register/register.html'
    })
    .when('/patient_records/:patientID?', {
      controller: 'patientRecords',
      templateUrl: '/partials/records/patient_records/patient_records.html'
    })
    .when('/sales/:debtorID?/:inventoryID?', {
      controller: 'sales',
      templateUrl: '/partials/sales/sales.html'
    })
    .when('/sale_records/:recordID?', {
      controller: 'salesRecords',
      templateUrl: '/partials/records/sales_records/sales_records.html'
    })
    .when('/cash', {
      controller: 'cash',
      templateUrl: '/partials/cash/cash.html'
    })
    .when('/creditor', {
      controller: 'creditorsController',
      templateUrl: '/partials/creditor/creditor.html'
    })
    .when('/creditors/creditor_group', {
      controller: 'creditorGroupCtrl',
      templateUrl: 'partials/creditor/group/creditor_group.html'
    }).
    when('/inventory/purchase', {
      controller: 'purchaseOrder',
      templateUrl: 'partials/purchase_order/purchase.html'
    })
    .when('/purchase_records/:purchaseID?', {
      controller: 'purchaseRecordsController',
      templateUrl: 'partials/records/purchase_order_records/purchase_records.html'
    })
    .when('/inventory/price_list', {
      controller: 'priceList',
      templateUrl: 'partials/price_list/pricelist.html'
    })
    .when('/exchange_rate', {
      controller : 'exchangeRateController',
      templateUrl: 'partials/exchange_rate/exchange_rate.html'
    })
    .when('/currency', {
      controller : 'currency',
      templateUrl: 'partials/currency/currency.html'
    })
    .when('/create_account', {
      controller: 'manageAccount',
      templateUrl: 'partials/accounts/create_account/create.html'
    })
    .when('/reports/finance', {
      controller: 'reportFinance',
      templateUrl: 'partials/reports/finance/finance_report.html'
    })
    .when('/reports/prices', {
      controller : 'report.prices',
      templateUrl : 'partials/reports/prices/prices.html'
    })
    .when('/reports/transaction_report', {
      controller: 'reportTransactionController',
      templateUrl: 'partials/reports/transaction_report/transaction_report.html'
    })
    .when('/reports/patient_standing/', {
      controller : 'reportPatientStanding',
      templateUrl : '/partials/reports/patient_standing/patient_standing.html'
    })
    .when('/reports/ledger/general_ledger', {
      controller: 'reportGeneralLedger',
      templateUrl: '/partials/reports/ledger/general_ledger.html'
    })
    .when('/reports/summary', {
      controller: 'summaryController',
      templateUrl: 'partials/reports/summary/summary.html'
    })
    .when('/reports/debitor_aging/', {
      controller: 'reportDebitorAging',
      templateUrl: 'partials/reports/debitor_aging/debitor_aging.html'
    })
    .when('/reports/account_statement/', {
      controller: 'reportAccountStatement',
      templateUrl: 'partials/reports/account_statement/account_statement.html'
    })
    .when('/reports/income_expensive/', {
      controller: 'reportIncomeExpensive',
      templateUrl: 'partials/reports/income_expensive/income_expensive.html'
    })
    .when('/location', {
      controller : 'locationCtrl',
      templateUrl: 'partials/location/location.html'
    })
    .when('/location/village', {
      controller : 'village',
      templateUrl: 'partials/location/village/village.html'
    })
    .when('/location/sector', {
      controller : 'sector',
      templateUrl: 'partials/location/sector/sector.html'
    })
    .when('/location/province', {
      controller : 'province',
      templateUrl: 'partials/location/province/province.html'
    })
    .when('/location/country', {
      controller : 'country',
      templateUrl: 'partials/location/country/country.html'
    })
    .when('/print', {
      templateUrl: 'partials/print/test.html'
    })
    .when('/settings/:route?', {
      controller: 'settingsController',
      templateUrl: 'partials/settings/settings.html'
    })
    .when('/patient_group_assignment', {
      controller: 'AssignPatientGroup',
      templateUrl: 'partials/patient_group_assignment/patient_group_assign.html'
    })
    .when('/reports/chart_of_accounts/', {
      controller: 'accountsReport',
      templateUrl: 'partials/reports/chart_of_accounts/chart.html'
    })
    .when('/invoice/:originId/:invoiceId', {
      controller: 'invoice',
      templateUrl: 'partials/invoice/invoice.html'
    })
    .when('/credit_note/:invoiceId?/', {
      controller: 'creditNote',
      templateUrl: 'partials/credit_note/credit_note.html'
    })
    .when('/cost_center', {
      controller: 'costCenter',
      templateUrl: 'partials/cost_center/cost_center.html'
    })
    .when('/cost_center/center/', {
      controller: 'analysisCenter',
      templateUrl: 'partials/cost_center/center/analysis_center.html'
    })
    .when('/cost_center/assigning/', {
      controller: 'assigning',
      templateUrl: 'partials/cost_center/assigning/assigning.html'
    })
    .when('/patient_group', {
      controller: 'patientGroup',
      templateUrl: 'partials/patient_group/patient_group.html'
    })
    .when('/group_invoice/:id?', {
      controller : 'groupInvoice',
      templateUrl : 'partials/group_invoice/group_invoice.html'
    })
    .when('/reports/patient_registrations', {
      controller : 'reportPatientRegistrations',
      templateUrl : 'partials/reports/patient_registrations/patient_registrations.html'
    })
    .when('/reports/cash_payments', {
      controller: 'reportCashPayments',
      templateUrl: 'partials/reports/cash_payments/cash_payments.html'
    })
    .when('/renewal', {
      controller : 'renewal',
      templateUrl : 'partials/patient_renewal/renewal.html'
    })
    .when('/swap_debitor', {
      controller : 'swapDebitor',
      templateUrl : 'partials/swap_debitor/swap_debitor.html'
    })
    .when('/reports/all_transactions', {
      controller : 'allTransactions',
      templateUrl : 'partials/reports/all_transactions/all_transactions.html'
    })
    .when('/caution', {
      controller : 'caution',
      templateUrl : 'partials/caution/caution.html'
    })
    .when('/client', {
      controller : 'client',
      templateUrl : 'partials/client/client.html'
    })
    .when('/beneficiary', {
      controller : 'beneficiary',
      templateUrl : 'partials/beneficiary/beneficiary.html'
    })
    .when('/main_cash', {
      controller : 'mainCash',
      templateUrl : 'partials/pcash/pcash.html'
    })
    .when('/main_cash/income', {
      controller : 'income',
      templateUrl : 'partials/pcash/income/income.html'
    })
    .when('/main_cash/expense', {
      controller : 'expense',
      templateUrl : 'partials/pcash/expense/expense.html'
    })
    .when('/update_stock', {
      controller : 'updateStock',
      templateUrl : 'partials/update_stock/update_stock.html'
    })
    .when('/primary_cash/transfert/:cashbox_id', {
      controller : 'transfert',
      templateUrl : 'partials/primary_cash/incomes/transfert/transfert.html'
    })
     .when('/primary_cash/convention/:cashbox_id', {
      controller : 'convention',
      templateUrl : 'partials/primary_cash/incomes/convention/convention.html'
    })
    .when('/trialbalance/print', {
      controller : 'trialbalance.print',
      templateUrl : 'partials/journal/trialbalance/print.html'
    })
    .when('/primary_cash/', {
      controller : 'primaryCash',
      templateUrl : 'partials/primary_cash/primary.html'
    })
    .when('/employee', {
      controller : 'employee',
      templateUrl : 'partials/employee/employee.html'
    })
    .when('/journal/print', {
      controller : 'journal.print',
      templateUrl : 'partials/journal/print.html'
    })
    .when('/primary_cash/expense/generic/:id?', {
      controller : 'primaryCash.expense',
      templateUrl: 'partials/primary_cash/expense/generic.html'
    })
    .when('/primary_cash/expense/purchase/:cashbox', {
      controller : 'purchaseOrderCash',
      templateUrl : 'partials/primary_cash/expense/purchase.html'
    })
    .when('/inventory/depot', {
      controller : 'inventory.depot',
      templateUrl : 'partials/inventory/depot/depot.html'
    })
    .when('/stock/', {
      controller : 'stock.main',
      templateUrl : 'partials/stock/stock.html'
    })
    .when('/stock/entry/start/:depotId', {
      controller : 'stock.entry.start',
      templateUrl : 'partials/stock/entry/start.html'
    })
    .when('/stock/entry/partition', {
      controller : 'stock.entry.partition',
      templateUrl : 'partials/stock/entry/partition.html'
    })
    .when('/stock/entry/review', {
      controller : 'stock.entry.review',
      templateUrl: 'partials/stock/entry/review.html'
    })
    .when('/stock/movement/:depotId', {
      controller : 'stock.movement',
      templateUrl : 'partials/stock/movement/movement.html'
    })
    .when('/stock/exit/:depotId', {
      controller : 'stock.exit',
      templateUrl : 'partials/stock/exit/exit.html'
    })
    .when('/stock/loss/:depotId', {
      controller : 'stock.loss',
      templateUrl : 'partials/stock/loss/loss.html'
    })
    .when('/inventory/distribution', {
      controller : 'inventory.distribution',
      templateUrl : 'partials/inventory/distribution/distribution.html'
    });
  }

  function translateConfig($translateProvider) {
    //TODO Review i18n and determine if this it the right solution
    $translateProvider.useStaticFilesLoader({
      prefix: '/i18n/',
      suffix: '.json'
    });

    //TODO Try and assign the previous sessions language key here
    $translateProvider.preferredLanguage('en');
  }


  function indicatorConfig($httpProvider) {
    var $http;
    var interceptor = ['$q', '$injector', function ($q, $injector) {
      var notificationChannel;

      function success(response) {
        // get $http via $injector because of circular dependency problem
        $http = $http || $injector.get('$http');
        // don't send notification until all requests are complete
        if ($http.pendingRequests.length < 1) {
          // get requestNotificationChannel via $injector because of circular dependency problem
          notificationChannel = notificationChannel || $injector.get('requestNotificationChannel');
          // send a notification requests are complete
          notificationChannel.requestEnded();
        }
        return response;
      }

      function error(response) {
        // get $http via $injector because of circular dependency problem
        $http = $http || $injector.get('$http');
        // don't send notification until all requests are complete
        if ($http.pendingRequests.length < 1) {
          // get requestNotificationChannel via $injector because of circular dependency problem
          notificationChannel = notificationChannel || $injector.get('requestNotificationChannel');
          // send a notification requests are complete
          notificationChannel.requestEnded();
        }
        return $q.reject(response);
      }

      return function (promise) {
        // get requestNotificationChannel via $injector because of circular dependency problem
        notificationChannel = notificationChannel || $injector.get('requestNotificationChannel');
        // send a notification requests are complete
        notificationChannel.requestStarted();
        return promise.then(success, error);
      };
    }];

    $httpProvider.responseInterceptors.push(interceptor);
  }



  kpk.config(kpkconfig);
  kpk.config(translateConfig);
  kpk.config(indicatorConfig);
})(angular);
