angular.module('bhima.services')
.service('JournalManagerService', [
  function () {
    this.manager = { session : { selection : [] }, mode : {} };

    this.setRowId = function setRowId(row){
      this.manager.session.rowId = row;
    }; 

    this.setMode = function setMode (mode){
      this.manager.session.mode = mode;
    };

    this.setTransactionId = function setTransactionId(id){
       this.manager.session.transactionId = id;
    };

    

   
    //manager.session.records.post(row);  

  }
]);
