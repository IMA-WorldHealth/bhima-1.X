angular.module('kpk.controllers')
.controller('stock.entry', [
  '$scope',
  '$translate',
  '$q',
  '$location',
  'validate',
  'connect',
  'messenger',
  'appstate',
  'precision',
  function ($scope, $translate, $q, $location, validate, connect, messenger, appstate, precision) {
    var dependencies = {},
        session = $scope.session = { cfg : {}, totals : [] },
        find = $scope.find = { active : true, fn : {} };

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
        where : ['purchase.posted=1']
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

    function startup (models) {
      angular.extend($scope, models);

      $scope.names.data.forEach(function (order) {
        order.label = $scope.projects.get(order.project_id).abbr + order.reference;
      });
    }

    function error (err) {
      messenger.danger(JSON.stringify(err));
    }

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

    function setSessionProperties (models) {
      if (models.orders.data.length < 1) {
        return $q.reject('ERROR.EMPTY_DATA');
      }

      // deactivate find
      find.valid = true;
      find.active = false;

      // set up watchers for totalling and validation
      $scope.$watch('session.order.data', calculateTotals, true);
      $scope.$watch('session.order.data', valid, true);

      session.order = models.orders;

      // set up session properties
      session.cfg.order_date = new Date(models.orders.data[0].purchase_date);
      session.cfg.employee_id = models.orders.data[0].employee_id;
      session.cfg.employee_name = ($scope.employees.get(session.cfg.employee_id).prenom || "") + " " + ($scope.employees.get(session.cfg.employee_id).name || "");
      return $q.when();
    }

    function calculateTotals () {
      if (!session.order || !session.order.data) { return; }

      // total and calculate metadata
      var totals = session.totals,
          groups = {};

      totals.quantity = 0;
      totals.price = 0;
      totals.purchase_price = 0;
      totals.items = session.order.data.length;

      session.order.data.forEach(function (drug) {
        totals.quantity += precision.round(drug.quantity);
        totals.price += precision.round(drug.unit_price * drug.quantity);
        totals.purchase_price += precision.round(drug.purchase_price || 0);
        if (!groups[drug.name]) { groups[drug.name] = 0; }
        groups[drug.name] += 1;
      });

      totals.groups = Object.keys(groups).length;
    }

    function valid () {
      session.valid = !!find.valid && !!session.order && !!session.order.data &&
        session.order.data.length > 0 && !!session.cfg.depot &&
        session.order.data.every(function (drug) {
          return !Number.isNaN(Number(drug.purchase_price)) && Number(drug.purchase_price) > 0;
        });
    }

    $scope.setDepot = function setDepot (depot) {
      session.cfg.depot = depot;
      valid();
    };

    find.fn.commit = function commit (order) {
      // order.label is a text identifier such as
      // PAX2 or HBB1235
      if (!order || !order.label|| order.label.length < 1) { messenger.danger($translate('STOCK.ENTRY.ERR_EMPTY_PARAMTER')); }

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

    $scope.assignLots = function assignLots () {
      var db = {
        cfg : session.cfg,
        order : session.order,
        totals : session.totals,
      };
      appstate.set('stock.data', db);
      $location.path('/stock/entry/lots/');
    };

    $scope.cancel = function cancel () {
      session = $scope.session = { cfg : {}, totals : [] };
      find.fn.reset();
    };

  }
]);
