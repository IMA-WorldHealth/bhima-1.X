angular.module('bhima.controllers')
.controller('snis.new_report', [
  '$scope',
  '$q',
  '$translate',
  'validate',
  'messenger',
  'connect',
  'appstate',
  function ($scope, $q, $translate, validate, messenger, connect, appstate) {
    var session = $scope.session = { step : 1 },
        identif = $scope.identif = {},
        dependencies = {};

    dependencies.zs = {
      query : {
        tables : {
          'mod_snis_zs' : { columns : ['id', 'zone', 'territoire', 'province'] },
          'project'     : { columns : ['name'] },
          'enterprise'  : { columns : ['location_id'] },
          'village'     : { columns : ['name::villageName'] },
          'sector'      : { columns : ['name::sectorName'] },
          'province'    : { columns : ['name::provinceName'] }
        },
        join : [
          'project.enterprise_id=enterprise.id',
          'project.zs_id=mod_snis_zs.id',
          'enterprise.location_id=village.uuid',
          'village.sector_uuid=sector.uuid',
          'sector.province_uuid=province.uuid'
        ]
      }
    };

    dependencies.employes = {
      query : {
        tables : {
          'employee' : { columns : ['id', 'prenom', 'name', 'postnom'] },
          'fonction' : { columns : ['fonction_txt']}
        },
        join : ['employee.fonction_id=fonction.id']
      }
    };

    appstate.register('project', function (project) {
      $scope.project = project;
      dependencies.zs.query.where = ['project.id=' + $scope.project.id];
      validate.process(dependencies)
      .then(init);
    });

    function init (model) {
      angular.extend($scope, model);
      setIdentificationData();
    } 

    function setIdentificationData () {
      if ($scope.zs.data.length) {
        $scope.identif.province = $scope.zs.data[0].province;
        $scope.identif.territoire = $scope.zs.data[0].territoire;
        $scope.identif.zone = $scope.zs.data[0].zone;
        $scope.identif.hopital = $scope.zs.data[0].name;
        $scope.identif.adresse = $scope.zs.data[0].villageName + ',' + $scope.zs.data[0].sectorName + '-' + $scope.zs.data[0].provinceName;
        $scope.identif.medecin_dir = '';
        $scope.identif.qualification = '';
        $scope.identif.date_envoi = new Date();
        $scope.identif.date_reception = new Date();
        $scope.identif.date_encodage = new Date();
      } else {
        console.warn('There are no data...');
      }
      
    }

    function loadView (view_id) {
      session.step = view_id;
    }
    
    $scope.getMedecinDir = function (obj) {
      $scope.identif.medecin_dir_id = obj.id;
      $scope.identif.medecin_dir = obj.prenom + ', ' + obj.name + ' - ' + obj.postnom;
      $scope.identif.qualification = obj.fonction_txt;
    };

    $scope.snis_report = {};
    $scope.loadView = loadView;
  }
]);