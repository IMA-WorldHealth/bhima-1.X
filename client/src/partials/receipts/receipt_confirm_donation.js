angular.module('bhima.controllers')
.controller('receipt.confirm_donation', [
  '$scope',
  'validate',
  'appstate',
  'messenger',
  function ($scope, validate, appstate, messenger) {
    var dependencies = {}, model = $scope.model = {common : {}};

    dependencies.confirmDonations = {
      query : {
        identifier : 'uuid',
        tables : {
          donations : { columns : ['uuid', 'date'] },
          donor : { columns : ['name::name_donor'] },
          employee : { columns : ['name::name_employee', 'prenom', 'postnom'] },
          user : { columns : ['first', 'last'] } 
        },
        join : [
          'donations.donor_id=donor.id',
          'donations.employee_id=employee.id',
          'donations.confirmed_by=user.id']
      }
    };

    dependencies.donations = {
      query : {
        identifier : 'uuid',
        tables : {
          'donations' : {
            columns : ['uuid', 'date']
          },
          'donation_item' : {
            columns : ['donation_uuid', 'tracking_number']
          },          
          'stock' : {
            columns : ['inventory_uuid', 'quantity']
          },
          'inventory' : {
            columns : ['code', 'text']
          }
        },
        join : [
          'donations.uuid=donation_item.donation_uuid',
          'donation_item.tracking_number=stock.tracking_number',
          'inventory.uuid=stock.inventory_uuid'
        ]
      }
    };

    function buildInvoice (res) {
      console.log(res.confirmDonations.data[0]);
      model.donations = res.donations.data;
      model.confirmDonations = res.confirmDonations.data.pop();
    }

  	appstate.register('receipts.commonData', function (commonData) {
  		commonData.then(function (values) {

        model.common.location = values.location.data.pop();
        model.common.InvoiceId = values.invoiceId;
        model.common.enterprise = values.enterprise.data.pop();
        //dependencies.confirmDonations.query.where =  ['donations.uuid=' + values.invoiceId];
        dependencies.confirmDonations.query.where =  ['donations.uuid=' + values.invoiceId];
        dependencies.donations.query.where =  ['donations.uuid=' + values.invoiceId];

        validate.process(dependencies)
        .then(buildInvoice)
        .catch(function (err){
          messenger.danger('error', err);
        });
  		});     
    });    
  }
]);