angular.module('bhima.controllers')
.controller('stock.expiring', [
  '$scope',
  '$q',
  '$filter',
  'validate',
  'appstate',
  'connect',
  '$translate',
  '$routeParams',
  function ($scope, $q, $filter, validate, appstate, connect, $translate, $routeParams) {

    var dependencies = {},
        grid,
        columns,
        options,
        searchStr = '',
        dataview = $scope.dataview = new Slick.Data.DataView();

    var session = $scope.session = {};
    var configuration = $scope.configuration={};
    var flags = $scope.flags = {};

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
        {id: 'COLUMNS.TRACKING_NUMBER' , name: 'Numero Tracking' , field: 'tracking_number' , sortable: true, resizable: true} ,
        {id: 'COLUMNS.LOT_NUMBER'      , name: 'Numero Lot'      , field: 'lot_number'      , sortable: true},
        {id: 'COLUMNS.DESIGNATION'     , name: 'Designation'     , field: 'text'            , sortable: true},
        {id: 'COLUMNS.EXPIRATION_DATE' , name: 'Date Expiration' , field: 'expiration_date' , sortable: true},
        {id: 'COLUMNS.INITIAL_STOCK'   , name: 'Stock initial'   , field: 'initial'         , sortable: true},
        {id: 'COLUMNS.CURRENT_STOCK'   , name: 'Stock courant'   , field: 'current'         , sortable: true}
      ];

      // FIXME : this for some reason doesn't always work.

      $q.all(columns.map(function (col){
        return $translate(col.id);
      }))
      .then(function(values){
        columns.forEach(function (col, i){
          col.name = values[i];
        });

        options = {
          enableCellNavigation : true,
          forceFitColumns      : true
        };

        window.dataview = dataview;
        grid = new Slick.Grid('#bhima-expiring-grid', dataview, columns, options);
        grid.onSort.subscribe(sorter);


      });


      // set up sorting

      function sorter (e, args) {
        var field = args.sortCol.field;
        function sort (a, b) { return (a[field] > b[field]) ? 1 : -1; }
        dataview.sort(sort, args.sortAsc);
        grid.invalidate();
      }

      // set up filtering

      // function search (item, args) {
      //   if (item.searchStr !== '' && item.code.indexOf(args.searchStr) === -1 && item.text.indexOf(args.searchStr) === -1) {
      //     return false;
      //   }
      //   return true;
      // }

      // dataview.setFilter(search);
      // dataview.setFilterArgs({
      //   searchStr: searchStr
      // });

      // $scope.$watch('flags.search', function () {
      //   if (!flags.search) flags.search = '';
      //   searchStr = flags.search;
      //   dataview.setFilterArgs({
      //     searchStr: searchStr
      //   });
      //   dataview.refresh();
      // });
    }

    $scope.$watch('configuration', function () {
      if ($scope.configuration.list) {
        $scope.dataview.setItems($scope.configuration.list, 'tracking_number');
      }
    }, true);

    function getInfo(cle) {
      return $filter('date')(cle);
    }

    var groupDefinitions = $scope.groupDefinitions = [
      {
        key : 'COLUMNS.EXPIRATION_DATE',
        getter: 'expiration_date',
        formatter: function (g) {
          return '<span style=\'font-weight: bold\'>' +getInfo(g.value) + '</span> (' + g.count + ' members)</span>';
        },
        aggregators : []
      }
    ];

    //Utility method
    $scope.groupby = function groupby(groupDefinition) {
      console.log('notre groupe de definition', groupDefinition);
      var groupInstance = {};

      groupInstance = JSON.parse(JSON.stringify(groupDefinition));
      groupInstance.aggregateCollapsed = true;
      groupInstance.aggregators = [];

      groupDefinition.aggregators.forEach(function(aggregate) {
        groupInstance.aggregators.push(new Slick.Data.Aggregators.Sum(aggregate));
      });

      groupInstance.formatter = groupDefinition.formatter;
      dataview.setGrouping(groupInstance);
    };

    function groupExists(targetGroup, groupList) {
      return groupList.some(function(group) {
        return group.getter === targetGroup.getter;
      });
    }

    function init (){
      session.dateFrom = new Date();
      session.dateTo = new Date();
      formatDates();
      session.depot = $routeParams.depotId;
      $scope.configuration = getConfiguration();
      doSearching();
    }

    function formatDates () {
      session.dateFrom = $filter('date')(session.dateFrom, 'yyyy-MM-dd');
      session.dateTo = $filter('date')(session.dateTo, 'yyyy-MM-dd');
    }

    function getConfiguration (){
      return {
        depot_uuid : session.depot,
        df         : session.dateFrom,
        dt         : session.dateTo
      };
    }

    function doSearching (p){
      formatDates();
      if (p === 1) { $scope.configuration = getConfiguration(); }
      connect.fetch('expiring/'+$scope.configuration.depot_uuid+'/'+$scope.configuration.df+'/'+$scope.configuration.dt)
      .then(complete)
      .then(extendData)
      .then(buildGrid)
      .catch(function(err){
        console.log('keba !', err);
      });
    }

    function complete (models){
      window.model = models;
      $scope.uncompletedList = models;
      return $q.all(models.map(function (m){
        return connect.fetch('expiring_complete/'+m.tracking_number+'/'+$scope.configuration.depot_uuid);
      }));
    }

    function extendData (results){
      results.forEach(function (item, index){
        $scope.uncompletedList[index].consumed = item[0].consumed;
        if (!$scope.uncompletedList[index].consumed) {
          $scope.uncompletedList[index].consumed = 0;
        }
      });
      $scope.configuration.list = cleanList();
      console.log('on a ',$scope.configuration.list);
      $q.when();
    }

    function cleanList (){
      return $scope.uncompletedList.map(function (item){
        return {
          tracking_number : item.tracking_number,
          lot_number      : item.lot_number,
          text            : item.text,
          expiration_date : item.expiration_date,
          initial         : item.initial,
          current         : item.current
        };
      });
    }

    appstate.register('enterprise', function(enterprise){
      $scope.enterprise = enterprise;
      init();
    });

    $scope.doSearching = doSearching;
  }
]);
