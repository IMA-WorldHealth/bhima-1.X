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
        session = $scope.session = {},
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
        identifier : 'uuid',
        tables : {
          'purchase' : {
            columns : ['project_id', 'reference', 'cost', 'currency_id', 'creditor_uuid', 'purchaser_id', 'employee_id', 'timestamp', 'invoice_date']
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

    function loadPurchaseOrder (models) {
      if (models.orders.data.length < 1) {
        return $q.reject('ERROR.EMPTY_DATA');
      }
      angular.extend($scope, models);
      find.valid = true;
      find.active = false;
      session.order = models.orders;
      session.order_date = new Date(models.orders.data[0].invoice_date);
      session.purchaser_id = models.orders.data[0].employee_id;
      session.purchaser_name = ($scope.employees.get(session.purchaser_id).prenom || "") + " " + $scope.employees.get(session.purchaser_id).name;
      return $q.when();
    }

    function calculateTotals () {
      // total and calculate metadata
      var totals = session.total || (session.total = []);
      var grps = {};
      totals.quantity = 0;
      totals.price = 0;
      totals.items = $scope.orders.data.length;
      $scope.orders.data.forEach(function (drug) {
        totals.quantity += precision.round(drug.quantity);
        totals.price += precision.round(drug.unit_price * drug.quantity);
        if (!grps[drug.name]) { grps[drug.name] = 0; }
        grps[drug.name] += 1;
      });
      totals.groups = Object.keys(grps).length;
    }

    find.fn.commit = function commit (id) {
      // This comes in as a text identifier such as
      // PAX2 or HBB1235
      if (!id || id.length < 1) { messenger.danger($translate('STOCK.ENTRY.ERR_EMPTY_PARAMTER')); }
      session.order_id = id;
      var project = id.substr(0,3).toUpperCase();
      var reference = Number(id.substr(3));

      dependencies.orders.query.where =
        ['project.abbr=' + project, 'AND', 'purchase.reference=' + reference];

      validate.process(dependencies, ['orders'])
      .then(loadPurchaseOrder)
      .then(calculateTotals)
      .catch(function (err) {
        find.valid = false;
        error(err);
      });
    };

    find.fn.activate = function activate () {
      find.active = true;
    };

    $scope.assignLots = function assignLots () {
      appstate.set('stock.lots', session);
      $location.path('/stock/entry/lots/');
    };

    $scope.cancel = function cancel () {
      session = $scope.session = {};
      find = $scope.find = { active : true, fn : {} };
    };

  }
]);
