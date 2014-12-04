angular.module('bhima.controllers')
.controller('purchase_view', [
  '$scope',
  '$q',
  '$routeParams',
  'connect',
  function ($scope, $q, $routeParams, connect) {

    var session = $scope.session = {};
    session.option = $routeParams.option;
    
    $scope.purchase_filter = {};

    function init() {
      var promise = fetchRecords();
      $scope.selected = null;

      promise.then(function(model) {
        $scope.purchase_model = model;
      });

      $scope.post = function() {
        var selected = $scope.selected,
            request = [];

        if(selected) { request.push(selected.id); }

        connect.journal(request)
        .then(function(res) {
          if (res.status === 200) {
            invoicePosted(request);
          }
        });
      };
    }

    $scope.select = function(id) {
      $scope.selected = $scope.purchase_model.get(id);
    };

    function invoicePosted(ids) {
      var deferred = $q.defer();
      var promise_update = [];
      ids.forEach(function(invoice_id) {
        var current_invoice = $scope.invoice_model.get(invoice_id);
        current_invoice.posted = 1;
        promise_update.push(connect.basicPost('sale', [current_invoice], ['id']));
      });

      $q.all(promise_update)
        .then(function(res) {
          console.log('All ids posted');
          deferred.resolve(res);
        });

      return deferred.promise;
    }

    function fetchRecords() {
      var requette = {};
      $scope.selected = {};

      switch(session.option){
        case 'OrdersPayed' :
          requette = {
          'tables' : {
            'purchase' : {
              'columns' : ['uuid', 'reference', 'cost', 'discount', 'purchase_date', 'paid']
            },
            'creditor' : {
              'columns' : ['text']
            },
            'employee' : {
              'columns' : ['name', 'prenom']
            },
            'user' : {
              'columns' : ['first', 'last']
            }
          },
          join : [
            'purchase.creditor_uuid=creditor.uuid',
            'purchase.purchaser_id=user.id',
            'purchase.employee_id=employee.id'
          ],
          where : ['purchase.paid=1']
        };
      break;

      case 'OrdersWatingPayment' :
        requette = {
          'tables' : {
            'purchase' : {
              'columns' : ['uuid', 'reference', 'cost', 'discount', 'purchase_date', 'paid']
            },
            'creditor' : {
              'columns' : ['text']
            },
            'employee' : {
              'columns' : ['name', 'prenom']
            },
            'user' : {
              'columns' : ['first', 'last']
            }
          },
          join : [
            'purchase.creditor_uuid=creditor.uuid',
            'purchase.purchaser_id=user.id',
            'purchase.employee_id=employee.id'
          ],
          where : ['purchase.paid=0']
        };
      break;

      case 'OrdersReceived' :
        requette = {
          'tables' : {
            'purchase' : {
              'columns' : ['uuid', 'reference', 'cost', 'discount', 'purchase_date', 'paid']
            },
            'creditor' : {
              'columns' : ['text']
            },
            'employee' : {
              'columns' : ['name', 'prenom']
            },
            'user' : {
              'columns' : ['first', 'last']
            }
          },
          join : [
            'purchase.creditor_uuid=creditor.uuid',
            'purchase.purchaser_id=user.id',
            'purchase.employee_id=employee.id'
          ],
          where : ['purchase.closed=1']
        };
      break;

      case 'InWatingReception' :
        requette = {
          'tables' : {
            'purchase' : {
              'columns' : ['uuid', 'reference', 'cost', 'discount', 'purchase_date', 'paid']
            },
            'creditor' : {
              'columns' : ['text']
            },
            'employee' : {
              'columns' : ['name', 'prenom']
            },
            'user' : {
              'columns' : ['first', 'last']
            }
          },
          join : [
            'purchase.creditor_uuid=creditor.uuid',
            'purchase.purchaser_id=user.id',
            'purchase.employee_id=employee.id'
          ],
          where : ['purchase.closed=0','AND','purchase.confirmed=1']
        };
      break;

      default :
        requette = {
          'tables' : {
            'purchase' : {
              'columns' : ['uuid', 'reference', 'cost', 'discount', 'purchase_date', 'paid']
            },
            'creditor' : {
              'columns' : ['text']
            },
            'employee' : {
              'columns' : ['name', 'prenom']
            },
            'user' : {
              'columns' : ['first', 'last']
            }
          },
          join : [
            'purchase.creditor_uuid=creditor.uuid',
            'purchase.purchaser_id=user.id',
            'purchase.employee_id=employee.id'
          ]
        };
      break;

      }
      
      return connect.req(requette);
    }

    init();
  }
]);
