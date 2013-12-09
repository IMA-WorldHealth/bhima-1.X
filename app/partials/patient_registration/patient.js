angular.module('kpk.controllers')
.controller('patientRegController', function($scope, $q, $location, connect, $modal, kpkConnect, appstate) {
    var patient_model = {};
    var submitted = false;
    var default_patientID = 1;


    function init() { 
      //register patient for appcahce namespace
      var default_group = 3 //internal patient

      var location_request = connect.req({'tables' : {'location' : {'columns' : ['id', 'city', 'region']}}});
      //This was if we needed to create alpha-numeric (specific) ID's
      var patient_request = connect.req({'tables' : {'patient' : {'columns' : ['id']}}});
      //Used to generate debtor ID for patient
      //      FIXME just take the most recent items from the database, vs everything?
      var debtor_request = connect.req({'tables' : {'debitor' : {'columns' : ['id']}}});
      var debtor_group_request = connect.req({'tables' : {'debitor_group' : {'columns' : ['id', 'name', 'note']}}});

      $q.all([location_request, patient_request, debtor_request, debtor_group_request])
      .then(function(res) { 
        $scope.location_model = res[0];
        $scope.patient_model = res[1];
        $scope.debtor_model = res[2];
        $scope.debtor_group_model = res[3];
        //$scope.location = $scope.location_model.data[0]; //select default

        $scope.debtor = {};
        //$scope.debtor.debtor_group = $scope.debtor_group_model.get(default_group);
      });
    }

    function createId(data) {
      if(data.length===0) return default_patientID;
      var search = data.reduce(function(a, b) { a = a.id || a; return Math.max(a, b.id); });
      console.log("found", search);
      // quick fix
      search = (search.id !== undefined) ? search.id : search;
      //if (search.id) search = search.id;
      return search + 1;
    }

    $scope.update = function(patient) {
      //      download latest patient and debtor tables, calc ID's and update
      var patient_request = connect.req({'tables' : {'patient' : {'columns' : ['id']}}});
      var debtor_request = connect.req({'tables' : {'debitor' : {'columns' : ['id']}}});

      var patient_model, debtor_model;

      //      TODO verify patient data is valid

      $q.all([debtor_request, patient_request])
        .then(function(res) {
          debtor_model = res[0];
          patient_model = res[1];


          patient.id = createId(patient_model.data);
          patient.debitor_id = createId(debtor_model.data);
          console.log("created p_id", patient.id);
          console.log("created id", patient.debitor_id);

          commit(patient);
        });
    };

    function commit(patient) {

      var debtor = $scope.debtor;
      patient_model = patient;
      var format_debtor = {id: patient_model.debitor_id, group_id: $scope.debtor.debtor_group.id, text:patient_model.first_name+' - '+patient_model.last_name};
      console.log("requesting debtor;", format_debtor);
      //Create debitor record for patient - This SHOULD be done using an alpha numeric ID, like p12
      // FIXME 1 - default group_id, should be properly defined
      connect.basicPut("debitor", [format_debtor])
      .then(function(res) { 
        //Create patient record
        console.log("Debtor record added", res);
        connect.basicPut("patient", [patient_model])
        .then(function(res) {
          $location.path("patient_records/" + res.data.insertId);
          submitted = true;
        });
      });

    }

    $scope.formatLocation = function(l) { 
      return l.city + ", " + l.region;
    };

    $scope.checkChanged = function(model) { 
        return angular.equals(model, $scope.master);
    };

    $scope.checkSubmitted = function() { 
      return submitted;
    };

    function getGroups(){
      var req_db = {};
      req_db.e = [{t:'debitor_group', c:['id', 'name']}];
      req_db.c = [{t:'debitor_group', cl:'locked', z:'=', v:0}];
      kpkConnect.get('/data/?', req_db).then(function(data){
        $scope.debtor_group_model.data = data;
      });
      
    }

    $scope.createGroup = function () {
      var instance = $modal.open({
        templateUrl: "debtorgroupmodal.html",
        controller: function ($scope, $modalInstance) { //groupStore, accountModel
          $scope.group = {};
          getAccounts();
          getLocations();
          getPayments();
          getTypes();
          getPriceLists();
          function getAccounts(){
            connect.req({
              tables : {'account' : {columns : ["id", "account_number", "account_txt"]}},
              where : ["account.id<>1"]
            }).then(function (store) {
              $scope.accounts = store.data;
            });
          }

          function getLocations(){
            var req_db = {};
            req_db.e = [{t:'location', c:['id', 'city', 'region']}];
            kpkConnect.get('/data/?', req_db).then(function(data){
            $scope.locations = data;
            });
          }

          function getPayments () {
            var req_db = {};
            req_db.e = [{t:'payment', c:['id', 'text']}];
            kpkConnect.get('/data/?', req_db).then(function(data){
            $scope.payments = data;
            });
          }

          function getTypes () {
            var req_db = {};
            req_db.e = [{t:'debitor_group_type', c:['id', 'type']}];
            kpkConnect.get('/data/?', req_db).then(function(data){
              $scope.types = data;
            });
          }

          function getPriceLists () {
            connect.req({
              tables: {'price_list_name':{ columns: ["id", "name"]}},
              where: ["price_list_name.enterprise_id="+appstate.get('enterprise').id]
            }).then(function (store) {
              $scope.lists = store.data;
            });
          }

          $scope.formatAccount = function (account) {
            return [account.account_number, account.account_txt].join(' -- ');
          };

          $scope.formatLocation = function (location) {
            return [location.id, location.city, location.region].join(' -- ');
          };

          $scope.formatPayment = function (payment) {
            return [payment.id, payment.text].join(' -- ');
          };

          $scope.submit = function(){
            $modalInstance.close($scope.group);
          };

          $scope.discard = function () {
            $modalInstance.dismiss();
          };
        },
        resolve: {
          //groupStore: function () { return stores.inv_group; },
          //accountModel: function () { return $scope.models.account; }
        }
      });
      instance.result.then(function(value) {
        //kpkConnect.send('creditor_group', [{id:'', group_txt:values.group, account_id:values.account.id}]);
        //getGroups();
        value.enterprise_id = appstate.get("enterprise").id;
        value.account_id = value.account_id.id;
        value.type_id = value.type_id.id;
        value.location_id = value.location_id.id;
        value.payment_id = value.payment_id.id;
        kpkConnect.send('debitor_group', [value]);
        getGroups();
      }, function() {
        console.log('dismissed');
      });
    };

    init();
  });
