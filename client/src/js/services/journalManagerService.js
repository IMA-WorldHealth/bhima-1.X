angular.module('bhima.services')
.service('JournalManagerService', [ 
  function () {
    var managerService  = this;


    managerService.manager = { session : { selection : [] }, mode : {} };

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

    // manager.session.authenticated

    //manager.session.records.post(row);  

  }
]);
