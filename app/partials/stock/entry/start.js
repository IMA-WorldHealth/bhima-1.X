angular.module('kpk.controllers')
.controller('stock.entry.start', [
  '$scope',
  '$translate',
  '$q',
  '$location',
  '$routeParams',
  '$filter',
  'validate',
  'connect',
  'messenger',
  'appstate',
  'precision',
  'appcache',
  'store',
  'uuid',
  function ($scope, $translate, $q, $location, $routeParams, $filter, validate, connect, messenger, appstate, precision, AppCache, Store, uuid) {
    var dependencies = {},
        session = $scope.session = { cfg : {}, totals : [] },
        find = $scope.find = { active : true, fn : {} },
        cache = new AppCache('stock.entry');

    if (!angular.isDefined($routeParams.depotId)) {
      messenger.error('NO_DEPOT_ID');
    }

    session.cfg.depot = { id : $routeParams.depotId };

    dependencies.depots = {
      query : {
        tables : {
          'depot' : {
            columns : ['id', 'text']
          }
        }
      }
    };

    dependencies.projects = {
      query : {
        tables : {
          'project' : {
            columns : ['id', 'abbr']
          }
        }
      }
    };

    dependencies.names = {
      query : {
        identifier : 'uuid',
        tables : {
          'purchase' : {
            columns : ['uuid', 'reference', 'project_id']
          }
        },
        where : ['purchase.paid=0']
      }
    };

    dependencies.employees = {
      query : {
        tables : {
          'employee' : {
            columns : ['id', 'prenom', 'name']
          }
        }
      }
    };

    dependencies.orders = {
      query : {
        identifier : 'code',
        tables : {
          'purchase' : {
            columns : ['project_id', 'reference', 'cost', 'currency_id', 'creditor_uuid', 'purchaser_id', 'employee_id', 'timestamp', 'purchase_date']
          },
          'purchase_item' : {
            columns : ['uuid', 'inventory_uuid', 'quantity', 'unit_price', 'total']
          },
          'project' : {
            columns : ['abbr']
          },
          'inventory' : {
            columns : ['code', 'text']
          },
          'inventory_group' : { // FIXME : add alaising the connect.req();
            columns : ['name']
          }
        },
        join : [
          'purchase.uuid=purchase_item.purchase_uuid',
          'purchase.project_id=project.id',
          'purchase_item.inventory_uuid=inventory.uuid',
          'inventory.group_uuid=inventory_group.uuid'
        ],
      }
    };

    find.fn.commit = function commit (order) {
      // order.label is a text identifier such as
      // PAX2 or HBB1235
      if (!order || !order.label || order.label.length < 1) { return messenger.danger($translate('STOCK.ENTRY.ERR_EMPTY_PARAMTER')); }

      session.cfg.purchase_uuid = order.uuid;
      session.cfg.label = order.label;
      var project = order.label.substr(0,3).toUpperCase();
      var reference = Number(order.label.substr(3));

      dependencies.orders.query.where =
        ['project.abbr=' + project, 'AND', 'purchase.reference=' + reference];

      validate.refresh(dependencies, ['orders'])
      .then(setSessionProperties)
      .then(calculateTotals)
      .catch(function (err) {
        find.valid = false;
        error(err);
      });
    };

    find.fn.activate = function activate () {
      find.active = true;
    };

    find.fn.reset = function reset () {
      find.active = true;
      find.valid = false;
    };

    function startup (models) {
      angular.extend($scope, models);

      $scope.names.data.forEach(function (order) {
        order.label = $scope.projects.get(order.project_id).abbr + order.reference;
      });
    }

    function error (err) {
      messenger.danger(JSON.stringify(err));
    }

    function loadOrder (order) {
      if (!order) { return; }
    }

    cache.fetch('order')
    .then(loadOrder)
    .catch(error);

    appstate.register('project', function (project) {
      $scope.project = project;
      dependencies.depots.query.where =
        ['depot.enterprise_id=' + project.enterprise_id];
      dependencies.projects.query.where =
        ['project.enterprise_id=' + project.enterprise_id];
      validate.process(dependencies, ['names', 'depots', 'projects', 'employees'])
      .then(startup)
      .catch(error);
    });

    function validateSession () {
      session.valid = session.order.data.every(function (drug) {
        return drug.validLots;
      });
    }

    function setSessionProperties (models) {
      if (models.orders.data.length < 1) {
        return $q.reject('ERROR.EMPTY_DATA');
      }

      // deactivate find
      find.valid = true;
      find.active = false;

      // set up watchers for totalling and validation
      $scope.$watch('session.order.data', calculateTotals, true);
      $scope.$watch('session.order.data', validateSession, true);

      session.order = models.orders;

      // set up session properties
      session.cfg.order_date = new Date(models.orders.data[0].purchase_date);
      session.cfg.employee_id = models.orders.data[0].employee_id;
      session.cfg.employee_name = ($scope.employees.get(session.cfg.employee_id).prenom || "") + " " + ($scope.employees.get(session.cfg.employee_id).name || "");

      // modify paramters
      session.order.data.forEach(function (drug) {
        drug.lots = new Store({ identifier : 'tracking_number', data : [] });
        angular.extend(drug, { isCollapsed : false, edittable : true });
        //drug.isCollapsed = false;
        //drug.edittable = true;
        $scope.addLot(drug);
      });

      return $q.when();
    }

    function sum (a, b) {
      return a + Number(b.quantity);
    }

    function formatDate (date) {
      return $filter('date')(date, 'yyyy-MM-dd');
    }

    function calculateTotals () {
      if (!session.order || !session.order.data) { return; }

      // total and calculate metadata
      var totals = session.totals;

      totals.quantity = 0;
      totals.price = 0;
      totals.purchase_price = 0;
      totals.items = session.order.data.length;

      session.order.data.forEach(function (drug) {

        totals.quantity += precision.round(drug.quantity);
        totals.price += precision.round(drug.unit_price * drug.quantity);

        drug.totalQuantity = drug.lots.data.reduce(sum, 0);
        drug.validLots = valid(drug.lots) && drug.totalQuantity === drug.quantity;
      });
    }

    function valid (lots) {
      var isDef = angular.isDefined;
      return lots.data.every(function (row) {
        var n = Number.parseFloat(row.quantity);
        return n > 0 && isDef(row.lot_number) &&
          isDef(row.expiration_date) &&
          !!row.lot_number;
      });
    }

    $scope.cancel = function cancel () {
      session = $scope.session = { cfg : {}, totals : [] };
      find.fn.reset();
    };

    $scope.toggleEdit = function toggleEdit (drug) {
      drug.edittable = !drug.edittable;
    };

    $scope.expand = function expand (drug) {
      drug.isCollapsed = !drug.isCollapsed;
    };

    function Lot () {
      this.inventory_uuid = null;
      this.purchase_order_uuid = null;
      this.expiration_date = $filter('date')(Date.now(), 'yyyy-MM-dd');
      this.date = Date.now();
      this.lot_number = null;
      this.tracking_number = uuid();
      this.quantity = 0;
    }

    $scope.addLot = function addLot (drug) {
      var lot = new Lot();
      lot.code = drug.code;
      lot.inventory_uuid = drug.inventory_uuid;
      drug.lots.post(lot);
    };

    $scope.removeLot = function removeLot (drug, idx) {
      drug.lots.data.splice(idx, 1);
    };

    $scope.review = function review () {
      // prepare object for cloning
      var data = session.order.data;
      var lots = [];
      data.forEach(function (o) {
        lots = lots.concat(o.lots.data);
      });
      cache.put('order', { data : lots, cfg : session.cfg } );
      $location.path('/stock/entry/review/' + session.cfg.depot.id);
    };

  }
]);
