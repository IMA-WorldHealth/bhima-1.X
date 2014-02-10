angular.module('kpk.controllers')
.controller('locationCtrl', function ($scope, $q, connect, messenger, validate, appstate) {
  'use strict';

  var dependencies = {},
      flags = $scope.flags = {};

  $scope.model = {};
//dependencies
dependencies.country = {
  query :  {tables: { 'country' : { columns : ['id', 'code', 'country_en', 'country_fr']}}}
};

dependencies.province = {
  query :  {tables: { 'province' : { columns : ['id', 'name', 'country_id']}}}
};

dependencies.sector = {
  query :  {tables: { 'sector' : { columns : ['id', 'name', 'province_id']}}}
};

dependencies.village = {
  query :  {tables: { 'village' : { columns : ['id', 'name', 'sector_id']}}}
};

dependencies.location = {
  query : 'location/'
};


//fonction
 
function manageLocation(model){
  for (var k in model) $scope.model[k] = model.k; 
  console.log(model);
}
  function formatVillage (id) {
    return stores.village ? stores.village.get(id).name : "";
  }

  function formatSector (id) {
    return stores.sector? stores.sector.get(id).name : "";
  }

  function formatProvince (id) {
    return stores.province ? stores.province.get(id).name : "";
  }

  function formatCountry (id) {
    return stores.country? stores.country.get(id).country_en : "";
  }




// function init () {
//     $q.all([
//       connect.req(imports.province),
//       connect.req(imports.sector),
//       connect.req(imports.village),
//       connect.req(imports.country),
//       connect.req(imports.location)
//     ]).then(function (array) {
//       array.forEach(function (depends, idx) {
//         stores[dependencies[idx]] = depends;
//         models[dependencies[idx]] = depends.data;
//       });
//       
//       $scope.data = {};
//
//       flags.new_country = true;
//       flags.new_province = true;
//       flags.new_sector = true;
//       flags.new_village = true;
//
//     });
//   }
//
  // function add () {
  //  
  // }

  // function select(type) {
  //   flags["new_" + type] = false;
  // }

  // $scope.$watch('data.country', function () {
  //   flags.new_country = false;
  // });

  // $scope.$watch('data.village', function () {
  //   flags.new_village = false;
  // });

  // $scope.$watch('data.province', function () {
  //   flags.new_province = false;
  // });

  // $scope.$watch('data.sector', function () {
  //   flags.new_sector = false;
  // });

  // function format (type) {
  //   // formats the typeahead after selection
  //   // TODO: reformat this a bit
  //   if (type == 'country') {
  //     return stores[type] ? stores[type].get($scope.data[type+'_id']).country_en : '';
  //   } else {
  //     return stores[type] ? stores[type].get($scope.data[type+'_id']).name  : '';
  //   }
  // }

  // function createSector () {
  //   var d = $q.defer();
  //   connect.basicPut('sector', [{name: $scope.data.sector_id}])
  //   .then(function (result) {
  //     var id = result.data.insertId;
  //     stores.sector.post({id: id, name: $scope.data.sector_id});
  //     d.resolve(result.data.insertId);
  //   }, function (error) {
  //     console.error("Something went wrong creating a sector:", error); 
  //     d.reject(error);
  //   });
  //   return d.promise;
  // }

  // function createVillage () {
  //   var d = $q.defer();
  //   connect.basicPut('village', [{name: $scope.data.village_id}])
  //   .then(function (result) {
  //     var id = result.data.insertId;
  //     stores.village.post({id: id, name: $scope.data.village_id});
  //     d.resolve(result.data.insertId);
  //   }, function (error) {
  //     console.error("Something went wrong creating a village:", error); 
  //     d.reject(error);
  //   });
  //   return d.promise;
  // }

  // function createProvince() {
  //   var d = $q.defer();
  //   connect.basicPut('province', [{name: $scope.data.province_id}])
  //   .then(function (result) {
  //     var id = result.data.insertId;
  //     stores.province.post({id: id, name: $scope.data.province_id});
  //     d.resolve(id);
  //   }, function (error) {
  //     console.error("Something went wrong creating a province:", error); 
  //     d.reject(error);
  //   });
  //   return d.promise;
  // }

  // function createLocation () {
  //   connect.basicPut('location', [$scope.data])
  //   .then(function (result) {
  //     messenger.push({type: 'success', msg: 'Location with id ' + result.data.insertId + ' created successfully.'});
  //     $scope.data.id = result.data.insertId;
  //     stores.location.post($scope.data);
  //     $scope.data = {};
  //     $scope.flags = {};
  //   }, function (error) {
  //     messenger.push({type: 'error', msg: 'Creation of location failed'});
  //     console.error("Error creating location:", $scope.data);  
  //   });
  // }

  // function submit () {
  //   // FIXME: find a non-niave solution for this issue

  //   var sector = $q.defer();
  //   var village = $q.defer();
  //   var province = $q.defer();
  //   var country = $q.defer();

  //   if (flags.new_sector) {
  //     createSector().then(function (id) {
  //       $scope.data.sector_id = id;
  //       sector.resolve(true);
  //     });
  //   } else sector.resolve(true);

  //   if (flags.new_village) {
  //     createVillage().then(function (id) {
  //       $scope.data.village_id = id;
  //       village.resolve(true);
  //     });
  //   } else village.resolve(true);

  //   if (flags.new_province) {
  //     createProvince().then(function (id) {
  //       $scope.data.province_id = id;
  //       province.resolve(true);
  //     });
  //   } else province.resolve(true);

  //   if (flags.new_country) {
  //     createCountry().then(function (id) {
  //       $scope.data.country_id = id;
  //       country.resolve(true);
  //     });
  //   } else country.resolve(true);

  //   $q.all([
  //       country.promise,
  //       province.promise,
  //       sector.promise,
  //       village.promise
  //   ]).then(function () {
  //     createLocation();
  //   });
  // }

  // function clear () {
  //   data = $scope.data = {};
  //   flags = $scope.flags = {};
  // }

  // $scope.add = add;
  $scope.formatVillage = formatVillage;
  $scope.formatSector = formatSector;
  $scope.formatProvince = formatProvince;
  $scope.formatCountry = formatCountry;
//  $scope.format = format;
  // $scope.select = select;
  // $scope.submit = submit;
  // $scope.clear = clear;

//  init();

// invocation

validate.process(dependencies).then(manageLocation);

});
