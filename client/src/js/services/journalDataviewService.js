angular.module('bhima.services')
.service('JournalDataviewService', ['JournalDataLoaderService',
  function (dataLoaderService) {
    var dataviewService = this;    
    var inlineFilter = true;
    dataviewService.gimp = new Slick.Data.GroupItemMetadataProvider(); //plugin to group metadata for slick grid
    dataviewService.dataLoaderService = dataLoaderService;
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
  }
]);