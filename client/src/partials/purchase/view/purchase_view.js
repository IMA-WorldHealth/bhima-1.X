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
          where : ['purchase.paid=1', 'AND', 'purchase.is_donation=0']
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
          where : ['purchase.paid=0', 'AND', 'purchase.confirmed=0', 'AND', 'purchase.is_donation=0']
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
          where : ['purchase.closed=1', 'AND', 'purchase.confirmed=1', 'AND', 'purchase.is_donation=0']
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
          where : ['purchase.closed=0','AND','purchase.confirmed=1', 'AND', 'purchase.is_donation=0']
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
          ],
          where : ['purchase.is_donation=0']
        };
      break;

      }
      
      return connect.req(requette);
    }

    init();
  }
]);
