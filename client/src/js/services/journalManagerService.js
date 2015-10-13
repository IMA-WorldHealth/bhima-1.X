angular.module('bhima.services')
.service('JournalManagerService', ['store', 
  function (Store) {
    var managerService  = this, 
      deleteColumn = {
        id        : 'deleteRecord',
        field     : 'delete',
        formatter : btnFormatter,
        width: 10
      };

    managerService.manager = { session : { selection : [], records : new Store({ data : [], identifier: 'uuid'}), removed : new Store({ data : [], identifier: 'uuid'})}, mode : {} };

    managerService.setRowId = function setRowId(row){
      managerService.manager.session.rowId = row;
    }; 

    managerService.setMode = function setMode (mode){
      managerService.manager.session.mode = mode;
    };

    managerService.getMode = function getMode (){
      return managerService.manager.session.mode;
    };

    managerService.setSessionTransactionId = function setSessionTransactionId(id){
       managerService.manager.session.transactionId = id;
    };

    managerService.getSessionTransactionId = function getSessionTransactionId (){
      return managerService.manager.session.transactionId;
    };    

    managerService.getSession = function getSession (){
      return managerService.manager.session;
    };

    managerService.isAuthenticated = function isAuthenticated(){
      return managerService.manager.session.authenticated;
    };

    managerService.setAuthenticated = function setAuthenticated (ans){
      managerService.manager.session.authenticated = ans;
    };

    managerService.setUuid = function setUuid (uuid){
      managerService.manager.session.uuid = uuid;
    };

    managerService.setStartTime = function setStartTime (startTime){
      managerService.manager.session.start = startTime;
    };

    managerService.setJustification = function setJustification (justification){
      managerService.manager.session.justification = justification;
    };

    managerService.getManager = function getManager (){
      return managerService.manager;
    };  

    managerService.showDeleteButton = function showDeleteButton (grid) {
      var columns = grid.getColumns();
      var hasDeleteButton = columns.some(function (col) { return col.id === 'deleteRecord'; });
      if (hasDeleteButton) { return; }
      columns.push(deleteColumn);
      grid.setColumns(columns);
    }; 

    managerService.setSessionTemplate = function setSessionTemplate (template){
      managerService.manager.session.template = template;
    };

    managerService.postRecord = function postRecord (row){
      managerService.manager.session.records.post(row);
    };

    managerService.postRemovable = function postRemovable (row){
      managerService.manager.session.removed.post(row);
    };

    managerService.removeRecord = function removeRecord (uuid){
      managerService.manager.session.records.remove(uuid);
    };

    managerService.getRecordLength = function getRecordLength (){
      return managerService.manager.session.records.data.length;
    };

    function btnFormatter (row,cell,value,columnDef,dataContext) {
      var id = dataContext.trans_id;
      if (managerService.getSessionTransactionId() === id) {
        return '<div class="deleteRow" style="cursor: pointer;"><span class="glyphicon glyphicon-trash deleteRow"></span></div>';
      }
      return '';
    }
  }
]);
