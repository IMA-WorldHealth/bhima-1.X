angular.module('kpk.controllers')
.controller('locationCtrl', function ($scope, $q, connect) {
  'use strict';

  var imports = {},
      stores = {},
      flags = $scope.flags = {},
      models = $scope.models = {};

  imports.province = {tables: { 'province' : { columns : ['id', 'name']}}};
  imports.sector = {tables: { 'sector' : { columns : ['id', 'name']}}};
  imports.village = {tables: { 'village' : { columns : ['id', 'name']}}};
  imports.country = {tables: { 'country' : { columns : ['id', 'country_en']}}};
  imports.location = {tables : { 'location' : { columns : ['id', 'province_id', 'village_id', 'sector_id', 'country_id']}}};
  
  var dependencies = ['province', 'sector', 'village', 'country', 'location'];

  function init () {
    $q.all([
      connect.req(imports.province),
      connect.req(imports.sector),
      connect.req(imports.village),
      connect.req(imports.country),
      connect.req(imports.location)
    ]).then(function (array) {
      console.log("Loaded: ", array);
      array.forEach(function (depends, idx) {
        stores[dependencies[idx]] = depends;
        models[dependencies[idx]] = depends.data;
      });
      
      $scope.data = {};

      flags.new_country = true;
      flags.new_province = true;
      flags.new_sector = true;
      flags.new_village = true;

    });
  }

  function add () {
   
  }

  function select(type) {
    flags["new_" + type] = false;
  }

  $scope.$watch('data.country', function () {
    flags.new_country = false;
  });

  $scope.$watch('data.village', function () {
    flags.new_village = false;
  });

  $scope.$watch('data.province', function () {
    flags.new_province = false;
  });

  $scope.$watch('data.sector', function () {
    flags.new_sector = false;
  });

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

  function format (type) {
    // formats the typeahead after selection
    // TODO: reformat this a bit
    if (type == 'country') {
      return stores[type] ? stores[type].get($scope.data[type+'_id']).country_en : '';
    } else {
      return stores[type] ? stores[type].get($scope.data[type+'_id']).name  : '';
    }
  }

  function createSector () {
    var d = $q.defer();
    connect.basicPut('sector', [{name: $scope.data.sector_id}])
    .then(function (result) {
      var id = result.data.insertId;
      stores.sector.post({id: id, name: $scope.data.sector_id});
      d.resolve(result.data.insertId);
    }, function (error) {
      console.error("Something went wrong creating a sector:", error); 
      d.reject(error);
    });
    return d.promise;
  }

  function createVillage () {
    var d = $q.defer();
    connect.basicPut('village', [{name: $scope.data.village_id}])
    .then(function (result) {
      var id = result.data.insertId;
      stores.village.post({id: id, name: $scope.data.village_id});
      d.resolve(result.data.insertId);
    }, function (error) {
      console.error("Something went wrong creating a village:", error); 
      d.reject(error);
    });
    return d.promise;
  }

  function createProvince() {
    var d = $q.defer();
    connect.basicPut('province', [{name: $scope.data.province_id}])
    .then(function (result) {
      var id = result.data.insertId;
      stores.province.post({id: id, name: $scope.data.province_id});
      d.resolve(id);
    }, function (error) {
      console.error("Something went wrong creating a province:", error); 
      d.reject(error);
    });
    return d.promise;
  }

  function createLocation () {
    console.log("Creating Location: ", $scope.data);
    connect.basicPut('location', [$scope.data])
    .then(function (result) {
      console.log("Inserted a New location successfully");
      $scope.data.id = result.data.insertId;
      stores.location.post($scope.data);
      $scope.data = {};
      $scope.flags = {};
    }, function (error) {
      console.error("Error creating location:", $scope.data);  
    });
  }

  function submit () {
    // FIXME: find a non-niave solution for this issue

    var sector = $q.defer();
    var village = $q.defer();
    var province = $q.defer();
    var country = $q.defer();

    if (flags.new_sector) {
      createSector().then(function (id) {
        $scope.data.sector_id = id;
        sector.resolve(true);
      });
    } else sector.resolve(true);

    if (flags.new_village) {
      createVillage().then(function (id) {
        $scope.data.village_id = id;
        village.resolve(true);
      });
    } else village.resolve(true);

    if (flags.new_province) {
      createProvince().then(function (id) {
        $scope.data.province_id = id;
        province.resolve(true);
      });
    } else province.resolve(true);

    if (flags.new_country) {
      createCountry().then(function (id) {
        $scope.data.country_id = id;
        country.resolve(true);
      });
    } else country.resolve(true);

    $q.all([
        country.promise,
        province.promise,
        sector.promise,
        village.promise
    ]).then(function () {
      console.log("All Promises Resolved");
      createLocation();
    });
  }

  function clear () {
    data = $scope.data = {};
    flags = $scope.flags = {};
  }

  $scope.add = add;
  $scope.formatVillage = formatVillage;
  $scope.formatSector = formatSector;
  $scope.formatProvince = formatProvince;
  $scope.formatCountry = formatCountry;
  $scope.format = format;
  $scope.select = select;
  $scope.submit = submit;
  $scope.clear = clear;

  init();

});
