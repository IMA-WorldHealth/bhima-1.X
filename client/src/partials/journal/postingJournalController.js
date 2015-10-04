var PostingJournalController = function ($translate, $filter, $q, precision, sessionService, journalDataviewService, journalColumnsService, journalGridService) {
  var vm = this;
  var columns, options, dataview, grid, manager; //declaring Slickgrid component
  var sortColumn;  //Array for sorting columns
  var journalError =  liberror.namespace('JOURNAL'); //declaring a variable to handle error  
  var groupItemMetadataProvider = new Slick.Data.GroupItemMetadataProvider(); //plugin to group metadata for slick grid
  var manager = { session : { selection : [] }, mode : {} };

  function isNull (t) { return t === null; }
  function doParsing (o) { return JSON.parse(JSON.stringify(o)); }
  function isDefined (d) { return angular.isDefined(d); }

  vm.editing = false;
  vm.project = sessionService.project;

  //getting slick grid component from services

  dataview = journalDataviewService.create(groupItemMetadataProvider, true);
  columns = journalColumnsService.getColumns;
  grid = journalGridService.create('#journal_grid', dataview, columns)
  
 
  



};

PostingJournalController.$inject = ['$translate', '$filter', '$q', 'precision', 'SessionService', 'JournalDataviewService', 'JournalColumnsService', 'JournalGridService'];
angular.module('bhima.controllers').controller('PostingJournalController', PostingJournalController);












