angular.module('bhima.services')
.service('JournalDataviewService', ['JournalDataLoaderService',
  function (dataLoaderService) {    
    var inlineFilter = true;
    this.gimp = new Slick.Data.GroupItemMetadataProvider(); //plugin to group metadata for slick grid
    this.dataLoaderService = dataLoaderService;
    this.dataview = new Slick.Data.DataView({
      groupItemMetadataProvider: this.gimp,
      inlineFilter: inlineFilter
    });

    this.subscribeToOnRowCountChanged = function subscribeToOnRowCountChanged (grid){
      if(!grid){throw 'Undefined grid';}
      this.dataview.onRowCountChanged.subscribe(function (e, args) {
        grid.updateRowCount();
        grid.render();
      });      
    };

    this.subscribeToOnRowsChanged = function subscribeToOnRowsChanged (grid){
      if(!grid){throw 'Undefined grid';}
      this.dataview.onRowsChanged.subscribe(function (e, args) {
        grid.invalidateRows(args.rows);
        grid.render();
      });
    };

    this.populate = function populate () {
      return this.dataLoaderService.loadJournalRecord()
      .then(function (data){
        this.dataview.beginUpdate();
        this.dataview.setItems(data.journalRecord.data, 'uuid');
        this.dataview.endUpdate();   
      });      
    };

    this.addNewItem = function addNewItem(row){
      this.dataview.addItem(row);
    };

    this.getItem = function getItem(row){
      return this.dataview.getItem(row);
    };

    this.updateDataviewItem = function updateDataviewItem (id, item) {
      this.dataview.updateItem(id, item);
    };
  }
]);