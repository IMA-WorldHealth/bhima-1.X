angular.module('kpk.controllers')
.controller('stock.lots', [
  '$scope',
  '$location',
  'store',
  'appstate',
  'messenger',
  'validate',
  'connect',
  'uuid',
  function ($scope, $location, Store, appstate, messenger, validate, connect, uuid) {

    var session = $scope.session = {
      lots : new Store({ identifier : 'uuid', data : [] })
    };

    var triage = $scope.triage = { codes : [] };

    function Lot () {
      this.id = uuid();
      this.inventory_code = null;
      this.purchase_price = 0;
      this.expiration_date = new Date();
      this.entry_date = new Date();
      this.lot_number = 0;
      this.purchase_order_uuid = null;
      this.tracking_number = 0;
      this.quantity = 0;
      this.active = true;
    }

    function startup (db) {
      if (!db) { return messenger.danger('ERR.NOT_FOUND'); }
      session.lots.post(new Lot());
      angular.extend(session, db);

      // perform triage of the data
      session.order.data.forEach(function (drug) {
        if (triage.codes.indexOf(drug.code) < 0) {
          triage.codes.push(drug.code);
        }
      });
    }

    function error (err) {
      messenger.error(err);
    }

    startup(appstate.get('stock.lots'));

    $scope.review = function review () {
      console.log('Reviewing...');
    };

    $scope.add = function add () {
      session.lots.post(new Lot());
    };

    $scope.remove = function remove (id) {
      session.lots.remove(id);
    };

    $scope.edit = function edit (id) {
      session.lots.get(id).active = true;
    };

    $scope.commit = function commit (id) {
      session.lots.get(id).active = false;
    };

    $scope.back = function back () {
      $location.path('/stock/entry');
    };

    $scope.setQuantity = function setQuantity (lot) {
      var item, code = lot.inventory_code;
      session.order.data.forEach(function (drug) {
        if (drug.code === lot.inventory_code) { item = drug; }
      });
      lot.quantity = item.quantity;
    };

    $scope.calculateTotals = function calculateTotals () {
    };

  }
]);
