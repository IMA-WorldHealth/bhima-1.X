angular.module('kpk.controllers')
.controller('creditorsController', [
  '$scope',
  '$q',
  '$translate',
  'validate',
  'connect',
  'appstate',
  'uuid',
  'messenger',
  function ($scope, $q, $translate, validate, connect, appstate, uuid, messenger) {
    var dependencies = {}, session = $scope.session = {}, route = {};
   
    dependencies.creditGroup = { 
      query : { 
        tables : { 
          creditor_group : { columns : ['enterprise_id', 'uuid', 'name', 'account_id', 'locked'] }
        }
      }
    };

    dependencies.supplier = { 
      query : { 
        identifier : 'uuid',
        tables : { 
          supplier : { columns : ['uuid', 'name', 'phone', 'locked', 'email', 'location_id', 'international'] },
          creditor : { columns : ['group_uuid'] }
        },
        join : ['supplier.creditor_uuid=creditor.uuid']
      }
    };
  
    dependencies.village = {
      query : {
        identifier : 'uuid',
        tables : { 'village' : { 'columns' : ['uuid', 'name', 'sector_uuid'] }}
      }
    };

    dependencies.sector = {
      query : {
        identifier : 'uuid',
        tables : { 'sector' : { 'columns' : ['uuid', 'name', 'province_uuid'] }}
      }
    };

    dependencies.province = {
      query : {
        identifier : 'uuid',
        tables : { 'province' : { 'columns' : ['uuid', 'name', 'country_uuid'] }}
      }
    };

    dependencies.country = {
      query : {
        identifier : 'uuid',
        tables : { 'country' : { 'columns' : ['uuid', 'country_en', 'country_fr'] }}
      }
    };
 
    route = $scope.route = { 
      create : {
        header'SUPPLIER.CREATE'
      },
      edit : 'SUPPLIER.EDIT'
    };
    
    appstate.register('project', initialise);
    
    function initialise(project) { 
      session.project = project;
      session.state = route.create;
      session.location = {};

      // Request data from server
      validate.process(dependencies).then(settupForm);
    }

    function settupForm(model) { 
      angular.extend($scope, model); 
      setDefaultLocation(session.project.location_id);
    }
      
    function setDefaultLocation(location_id) { 
      session.location.village = $scope.village.get(location_id);
      session.location.sector = $scope.sector.get(session.location.village.sector_uuid);
      session.location.province = $scope.province.get(session.location.sector.province_uuid);
      session.location.country = $scope.country.get(session.location.province.country_uuid);
    }
    
    function createSupplier() { 
      session.supplier = {};
      session.creditor = {};
      setDefaultLocation(session.project.location_id);
          
      session.state = route.create;
      session.selected = null;
    }

    function editSupplier(uuid) { 
      
      // Verify there is nothing in the current session
      assignSupplier($scope.supplier.get(uuid)); 
      session.state = route.edit;
      session.selected = uuid;
    }

    function assignSupplier(supplier) {
      session.supplier = supplier;
      session.creditor = { group_uuid : supplier.group_uuid };
      setDefaultLocation(supplier.location_id);
    }

    function registerSupplier() { 
      var creditor_uuid = uuid();
      
      // Assign uuid and note to creditor
      session.creditor.uuid = creditor_uuid;
      session.creditor.text = "Supplier [" + session.supplier.name + "]";

      // Assign uuid, location and creditor id to supplier
      session.supplier.uuid = uuid();
      session.supplier.location_id = session.location.village.uuid;
      session.supplier.creditor_uuid = creditor_uuid;

      requestCreditor(session.creditor)
      .then(requestSupplier(session.supplier))
      .then(handleRegistration)
      .catch(handleError);
    }

    function requestCreditor(creditor) { 
      return connect.basicPut('creditor', [creditor]);
    }

    function requestSupplier(supplier) { 
      return connect.basicPut('supplier', [supplier]);
    }

    function handleRegistration(success) { 
      messenger.success($translate('SUPPLIER.REGISTRATION_SUCCESS'));
      $scope.supplier.post(session.supplier);
      createSupplier();
    }

    function handleError(error) { 
      // TODO reverse previous incorrect transactions
      messenger.danger($translate('SUPPLIER.REGISTRATION_FAILURE'));
      throw error;
    }
    $scope.registerSupplier = registerSupplier;
    $scope.editSupplier = editSupplier;
    $scope.createSupplier = createSupplier;
  }
]);
