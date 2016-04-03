angular.module('bhima.controllers')
.controller('configureBilan', [
  '$scope',
  '$http',
  '$translate',
  'validate',
  'reportConfigService',
  'messenger',
  // Prototype document building module, requests document given configuration obejct
  function ($scope, $http, $translate, validate, reportConfigService, messenger) {

    var session = $scope.session = {},
        dependencies = {},
        generatedDocumentPath = null,
        configuration = reportConfigService.configuration,
        parents = [], i = 0;

    dependencies.fiscalYears = {
      query : {
        identifier : 'id',
        tables : {
          'fiscal_year' : {
            columns : ['id', 'fiscal_year_txt', 'previous_fiscal_year', 'fiscal_year_txt']
          }
        }
      }
    };

    $scope.generate_doc = $translate.instant('BILAN.GENERATE_DOC');
    $scope.loading = $translate.instant('BILAN.LOADING');

    //getting fiscal years
    validate.process(dependencies)
    .then(setDefaultConfiguration);

    // Expose configuration to scope - set module state
    session.building = false;
    $scope.configuration = configuration;

    function selectConfiguration(key, value) {
      configuration[key].selected = value;
    }

    function setDefaultConfiguration(models) {
      angular.extend($scope, models);
      selectConfiguration('language', configuration.language.options[1]);
      $scope.session.fiscal_year_id = $scope.fiscalYears.data[$scope.fiscalYears.data.length-1].id;
      $scope.session.parents = getParents($scope.session.fiscal_year_id);
      $scope.session.ohada_structure = 1; //ohada structure checked
    }

    function getParents (fid){
      var fy = $scope.fiscalYears.data.filter(function (item){
        return item.id === fid;
      });

      i = 0;
      parents = getFirstForPrevious(fy[0]);
      return parents;
    }

    function getFirstForPrevious (fy){ 

      /** incrementing counter **/ 
      i++;    

      /** seek for the fiscal year which is the parent of fy **/
      var res = $scope.fiscalYears.data.filter(function (item){
        return item.id === fy.previous_fiscal_year;
      }); 

      /** Thsi case will happen if we sent 2014 as chosen fiscal year**/
      if(!res[0] && i === 1){ return [];}; // FIX ME a hack     

      /** stop de recursion if the root fiscal year is fetch or limit reached**/
      if(!res[0].previous_fiscal_year || i === 4){
        return res;
      }

      /** recursice call**/
      var x = res[0];
      return res.concat(getFirstForPrevious(x));
    }

    // POST configuration object to /report/build/:target
    function generateDocument() {

      var path = $scope.session.ohada_structure === 1 ? '/report/build/bilan' : '/report/build/bilan_inline';

      var configurationObject = {};

      // Temporarily set configuration options - This shouldn't be manually compiled
      configurationObject.language = configuration.language.selected.value;
      configurationObject.fy = $scope.session.fiscal_year_id;
      configurationObject.fy_txt = $scope.fiscalYears.get(configurationObject.fy).fiscal_year_txt;
      configurationObject.enterprise = configuration.enterprise;
      configurationObject.project = configuration.project;
      configurationObject.parentIds = $scope.session.parents.map(function (item){
        return item.id;
      });

      if($scope.session.ohada_structure === 0) {

        configurationObject.parentIds.sort(function (a, b){ return a-b;});
      }

      // Update state
      session.building = true;

      $http.post(path, configurationObject)
      .success(function (result) {
        // Expose generated document path to template
        session.building = false;
        $scope.generatedDocumentPath = result;
      })
      .error(function (code) {
        session.building = false;
        messenger.danger('error' + code);
      });
    }

    function clearPath() {
      $scope.generatedDocumentPath = null;
    }

    function switchFiscal (){
      $scope.session.parents = getParents($scope.session.fiscal_year_id);
    }

    $scope.selectConfiguration = selectConfiguration;
    $scope.generateDocument = generateDocument;
    $scope.clearPath = clearPath;
    $scope.switchFiscal = switchFiscal;
  }
]);
