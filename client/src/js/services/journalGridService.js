angular.module('bhima.services')
.service('JournalGridService', ['JournalDataviewService',
  function (journalDataviewService) {

    var options = {
        enableCellNavigation: true,
        enableColumnReorder: true,
        forceFitColumns: true,
        editable: true,
        rowHeight: 30,
        autoEdit: false
    };

    function create (idDom, dv, cols, opt){
      var grid = new Slick.Grid(idDom, dv, cols, opt || options);
      grid.setSelectionModel(new Slick.RowSelectionModel({selectActiveRow: false}));
      return grid;
    }

    function setPlugin(plg, grid){
      grid.registerPlugin(plg);
    }

    function subscribe (grid, dv){
      grid.onCellChange.subscribe(function(e, args) {
        var id = args.item.id || args.item.uuid;
        journalDataviewService.updateDataviewItem(dv, id, args.item);
      });
    }       

    return {
      create : create
    };
  }
]);