angular.module('kpk.controllers')
.controller('inventoryView', [
  '$scope',
  '$q',
  '$filter',
  'appstate',
  'connect',
  function ($scope, $q, $filter, appstate, connect) {
    // This module provides a view into the inventory to see all registered items.
    // We display these with a slick grid to allow sorting and arbitrary
    // grouping without too much further issue.

    'use strict';

    var imports = {},
        models = $scope.models = {},
        flags = $scope.flags = {},
        groupby = $scope.groupby = {},
        stores = {};

    // FIXME: change this.
    imports.enterprise_id = appstate.get('enterprise').id;

    // FIXME: Cannot do a join with inv_unit because inventory.text and inv_unit.text clash.
    // propose rename inventory.text -> inventory.label
    imports.inventory = {
      tables : {
        'inventory' : {
          columns: ['id', 'code', 'text', 'price', 'unit_id', 'unit_weight', 'unit_volume', 'stock', 'type_id', 'consumable']
        },
        'inv_group' : {
          columns : ['name']
        }
      },
      join: ['inventory.group_id=inv_group.id'],
      where : ['inventory.enterprise_id='+imports.enterprise_id]
    };

    imports.inv_unit = {tables : { 'inv_unit': { columns : ['id', 'text' ]}}};
    imports.inv_type = {tables : { 'inv_type': { columns : ['id', 'text' ]}}};

    var dependencies = ['inventory', 'inv_unit', 'inv_type'];

    function initialize (array) {
      for (var i = 0; i < dependencies.length; i+= 1) {
        stores[dependencies[i]] = array[i];
        models[dependencies[i]] = array[i].data;
      }

      var grid,
          columns,
          options,
          searchStr = "",
          dataview = $scope.dataview = new Slick.Data.DataView();

      dataview.onRowCountChanged.subscribe(function (e, args) {
        grid.updateRowCount();
        grid.render();
      });

      dataview.onRowsChanged.subscribe(function (e, args) {
        grid.invalidate(args.rows);
        grid.render();
      });

      columns = [
        {id: "code"        , name: "Code"               , field: "code"        , sortable: true} ,
        {id: "text"        , name: "Text"               , field: "text"        , sortable: true} ,
        {id: "stock"       , name: "Stock Count"        , field: "stock"       , sortable: true} ,
        {id: "group"       , name: "Inv. Group"         , field: "name"        , sortable: true} ,
        {id: "type_id"     , name: "Type"               , field: "type_id"     , sortable: true  , formatter: formatType},
        {id: "unit_id"     , name: "Unit"               , field: "unit_id"     , sortable: true  , formatter: formatUnit},
        {id: "unit_weight" , name: "Unit Weight"        , field: "unit_weight" , sortable: true} ,
        {id: "unit_volume" , name: "Unit Volume"        , field: "unit_volume" , sortable: true} ,
        {id: "consumable"  , name: "Consumable/Durable" , field: "consumble"   , sortable: true  , formatter: formatConsumable},
        {id: "price"       , name: "Base Price"         , field: "price"       , sortable: true  , formatter: formatCurrency}
      ];

      options = {
        enableCellNavigation : true,
        forceFitColumns      : true
      };

      grid = new Slick.Grid("#kpk-inventory-grid", dataview, columns, options);
      grid.setSelectionModel(new Slick.RowSelectionModel());
    
      // set up sorting

      function sorter (e, args) {
        var field = args.sortCol.field;
        function sort (a, b) { return (a[field] > b[field]) ? 1 : -1; }
        dataview.sort(sort, args.sortAsc);
        grid.invalidate();
      }

      grid.onSort.subscribe(sorter);

      // set up filtering
    
      function search (item, args) {
        if (item.searchStr !== "" && item.code.indexOf(args.searchStr) === -1 && item.text.indexOf(args.searchStr) === -1) {
          return false;
        }
        return true;
      }

      dataview.setFilter(search);
      dataview.setFilterArgs({
        searchStr: searchStr
      });

      $scope.$watch('flags.search', function () {
        if (!flags.search) flags.search = "";
        searchStr = flags.search;
        dataview.setFilterArgs({
          searchStr: searchStr
        });
        dataview.refresh();
      });

    }

    $scope.$watch('models.inventory', function () {
      if ($scope.dataview) $scope.dataview.setItems($scope.models.inventory);
    }, true);



    function formatCurrency (row, col, item) {
      return $filter('currency')(item);
    }

    function formatUnit (row, col, item) {
      return stores.inv_unit ? stores.inv_unit.get(item).text : item;
    }

    function formatType (row, col, item) {
      return stores.inv_type ? stores.inv_type.get(item).text : item;
    }

    function formatConsumable (row, col, item) {
      return item === 1 ? "Consumable" : "Durable";
    }

    groupby.type = function () {
      $scope.dataview.setGrouping({
        getter: "type_id",
        formatter: function (g) {
          return "<span style='font-weight: bold'>" + stores.inv_type.get(g.value).text + "</span> (" + g.count + " members)</span>";
        }
      });
    };

    groupby.group = function () {
      $scope.dataview.setGrouping({
        getter: "name",
        formatter: function (g) {
          return "<span style='font-weight: bold'>" + g.value + "</span> (" + g.count + " members)</span>";
        }
      });
    };
  
    groupby.unit = function () {
      $scope.dataview.setGrouping({
        getter: "unit_id",
        formatter: function (g) {
          return "<span style='font-weight: bold'>" + stores.inv_unit.get(g.value).text + "</span> (" + g.count + " members)</span>";
        }
      });
    };

    groupby.consumable = function () {
      $scope.dataview.setGrouping({
        getter: "consumable",
        formatter: function (g) {
          return "<span style='font-weight: bold'>" + formatConsumable(null, null, g.value) + "</span> (" + g.count + " members)</span>";
        }
      });
    };

    groupby.price = function () {
      $scope.dataview.setGrouping({
        getter: "price",
        formatter: function (g) {
          return "<span style='font-weight: bold'>" + formatCurrency(null, null, g.value) + "</span> (" + g.count + " members)</span>";
        }
      });
    };

    // init
    $q.all([
      connect.req(imports.inventory),
      connect.req(imports.inv_unit),
      connect.req(imports.inv_type)
    ]).then(initialize);

  }
]);
