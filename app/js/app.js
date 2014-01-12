(function (angular) {
  'use strict';

  //FIXME: Format code correctly in seperate files/modules etc.
  var kpk = angular.module('kpk', ['kpk.controllers', 'kpk.services', 'kpk.directives', 'kpk.filters', 'ui.bootstrap', 'pascalprecht.translate']);
  
  function kpkconfig($routeProvider) { 
    //TODO: Dynamic routes loaded from unit database?
    $routeProvider.
    when('/budgeting/:accountID', {
      controller: 'budgetController',
      templateUrl: 'partials/budget/budget.html'
    }).
    when('/permission', { 
      controller: 'userController',
      templateUrl: 'partials/user_permission/permissions.html'
    }).
    when('/enterprise', { 
      controller: 'enterpriseController',
      templateUrl: 'partials/enterprise/enterprise.html'
    }).
    when('/posting_journal', {
      controller: 'journalController',
      templateUrl:'partials/journal/journal.html'
    }).
    when('/fiscal', {
      controller: 'fiscalController',
      templateUrl: 'partials/fiscal/fiscal.html'
    }).
    when('/patient', { 
      controller: 'patientRegController',
      templateUrl: 'partials/patient_registration/patient.html'
    }).
    when('/debitor/debitor_group', {
      controller : 'debitorGroupCtrl',
      templateUrl: 'partials/debitor/debitor_group.html'
    }).
    when('/accounts', {
      controller: 'accountController',
      templateUrl: '/partials/accounts/accounts.html'
    }).
    when('/inventory', {
      controller: 'inventoryController',
      templateUrl: '/partials/inventory/inventory.html'
    }).
    when('/inventory/view', {
      controller : 'inventoryViewCtrl',
      templateUrl:'/partials/inventory/view.html'
    }).
    when('/inventory/register', {
      controller: 'inventoryRegisterController',
      templateUrl: '/partials/inventory/register/register.html'
    }).
    when('/patient_records/:patientID', { 
      controller: 'patientRecords', 
      templateUrl: '/partials/records/patient_records/patient_records.html'
    }).
    when('/sales/:debtorID/:inventoryID', { 
      controller: 'salesController',
      templateUrl: '/partials/sales/sales.html'
    }).
    when('/sale_records/:recordID', { 
      controller: 'salesRecordsController',
      templateUrl: '/partials/records/sales_records/sales_records.html'
    }).
    when('/cash', {
      controller: 'cashController',
      templateUrl: '/partials/cash/cash.html'
    })
    .when('/creditors', {
      controller: 'creditorsController',
      templateUrl: '/partials/creditor/creditor.html'
    }).
    when('/creditors/creditor_group', {
      controller: 'creditorGroupCtrl',
      templateUrl: 'partials/creditor/group/creditor_group.html'
    }).
    when('/inventory/purchase', {
      controller: 'purchaseOrderController',
      templateUrl: 'partials/purchase_order/purchase.html'
    }).
    when('/purchase_records/:purchaseID', {
      controller: 'purchaseRecordsController',
      templateUrl: 'partials/records/purchase_order_records/purchase_records.html'
    }).
    when('/inventory/price_list', {
      controller: 'priceListController',
      templateUrl: 'partials/pricelist/pricelist.html'
    }).
    when('/exchange_rate', {
      controller : 'exchangeRateController',
      templateUrl: 'partials/exchange_rate/exchange_rate.html'
    }).
    when('/create_account', {
      controller: 'manageAccount',
      templateUrl: 'partials/accounts/create_account/create.html'
    }).
    when('/reports/finance', { 
      controller: 'reportFinanceController',
      templateUrl: 'partials/reports/finance/finance_report.html'
    }).
    when('/reports/transaction_report', { 
      controller: 'reportTransactionController',
      templateUrl: 'partials/reports/transaction_report/transaction_report.html'
    }).
    when('/reports/ledger/general_ledger', {
      controller: 'reportGeneralLedgerCtrl',
      templateUrl: '/partials/reports/ledger/general_ledger.html'
    }).
    when('/reports/summary', {
      controller: 'summaryController',
      templateUrl: 'partials/reports/summary/summary.html'
    }).
    when('/reports/account_balance/', {
      controller: 'reportAccountBalanceCtrl',
      templateUrl: 'partials/reports/account_balance/account_balance.html'
    })
    .when('/location', {
      controller : 'locationCtrl',
      templateUrl: 'partials/location/location.html'
    })
    .when('/print', {
      templateUrl: 'partials/print/test.html'
    })
    .when('/settings', { 
      controller: 'settingsController',
      templateUrl: 'partials/settings/settings.html'
    })
    .when('/reports/chart_of_accounts/', {
      controller: 'accountsReport',
      templateUrl: 'partials/reports/chart_of_accounts/chart.html'
    });
  }  

  function translateConfig($translateProvider) { 
    //TODO Configurations loaded from files on the server (pointed to by database?)
    //TODO Review how translations should be split - functionality, unit, etc.
    //TODO Review i18n and determine if this it the right solution
    $translateProvider.translations('en', {
      //Accounting terminology
      POSTING_JOURNAL: 'posting journal',
      TRANSACTION: 'transaction',
      ACCOUNT: 'account',
      TRIAL_BALANCE: 'trial balance',
      GENERAL_LEDGER: 'general ledger',
      DEBIT: 'debit',
      CREDIT: 'credit',
      FISCAL_YEAR: 'fiscal year',
      ENTERPRISE : 'enterprise',
      ENTERPRISE_MANAGEMENT : 'enterprise management',

      //Application functions
      CONFIGURE: 'configure',
      PRINT: 'print',
      CREATE: 'create',

      //Generic database
      ID: 'id',
      DATE: 'date',
      DESCRIPTION: 'description',

      // Actions
      SAVE: 'save',
      DELETE : 'delete',
      NEW : 'new',
      CANCEL : 'cancel',

      //Titles
      MANAGEMENT: 'management',

      //Journal database
      DOC_NO: 'doc no.',
      DEB_CRED_ACCOUNT: 'debitor/creditor account',
      DEB_CRED_TYPE: 'debitor/creditor type',
      INV_PO_NO: 'inv/PO no.',

      // Users and Permissions
      UP_TITLE : 'users & permissions management', // FIXME: namespaces
      FIRST_NAME : 'first name',
      LAST_NAME : 'last name',
      EMAIL : 'email',
      USER_NAME : 'username',
      PASSWORD : 'password',
      CONFIRM : 'confirm',
      ALL : 'all',
      REGISTERED_USERS : 'registered users',
      CHECK : 'check',
      UNITS : 'units',
      USER : 'user',
      PERMISSION: 'permission',
      UP_DIALOGUE : 'check units which user ', // This token is non-normative
      UP_DIALOGUE_2 : 'will access',

      // Enterprise Creation
      NAME : 'name',
      CASH_ACCOUNT : 'cash account',
      LOCATION: 'location',
      PHONE: 'phone',
      ABBREVIATION: 'abbreviation',

      //fiscal year page
      FISCAL_YEAR_PAGE_NEW : 'New Fiscal Year',
      FISCAL_YEAR_PAGE_DESC : 'Year Desc.',
      FISCAL_YEAR_PAGE_STARTMONTH : 'Start Month',
      FISCAL_YEAR_PAGE_ONEYEAR : 'One Year',
      FISCAL_YEAR_PAGE_SPECIFY : 'Specify',
      FISCAL_YEAR_PAGE_ENDMONTH : 'End Month',
      FISCAL_YEAR_PAGE_SUBMIT : 'Submit',
      FISCAL_YEAR_PAGE_NAME : 'Name',
      FISCAL_YEAR_PAGE_LOCK : 'Lock this Fiscal Year',
      FISCAL_YEAR_PAGE_TOTALMONTH : 'Total Months',
      FISCAL_YEAR_PAGE_FIRSTVOUCHER : 'First Voucher No.',
      FISCAL_YEAR_PAGE_LASTVOUCHER : 'Last Voucher No.',
      FISCAL_YEAR_PAGE_POSTINGFROM : 'Posting from',
      FISCAL_YEAR_PAGE_POSTINGTO : 'Posting to',
      FISCAL_YEAR_PAGE_PERIODS :'Periods',
      FISCAL_YEAR_PAGE_FISCALYEARSELECTION : 'Fiscal Year Selection',
      FISCAL_YEAR_PAGE_DESCRIPTION : 'Description',
      FISCAL_YEAR_PAGE_ALERTPARTONE : 'There are no Fiscal Years recorded for the enterprise ',
      FISCAL_YEAR_PAGE_ALERTTWO : '. Fiscal Years are required to group transactions and provide reports.',

      //account page
      ACCOUNT_PAGE_TITLE : 'Chart of Accounts',
      ACCOUNT_PAGE_ADD : 'Add Account',

      //patient registration 
      DEBTOR_GROUP : 'Debtor Group'


    });

    $translateProvider.translations('fr', {
      //Accounting terminology
      POSTING_JOURNAL: 'journal de saisie',
      TRANSACTION: 'opération',
      ACCOUNT: 'compte',
      TRIAL_BALANCE: 'balance de vérification',
      GENERAL_LEDGER: 'grand livre général',
      DEBIT: 'débit',
      CREDIT: 'crédit',
      FISCAL_YEAR : 'annee fiscal',
      ENTERPRISE : 'enterprise',

      // Application functions
      CONFIGURE: 'configurer',
      PRINT: 'imprimer',
      CREATE: 'créer',

      // Generic database
      ID: 'id',
      DATE: 'date',
      DESCRIPTION: 'description',

      // Actions
      SAVE: 'enregistrer',
      DELETE : 'soupprimer',
      NEW : 'nouvelle',
      CANCEL : 'retourner',

      //Titles
      MANAGEMENT: 'gestion',

      //Journal database
      DOC_NO: 'doc no.',
      DEB_CRED_ACCOUNT: 'debitor/creditor account',
      DEB_CRED_TYPE: 'debitor/creditor type',
      INV_PO_NO: 'inv/PO no.',

      // Users and Permissions page
      UP_TITLE : 'gestion des utilisateurs et permissions',
      FIRST_NAME : 'prenom',
      LAST_NAME : 'postnom',
      EMAIL : 'email',
      USER_NAME : 'nom de utilisateur',
      PASSWORD : 'mots de pass',
      CONFIRM : 'confirmer',
      ALL : 'tous',
      REGISTERED_USERS : 'utilisateurs',
      CHECK : 'crocher',
      UNITS : 'modules',
      USER : 'utilisateur',
      PERMISSION: 'permission',
      UP_DIALOGUE : 'crocher les modules utilisateur ', // This token is non-normative
      UP_DIALOGUE_2 : 'peut acceder',

      // Enterpise Creation
      NAME : 'nom',
      CASH_ACCOUNT : 'compte caisse',
      LOCATION: 'location',
      PHONE: 'téléphone',
      ABBREVIATION: 'abbreviation',

      //fiscal year page
      //FIXME/TODO: Namespacing
      FISCAL_YEAR_PAGE_NEW : 'Nouvelle Annee Fiscale',
      FISCAL_YEAR_PAGE_DESC : 'Desc Annee.',
      FISCAL_YEAR_PAGE_STARTMONTH : 'Debut Mois',
      FISCAL_YEAR_PAGE_ONEYEAR : 'Une Annee',
      FISCAL_YEAR_PAGE_SPECIFY : 'Specifier',
      FISCAL_YEAR_PAGE_ENDMONTH : 'Fin Mois',
      FISCAL_YEAR_PAGE_SUBMIT : 'Soumettre',
      FISCAL_YEAR_PAGE_NAME : 'Nom',
      FISCAL_YEAR_PAGE_LOCK : 'Bloquer Cette Annee Fiscale',
      FISCAL_YEAR_PAGE_TOTALMONTH : 'Total Mois',
      FISCAL_YEAR_PAGE_FIRSTVOUCHER : 'Premier No Voucher',
      FISCAL_YEAR_PAGE_LASTVOUCHER : 'Dernier No Voucher.',
      FISCAL_YEAR_PAGE_POSTINGFROM : 'Poster De',
      FISCAL_YEAR_PAGE_POSTINGTO : 'Poster jusqu\'au',
      FISCAL_YEAR_PAGE_PERIODS :'Periodes',
      FISCAL_YEAR_PAGE_FISCALYEARSELECTION : 'Selection de l\'Annee Fiscale',
      FISCAL_YEAR_PAGE_DESCRIPTION : 'Description',
      FISCAL_YEAR_PAGE_ALERTPARTONE : 'Il n\'y a aucune annee fiscale enregistree pour l\'entraprise ',
      FISCAL_YEAR_PAGE_ALERTTWO : '. Les annees fiscales sont requises pour grouper les transactions et produire les rapports.',

      //account page

      ACCOUNT_PAGE_TITLE : 'Tableau des Comptes',
      ACCOUNT_PAGE_ADD : 'Ajouter un Compte',

      //patient registration 
      DEBTOR_GROUP : 'Debitor Group'


    });

    $translateProvider.translations('ln', {
      //Accounting terminology
      POSTING_JOURNAL: 'Buku ya makomi',
      TRANSACTION: 'Ba Transaction',
      ACCOUNT: 'Ba Konti',
      TRIAL_BALANCE: 'balance ya vérification',
      GENERAL_LEDGER: 'Buku ya monene ya makomi',
      DEBIT: 'débit',
      CREDIT: 'crédit',
      ENTERPRISE : '?',

      // Application functions
      CONFIGURE: 'Bobongisi',
      PRINT: 'Koimprimer',
      CREATE: 'Kela',

      // Generic database
      ID: 'id',
      DATE: 'Dati',
      DESCRIPTION: 'Ndimbola',

      // Actions
      SAVE: 'Bomba',
      DELETE : 'Longola',
      NEW : '?',
      CANCEL : 'Zonga',

      //Titles
      MANAGEMENT: 'Mokambemi',

      //Journal database
      DOC_NO: 'doc no.',
      DEB_CRED_ACCOUNT: 'Akonti ya debiteur to pe crediteur',
      DEB_CRED_TYPE: 'Lolenge ya crediteur to pe debiteur',
      INV_PO_NO: 'inv/PO no.',

      // Users and Permissions
      UP_TITLE : 'Mokambemi ya Basali mpe ba Ndingisa',
      FIRST_NAME : 'Nkombo ya liboso',
      LAST_NAME : 'Nkombo ya mibale',
      EMAIL : 'email',
      USER_NAME : 'Nkombo ya bosali',
      PASSWORD : 'Nkombo ya Nkuku',
      CONFIRM : 'Zongela ',
      ALL : 'Nionso',
      REGISTERED_USERS : 'Basali',
      CHECK : 'Mpona',
      UNITS : 'Biteni',
      USER : 'Mosali',
      PERMISSION: 'Ndingisa',
      UP_DIALOGUE : 'Mpona biteni ya basali ', // This token is non-normative
      UP_DIALOGUE_2 : 'akoki kokota',

      //patient registration 
      DEBTOR_GROUP : 'Lobi'

    });
    
    //TODO Try and assign the previous sessions language key here
    $translateProvider.preferredLanguage('en');
  }

  kpk.config(kpkconfig);
  kpk.config(translateConfig);
})(angular);
