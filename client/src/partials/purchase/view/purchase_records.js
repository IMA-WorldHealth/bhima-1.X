
var purchaseRecords = function ($q, connect) {
  var that = this;
    var session = that.session = { purchase_type: 'indirect'};
    that.purchase_filter = {};

    function init() {
      that.selected = null;
      var promise = fetchRecords();

      promise.then(function(model) {
        that.indirect_purchase = model[1];
        that.direct_purchase = model[0];
      });
    }

    function fetchRecords() {
      that.selected = {};
      var indirect = {
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
          'purchase.emitter_id=user.id',
          'purchase.purchaser_id=employee.id'
        ],
        where : ['purchase.is_direct=0', 'AND', 'purchase.is_donation=0']
      };

      var direct = {
        'tables' : {
          'purchase' : {
            'columns' : ['uuid', 'reference', 'cost', 'discount', 'purchase_date', 'confirmed']
          },
          'creditor' : {
            'columns' : ['text']
          },
          'supplier' : {
            'columns' : ['name']
          },
          'user' : {
            'columns' : ['first', 'last']
          }
        },
        join : [
          'purchase.creditor_uuid=creditor.uuid',
          'purchase.emitter_id=user.id',
          'creditor.uuid=supplier.creditor_uuid'
        ],
        where : ['purchase.is_direct=1', 'AND', 'purchase.is_donation=0']
      };

      var d = connect.req(direct);
      var i = connect.req(indirect);
      return $q.all([d,i]);
    }

    init();
};

purchaseRecords.$inject = ['$q', 'connect'];
angular.module('bhima.controllers').controller('purchaseRecords', purchaseRecords);
