angular.module('bhima.services')
.service('JournalDataviewService', ['JournalDataLoaderService',
  function (dataLoaderService) {

    function create (gimp, inlineFilter){
      //gimp as groupItemMetadataProvider
      var dataview;

      dataview = new Slick.Data.DataView({
        groupItemMetadataProvider: gimp,
        inlineFilter: inlineFilter
      });

      return dataview;
    }

    function subscribe (dv, grid){
      //dv as dataview

      dv.onRowCountChanged.subscribe(function (e, args) {
        grid.updateRowCount();
        grid.render();
      });

      dv.onRowsChanged.subscribe(function (e, args) {
        grid.invalidateRows(args.rows);
        grid.render();
      });

      return dv;
    }

    function populate (dv) {
      return dataLoaderService.loadJournalRecord()
      .then(function (data){
        dv.beginUpdate();
        dv.setItems(data.journalRecord.data, 'uuid');
        dv.endUpdate();   
      });      
    }

    // function updateDataviewItem (dv, id, item) {
    //   dv.updateItem(id, item);
    // }

    return {
      create : create,
      subscribe : subscribe,
      populate : populate
      // ,
      // updateDataviewItem : updateDataviewItem         
    };
  }
]);