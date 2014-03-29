// TODO Global charges currently don't hit an invetory item || account,
// no way of tracing this back to a reason for being
angular.module('kpk.controllers')
.controller('journalVoucher', [
  '$scope',
  '$location',
  '$http',
  '$routeParams',
  'validate',
  'connect',
  'appstate',
  'messenger',
  'appcache',
  'precision',
  'uuid',
  'util',
  '$q',
  '$location',
  function ($scope, $location, $http, $routeParams, validate, connect, appstate, messenger, Appcache, precision, uuid, util, $q, $location) {
    var dependencies = {}, ID = null;
      $scope.voucher = {};

    $scope.model = {};
    dependencies.accounts = {
      required : true,
      query : {
        tables : {
          'account' : {
            columns : ['id', 'account_number', 'account_txt']
          }
        }
      }
    }
    dependencies.currencies = {
      required : true,
      query : {
        tables : {
        'currency' : {
          columns : ['id', 'symbol', 'min_monentary_unit']
        }
      }
      }
    }

    dependencies.debitors = {
      query : {
        tables : {
        'debitor' : {
          columns : ['uuid', 'text']
        }
      }
      }
    }


    function journalRow (){
      this.id = Math.random();
      this.description = null;
      this.account_txt = null;
      this.debit = 0;
      this.credit = 0;
      this.currency_id = null;
      this.deb_cred_uuid = null;
      this.deb_cred_type = null;
      this.inv_po_id = null;
      this.comment = null;
      this.origin = null;

      return this;
    }

    function init (model){
      for(var k in model){$scope[k] = model[k]}
      $scope.voucher.rows = [];
      $scope.selectedItem = model.currencies.data[model.currencies.data.length-1];
      $scope.voucher.currency_id = $scope.selectedItem.id;
      $scope.voucher.trans_date = util.convertToMysqlDate(new Date());
      addRow(); addRow();

      $q.all([getTransID(), getLogID()])
      .then(function (response){
        $scope.voucher.trans_id = response[0].data[0].abbr+response[0].data[0].increment;
        $scope.voucher.log_id = response[1].data[0].increment;
      });
    }

    function error (err) {
    }

    function setCurrency(currency) {
      if(currency) {$scope.selectedItem = currency; $scope.voucher.currency_id = currency.id;}
    }

  function addRow() {
    var row = new journalRow();
    $scope.voucher.rows.push(row);
    return row;
  }

  function getTotal(){
    var debitSom = 0, creditSom = 0;
    $scope.voucher.rows.forEach(function (item){
      debitSom+=item.debit;
      creditSom+=item.credit;
    });
    return {td : debitSom, tc : creditSom};
  }

  function submit (){
    getPeriod()
    .then(function (period){
        var records = $scope.voucher.rows.map(function (row){
        var record = {};
        record.uuid = uuid();
        record.project_id = $scope.project.id;
        record.fiscal_year_id = period.data[0].fiscal_year_id;
        record.period_id = period.data[0].id;
        record.trans_id = $scope.voucher.trans_id;
        record.trans_date = $scope.voucher.trans_date;
        record.description = row.description;
        record.account_id = row.account_id;
        record.debit = row.debit;
        record.debit = row.credit;
        record.debit_equiv = 0;
        record.credit_equiv = 0;
        record.currency_id = $scope.voucher.currency_id;
        record.deb_cred_uuid = row.deb_cred_uuid;
        record.deb_cred_type = row.deb_cred_type;
        record.inv_po_id = $scope.voucher.inv_po_id;
        record.comment = row.comment;
        record.origin_id = 2;
        record.user_id = 1;
        return connect.clean(record);
      });

        $q.all(records.map(function (row){
          return connect.basicPut('posting_journal', row);
        })).then(function (resp){
          var log = {
            transaction_id : $scope.voucher.trans_id,
            note           : $scope.voucher.description,
            date           : $scope.voucher.trans_date,
            user_id        : 1
          }
          connect.basicPut('journal_log', [connect.clean(log)])
          .then(function (){
            flush();
          })
        });
    });
  }

  function flush (){
    $scope.voucher.rows = [];
    addRow(); addRow();
    $scope.voucher.description = null;
    $scope.voucher.inv_po_id = null;
    getTransID().
    then(function (resp){
      $scope.voucher.trans_id = resp.data[0].abbr+resp.data[0].increment;
    });

  }

  function removeRow (index){
    $scope.voucher.rows.splice(index, 1);
  }

  function getPeriod(){
    return connect.req('/period/?'+util.convertToMysqlDate(new Date()));
  }

  function getTransID(){
    return connect.req('/max_trans/?'+$scope.project.id);
  }

  function getLogID(){
    return connect.req('/max_log/');
  }

  appstate.register('project', function (project) {
    $scope.project = project;
    dependencies.accounts.query.where = ['account.enterprise_id='+$scope.project.enterprise_id];
    validate.process(dependencies).then(init, error);
  });

  $scope.$watch('voucher.rows', function(nv){
    if(nv) {
      getTotal()
    };
  }, true);

  $scope.addRow = addRow;
  $scope.submit = submit;
  $scope.setCurrency = setCurrency;
  $scope.getTotal = getTotal;
  $scope.removeRow = removeRow;



  }
]);
