angular.module('kpk.controllers')
.controller('inventoryView', [
  '$scope',
  '$q',
  '$filter',
  'validate',
  'appstate',
  'connect',
  '$translate',
  function ($scope, $q, $filter, validate, appstate, connect, $translate) {
    // This module provides a view into the inventory to see all registered items.
    // We display these with a slick grid to allow sorting and arbitrary
    // grouping without too much further issue.

    var dependencies = {},
        grid,
        columns,
        options,
        searchStr = "",
        dataview = $scope.dataview = new Slick.Data.DataView(),
        groupDefinitions = $scope.groupDefinitions = [],
        groups = [];

    // FIXME: Cannot do a join with inv_unit because inventory.text and inv_unit.text clash.
    // propose rename inventory.text -> inventory.label

    dependencies.inventory = {
      query : {
        tables : {
          'inventory' : {
            columns: ['id', 'code', 'text', 'price', 'unit_id', 'unit_weight', 'unit_volume', 'stock', 'type_id', 'consumable']
          },
          'inv_group' : {
            columns : ['name']
          }
        },
        join: ['inventory.group_id=inv_group.id'],
      }
    };

    dependencies.inventory_unit = {
      query : {
        tables : {
          'inv_unit': {
            columns : ['id', 'text' ]
          }
        }
      }
    };

    dependencies.inventory_type = {
      query : {
        tables : {
          'inv_type': {
            columns : ['id', 'text' ]
          }
        }
      }
    };

    var flags = $scope.flags = {},
        groupby = $scope.groupby = {};

    appstate.register('enterprise', function (enterprise) {
      $scope.enterprise = enterprise;
      dependencies.inventory.query.where =
        ['inventory.enterprise_id=' + enterprise.id]
      validate.process(dependencies).then(buildStores);
    });

    function buildStores(models) {
      for (var k in models) { $scope[k] = models[k]; }
      buildGrid();
    }


    function buildGrid() {

      dataview.onRowCountChanged.subscribe(function (e, args) {
        grid.updateRowCount();
        grid.render();
      });

      dataview.onRowsChanged.subscribe(function (e, args) {
        grid.invalidate(args.rows);
        grid.render();
      });

      columns = [
        {id: "COLUMNS.CODE"        , name: "Code"               , field: "code"        , sortable: true} ,
        {id: "COLUMNS.TEXT"        , name: "Text"               , field: "text"        , sortable: true} ,
        {id: "COLUMNS.STOCK"       , name: "Stock Count"        , field: "stock"       , sortable: true} ,
        {id: "COLUMNS.GROUP"       , name: "Inv. Group"         , field: "name"        , sortable: true} ,
        {id: "COLUMNS.TYPE"        , name: "Type"               , field: "type_id"     , sortable: true  , formatter: formatType},
        {id: "COLUMNS.UNIT"        , name: "Unit"               , field: "unit_id"     , sortable: true  , formatter: formatUnit},
        {id: "COLUMNS.WEIGHT"      , name: "Unit Weight"        , field: "unit_weight" , sortable: true} ,
        {id: "COLUMNS.VOLUME"      , name: "Unit Volume"        , field: "unit_volume" , sortable: true} ,
        {id: "COLUMNS.CONSUMABLE"  , name: "Consumable/Durable" , field: "consumble"   , sortable: true  , formatter: formatConsumable},
        {id: "COLUMNS.PRICE"       , name: "Base Price"         , field: "price"       , sortable: true  , formatter: formatCurrency}
      ];

      // FIXME : this for some reason doesn't always work.
      columns.forEach(function (col) {
        col.name = $translate(col.id);
      });

      $scope.$on('$translateChangeSuccess', function () {
        columns.forEach(function (col) {
          col.name = $translate(col.id);
        });
      });
    
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

    $scope.$watch('inventory.data', function () {
      if ($scope.dataview && $scope.inventory) $scope.dataview.setItems($scope.inventory.data);
    }, true);

    function formatCurrency (row, col, item) {
      return $filter('currency')(item);
    }

    function formatUnit (row, col, item) {
      return $scope.inventory_unit ? $scope.inventory_unit.get(item).text : item;
    }

    function formatType (row, col, item) {
      return $scope.inventory_type ? $scope.inventory_type.get(item).text : item;
    }

    function formatConsumable (row, col, item) {
      return item === 1 ? "Consumable" : "Durable";
    }


    groupDefinitions = [
      {
        key : 'COLUMNS.TYPE',
        getter: "type_id",
        formatter: function (g) {
          return "<span style='font-weight: bold'>" + $scope.inventory_type.get(g.value).text + "</span> (" + g.count + " members)</span>";
        },
        aggregators : []
      },
      {
        key : 'COLUMNS.NAME',
        getter: "name",
        formatter: function (g) {
          return "<span style='font-weight: bold'>" + g.value + "</span> (" + g.count + " members)</span>";
        },
        aggregators : []
      },
      {
        key : 'COLUMNS.UNIT',
        getter: "unit_id",
        formatter: function (g) {
          return "<span style='font-weight: bold'>" + $scope.inventory_unit.get(g.value).text + "</span> (" + g.count + " members)</span>";
        },
        aggregators : []
      },
      {
        key : 'COLUMNS.CONSUMABLE',
        getter: "consumable",
        formatter: function (g) {
          return "<span style='font-weight: bold'>" + formatConsumable(null, null, g.value) + "</span> (" + g.count + " members)</span>";
        },
        aggregators : []
      },
      {
        key : 'COLUMNS.PRICE',
        getter: "price",
        formatter: function (g) {
          return "<span style='font-weight: bold'>" + formatCurrency(null, null, g.value) + "</span> (" + g.count + " members)</span>";
        },
        aggregators : []
      }
    ];

    //Utility method
    function groupby(groupDefinition) {
      var groupInstance = {};
      if(groupExists(groupDefinition, groups)) return;
    
      groupInstance = JSON.parse(JSON.stringify(groupDefinition));
      groupInstance.aggregateCollapsed = true;
      groupInstance.aggregators = [];
   
      groupDefinition.aggregators.forEach(function(aggregate) {
        groupInstance.aggregators.push(new Slick.Data.Aggregators.Sum(aggregate));
      });
    
      groupInstance.formatter = groupDefinition.formatter;
      groups.push(groupInstance);
      dataview.setGrouping(groups);
    }

    function groupExists(targetGroup, groupList) {
      return groupList.some(function(group) {
        return group.getter === targetGroup.getter;
      });
    }

  }
]);
