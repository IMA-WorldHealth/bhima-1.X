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
  'exchange',
  function ($scope, $location, $http, $routeParams, validate, connect, appstate, messenger, Appcache, precision, uuid, util, $q, exchange) {
    var dependencies = {}, ID = null;
      $scope.voucher = {}, uuid_log = null;
    $scope.voucher.rows = [];

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

    dependencies.user = {
      query : 'user_session'
    };


    function journalRow (){
      this.id = Math.random();
      this.description = null;
      this.account = null;
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
      $scope.selectedItem = model.currencies.data[model.currencies.data.length-1];
      $scope.voucher.currency_id = $scope.selectedItem.id;
      $scope.voucher.trans_date = util.convertToMysqlDate(new Date());
      addRow(); addRow();

      $q.all([getTransID()])
      .then(function (response){
        response[0].data[0].increment = (response[0].data[0].increment)? response[0].data[0].increment : 1;
        $scope.voucher.trans_id = response[0].data[0].abbr+response[0].data[0].increment;
        uuid_log = uuid();
        $scope.voucher.log_id = uuid_log;
      });
      window.voucher = $scope.voucher;
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

    $scope.voucher.td = debitSom;
    $scope.voucher.tc = creditSom;
    //return {td : debitSom, tc : creditSom};
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
        record.trans_date = util.convertToMysqlDate($scope.voucher.trans_date);
        record.description = row.description;
        record.account_id = row.account.id;
        record.debit = row.debit;
        record.credit = row.credit;
        record.debit_equiv = exchange.myExchange(row.debit, $scope.voucher.currency_id);
        record.credit_equiv = exchange.myExchange(row.credit, $scope.voucher.currency_id);
        record.currency_id = $scope.voucher.currency_id;
        record.deb_cred_uuid = row.deb_cred_uuid;
        record.deb_cred_type = row.deb_cred_type;
        record.inv_po_id = $scope.voucher.inv_po_id;
        record.comment = row.comment;
        record.origin_id = 9;
        record.user_id = $scope.user.data.id;
        window.record = record;
        return connect.clean(record);
      });

        $q.all(records.map(function (row){
          return connect.basicPut('posting_journal', row);
        })).then(function (resp){
          var log = {
            transaction_id : $scope.voucher.trans_id,
            note           : $scope.voucher.description,
            date           : $scope.voucher.trans_date,
            user_id        : $scope.user.data.id
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
      resp.data[0].increment = (resp.data[0].increment)? resp.data[0].increment : 1;
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

  function verifySubmission (){
    var isAccountEmpty = false;
    if($scope.voucher.rows){
      isAccountEmpty = $scope.voucher.rows.some(function (row){
        return !row.account;
      });
    }
    return (($scope.voucher.td !== $scope.voucher.tc) || ($scope.voucher.td === 0 || $scope.voucher.tc === 0) || (isAccountEmpty) || $scope.voucher.rows.length < 2);
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

  $scope.$watch('voucher.trans_date', function(ov, nv){
    if(nv) {
      $scope.voucher.trans_date = (util.isDateAfter(nv, new Date()))? ov : nv;
    };
  }, true);

  $scope.addRow = addRow;
  $scope.submit = submit;
  $scope.setCurrency = setCurrency;
  $scope.getTotal = getTotal;
  $scope.removeRow = removeRow;
  $scope.verifySubmission = verifySubmission;
  }
]);
