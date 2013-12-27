angular.module('kpk.controllers')
.controller('locationCtrl', function ($scope, $q, connect) {
  'use strict';

  var imports = {};

  imports.province = {tables: { 'province' : { columns : ['id', 'name']}}};
  imports.sector = {tables: { 'sector' : { columns : ['id', 'name']}}};
  imports.village = {tables: { 'village' : { columns : ['id', 'name']}}};
  imports.country = {tables: { 'country' : { columns : ['id', 'country_en']}}};

  function init () {
    $q.all([
      connect.req(imports.province),
      connect.req(imports.sector),
      connect.req(imports.village),
      connect.req(imports.country)
    ]).then(function (array) {
      // ..
    });
  }
    
});
