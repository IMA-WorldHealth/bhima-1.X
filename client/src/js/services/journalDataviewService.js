angular.module('bhima.services')
.service('JournalDataviewService', ['JournalDataLoaderService', 'JournalManagerService', '$translate',
  function (dataLoaderService, managerService, $translate) {
    var dataviewService = this;
    var inlineFilter = true;

    dataviewService.aggregates = true;    
    dataviewService.gimp = new Slick.Data.GroupItemMetadataProvider(); //plugin to group metadata for slick grid
    dataviewService.dataLoaderService = dataLoaderService;
    dataviewService.managerService = managerService;
    dataviewService.dataview = new Slick.Data.DataView({
      groupItemMetadataProvider: dataviewService.gimp,
      inlineFilter: inlineFilter
    });


    dataviewService.subscribeToOnRowCountChanged = function subscribeToOnRowCountChanged (grid){
      if(!grid){throw 'Undefined grid';}
      dataviewService.dataview.onRowCountChanged.subscribe(function (e, args) {
        grid.updateRowCount();
        grid.render();
      });      
    };

    dataviewService.subscribeToOnRowsChanged = function subscribeToOnRowsChanged (grid){
      if(!grid){throw 'Undefined grid';}
      dataviewService.dataview.onRowsChanged.subscribe(function (e, args) {
        grid.invalidateRows(args.rows);
        grid.render();
      });
    };

    dataviewService.populate = function populate () {
      return dataviewService.dataLoaderService.loadJournalRecord()
      .then(function (data){
        dataviewService.dataview.beginUpdate();
        dataviewService.dataview.setItems(data.journalRecord.data, 'uuid');
        dataviewService.dataview.endUpdate();   
      });      
    };

    dataviewService.addNewItem = function addNewItem(row){
      dataviewService.dataview.addItem(row);
    };

    dataviewService.getItem = function getItem(row){
      return dataviewService.dataview.getItem(row);
    };

    dataviewService.getItems = function getItem(){
      return dataviewService.dataview.getItems();
    };

    dataviewService.updateDataviewItem = function updateDataviewItem (id, item) {
      dataviewService.dataview.updateItem(id, item);
    };

    dataviewService.hasData = function hasData (){
      return dataviewService.dataview.getItems().length > 0;
    };

    dataviewService.setGrouping = function setGrouping (g){
      dataviewService.grouping = g;
    };

    dataviewService.getGrouping = function getGrouping (){
      return dataviewService.grouping;
    };

    dataviewService.groupBy = function groupBy(targetGroup) {

      dataviewService.setGrouping(targetGroup);

      function groupByTransaction() {
        dataviewService.dataview.setGrouping({
          getter: 'trans_id',
          formatter: formatTransactionGroup,
          comparer : function (a, b) {
            var x =  parseFloat(a.groupingKey.substr(3));
            var y =  parseFloat(b.groupingKey.substr(3));
            return x > y ? 1 : -1;
          },
          aggregators: [
            new Slick.Data.Aggregators.Sum('debit'),
            new Slick.Data.Aggregators.Sum('credit'),
            new Slick.Data.Aggregators.Sum('debit_equiv'),
            new Slick.Data.Aggregators.Sum('credit_equiv')
          ],
          aggregateCollapsed: dataviewService.aggregates,
          lazyTotalsCalculation : true
        });
      }

      function groupByAccount () {
        dataviewService.dataview.setGrouping({
          getter: 'account_id',
          formatter: function(g) {
            var account_txt;
            if (dataviewService.dataLoaderService.getAccountStore() && g.rows[0].account_number) {account_txt = dataviewService.dataLoaderService.getAccountStore().get(g.rows[0].account_number).account_txt || '';}            
            return '<span style="font-weight: bold">' + (dataviewService.dataLoaderService.getAccountStore()? account_txt : g.value) + '</span>';
          },
          aggregators: [
            new Slick.Data.Aggregators.Sum('debit'),
            new Slick.Data.Aggregators.Sum('credit'),
            new Slick.Data.Aggregators.Sum('debit_equiv'),
            new Slick.Data.Aggregators.Sum('credit_equiv')
          ],
          lazyTotalsCalculation : true,
          aggregateCollapsed: dataviewService.aggregates
        });
      }

      function unGroup () {
        dataviewService.dataview.setGrouping({});
      }

      var groupMap = {
        'transaction' : groupByTransaction,
        'account' : groupByAccount,
        'ungroup' : unGroup
      };

      if (groupMap[targetGroup]) { groupMap[targetGroup](); }
    };

    dataviewService.setFilter = function setFilter(filter, param){ 
      if(!filter) {throw 'filter function undefined';}
      dataviewService.dataview.beginUpdate();
      dataviewService.dataview.setFilter(filter);
      dataviewService.dataview.setFilterArgs({
        param : param
      });
      dataviewService.dataview.endUpdate();
    };

    dataviewService.refreshDataviewFilter = function refreshDataviewFilter (){     
    
      dataviewService.dataview.setFilterArgs({
        param : '',
        re    : new RegExp('', 'i')
      });
      dataviewService.dataview.refresh();
    };

    dataviewService.updateFilter = function updateFilter (param){
      dataviewService.dataview.setFilterArgs({
        param : param,
        re    : new RegExp(param, 'i') // 'i' for ignore case
      });
      dataviewService.dataview.refresh();
    };

    function formatTransactionGroup(g) {
      var rowMarkup, editTemplate = '';

      var correctRow = g.rows.every(function (row) {
        return row.trans_id === dataviewService.managerService.getSessionTransactionId();
      });

      if (dataviewService.managerService.getMode() === 'lock') {
        editTemplate = '<div class="pull-right"><a class="editTransaction" style="color: white; cursor: pointer;"><span class="glyphicon glyphicon-pencil"></span> ' + $translate.instant('POSTING_JOURNAL.EDIT_TRANSACTION') + ' </a></div>';
      }

      if (dataviewService.managerService.getMode() === 'edit' && correctRow) {
        rowMarkup =
          '<span style="color: white;">' +
          '  <span style="color: white;" class="glyphicon glyphicon-warning-sign"> </span> ' +
          $translate.instant('POSTING_JOURNAL.LIVE_TRANSACTION') + ' <strong>'  + g.value + '</strong> (' + g.count + ' records)' +
          '</span> ' +

          '<span class="pull-right">' +
          //'  <a class='addRow' style='color: white; cursor: pointer;'> <span class='glyphicon glyphicon-plus'></span>  ' + $translate('POSTING_JOURNAL.ADD_ROW') + '</a>' +
          '  <a class="addRow" style="color: white; cursor: pointer;"> <span class="glyphicon glyphicon-plus addRow"></span>  ' + '</a>' +
          '  <span style="padding: 5px;"></span>' + // FIXME Hacked spacing;
          //'  <a class='saveTransaction' style='color: white; cursor: pointer;'> <span class='glyphicon glyphicon-floppy-disk'></span>  ' + $translate('POSTING_JOURNAL.SAVE_TRANSACTION') + '</a>' +
          '  <a class="save" style="color: white; cursor: pointer;"> <span class="glyphicon glyphicon-floppy-disk saveTransaction"></span>  ' + '</a>' +
          '  <span style="padding: 5px;"></span>' + // FIXME Hacked spacing;
          '  <a class="save" style="color: white; cursor: pointer;"> <span class="glyphicon glyphicon-trash deleteTransaction"></span>  </a>' +
          //'  <a class='deleteTransaction' style='color: white; cursor: pointer;'> <span class='glyphicon glyphicon-trash'></span>  ' + $translate('POSTING_JOURNAL.DELETE_TRANSACTION') + '</a>' +
          '</span>';
        return rowMarkup;
      }

      rowMarkup = '<span style="font-weight: bold">' + g.value + '</span> (' + g.count + ' records)</span>';
      rowMarkup += editTemplate;
      return rowMarkup;
    }
  }
]);