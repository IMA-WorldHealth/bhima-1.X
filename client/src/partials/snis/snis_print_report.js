angular.module('bhima.controllers')
.controller('snis.print_report', SnisPrintReportController);

SnisPrintReportController.$inject = [
  '$http', '$routeParams', '$location',
  'validate', 'SessionService', 'util'
];

function SnisPrintReportController ($http, $routeParams, $location, validate, SessionService, util) {
  var vm = this,
      session = vm.session = { step : 1 },
      identif = vm.identif = {},
      dependencies         = {};

  session.reportId = $routeParams.id;
  session.section  = $routeParams.section;

  dependencies.zs = {
    identifier : 'id',
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

  dependencies.report = {
    query : {
      tables : {
        'mod_snis_rapport' : { columns : ['date'] }
      },
      where : ['mod_snis_rapport.id=' + session.reportId]
    }
  };

  dependencies.employes = {
    query      : {
      tables : {
        'employee' : { columns : ['id', 'prenom', 'name', 'postnom'] },
        'fonction' : { columns : ['fonction_txt']}
      },
      join : ['employee.fonction_id=fonction.id']
    }
  };

  /** startup the module */
  startup();

  function startup() {
    vm.project = SessionService.project;
    dependencies.zs.query.where = ['project.id=' + vm.project.id];
    validate.process(dependencies)
    .then(init)
    .then(load);
  }

  function load() {
    if (session.reportId) {
      session.loading = true;
      $http.get('/snis/getReport/' + session.reportId)
      .then(function (res) {
        setSnisData(res.data.snisData);
        setIdentificationData(res.data.identification);
      })
      .then(function () {
        session.loading = false;
      });
    }
  }

  function init(model) {
    angular.extend(vm, model);
  } 

  function setIdentificationData (identification) {
    var medecin = vm.employes.get(identification[0].id_employe_medecin_dir);
    var envoi = vm.employes.get(identification[0].id_employe_envoi);
    var reception = vm.employes.get(identification[0].id_employe_reception);
    var encodage = vm.employes.get(identification[0].id_employe_encodage);
    var zone = vm.zs.get(identification[0].id_zs);

    vm.identif.mois = new Date(util.htmlDate(vm.report.data[0].date));

    vm.getMedecinDir(medecin);
    vm.identif.nom_envoi_selected(envoi);
    vm.identif.nom_reception_selected(reception);
    vm.identif.nom_encodage_selected(encodage);

    vm.identif.province = zone.province;
    vm.identif.territoire = zone.territoire;
    vm.identif.zone = zone.zone;
    vm.identif.id_zs = zone.id;
    vm.identif.hopital = zone.name;
    vm.identif.info = identification[0].information;
    vm.identif.adresse = zone.zone + ',' + zone.territoire + ' - ' + zone.province;
    vm.identif.date_envoi = new Date(util.htmlDate(identification[0].date_envoie));
    vm.identif.date_reception = new Date(util.htmlDate(identification[0].date_reception));
    vm.identif.date_encodage = new Date(util.htmlDate(identification[0].date_encodage));
  }

  function setSnisData (snisData) {
    snisData.forEach(function (field) {
      vm.snis_report[field.attribut_form] = field.value;
    });
  }
  
  vm.getMedecinDir = function (obj) {
    vm.identif.medecin_dir_id = obj.id;
    vm.identif.medecin_dir = obj.prenom + ', ' + obj.name + ' - ' + obj.postnom;
    vm.identif.qualification = obj.fonction_txt;
  };

  vm.identif.nom_envoi_selected = function (obj) {
    vm.identif.nom_envoi_id = obj.id;
    vm.identif.nom_envoi = obj.prenom + ', ' + obj.name + ' - ' + obj.postnom;
  };

  vm.identif.nom_reception_selected = function (obj) {
    vm.identif.nom_reception_id = obj.id;
    vm.identif.nom_reception = obj.prenom + ', ' + obj.name + ' - ' + obj.postnom;
  };

  vm.identif.nom_encodage_selected = function (obj) {
    vm.identif.nom_encodage_id = obj.id;
    vm.identif.nom_encodage = obj.prenom + ', ' + obj.name + ' - ' + obj.postnom;
  };

  vm.getPeriod = function (obj) {
    vm.period = util.sqlDate(obj);
  };

  vm.print = function () { print(); };

  vm.snis_report = {};
}