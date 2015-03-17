angular.module('bhima.controllers')
.controller('report.donation', [
  '$scope',
  '$timeout',
  '$routeParams',
  '$translate',
  'appstate',
  'util',
  'validate',
  'exchange',
  function ($scope, $timeout, $routeParams, $translate, appstate, util, validate, exchange) {
    
    var dependencies = {},
        state = $scope.state,
        session = $scope.session = { param : {}, searching : true };

    dependencies.donor = {
      required: true,
      query : {
        tables : {
          'donor' : {
            columns : ['id', 'name']
          }
        }
      }
    };

    dependencies.donation = {
      query : {
        tables : {
          'donations'     : { columns : ['date'] },
          'donation_item' : { columns : ['tracking_number'] },
          'stock'         : { columns : ['inventory_uuid', 'quantity', 'lot_number', 'entry_date', 'expiration_date'] },
          'inventory'     : { columns : ['text'] },
          'donor'         : { columns : ['name::donorName'] },
          'employee'      : { columns : ['name::employeeName'] }
        },
        join : [
          'donation_item.donation_uuid=donations.uuid',
          'donation_item.tracking_number=stock.tracking_number',
          'inventory.uuid=stock.inventory_uuid',
          'donor.id=donations.donor_id',
          'employee.id=donations.employee_id',
        ]
      }
    };

    validate.process(dependencies, ['donor'])
    .then(init);       

    function init (model) {
      angular.extend($scope, model);
    }

    function getDonor () {
      if (session.donor === '*') {
        session.labelDonor = '' + $translate.instant('UTIL.ALL_DONORS');
      } else {
        session.donorObject = JSON.parse(session.donor);
        session.labelDonor = session.donorObject.name;
        session.donor_id = session.donorObject.id;
      }
    }

    function sum(a, b) {
    	return a + (b.unit_price * b.quantity);
    }

    $scope.print = function print() {
      window.print();
    };

    function reconfigure () {
      $scope.state = null;
    }

    function generate () {
      $scope.state = 'generate';

      if (session.donor_id) {
        dependencies.donation.query.where = ['donor.id=' + session.donor_id];
      }

      validate.refresh(dependencies, ['donation'])
      .then(init);
    } 

    appstate.register('enterprise', function(enterprise) {
      $scope.enterprise = enterprise;
    });

    $scope.reconfigure = reconfigure;
    $scope.getDonor = getDonor;
    $scope.generate = generate;
  }
]);
