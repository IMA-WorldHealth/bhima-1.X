angular.module('bhima.services')
.service('JournalDataLoaderService', ['$q', 'validate',
  function ($q, validate) {
    this.dependencies = {};
    this.dependencies.journalRecord = {
      identifier : 'uuid',
      query : 'journal_list/'
    };

    this.dependencies.account = {
      query : {
        'identifier' : 'account_number',
        'tables' : {
          'account' : { 'columns' : ['id', 'account_number', 'account_type_id', 'account_txt'] }
        }
      }
    };

    this.dependencies.debtor = {
      query: {
        identifier : 'uuid',
        'tables' : {
          'debitor' : { 'columns' : ['uuid'] },
          'patient' : { 'columns' : ['first_name', 'last_name'] },
          'debitor_group' : { 'columns' : ['name'] },
          'account' : { 'columns' : ['account_number'] }
        },
        join: ['debitor.uuid=patient.debitor_uuid', 'debitor_group.uuid=debitor.group_uuid', 'debitor_group.account_id=account.id']
      }
    };

    this.dependencies.creditor = {
      query: {
        'tables' : {
          'creditor' : { 'columns' : ['uuid', 'text'] },
          'creditor_group' : { 'columns' : ['name'] },
          'account' : { 'columns' : ['account_number'] }
        },
        join: ['creditor.group_uuid=creditor_group.uuid','creditor_group.account_id=account.id']
      }
    };

    this.dependencies.invoice = {
      query: {
        identifier : 'uuid',
        tables : {
          sale : { columns : ['uuid', 'note'] }
        }
      }
    };

    this.dependencies.period = {
      query : {
        tables : {
          period : { columns : ['id', 'fiscal_year_id', 'period_stop', 'period_start'] }
        }
      }
    };

    this.dependencies.cost_center = {
      query : {
        tables : {
          'cost_center': {
            columns : ['id', 'text']
          }
        }
      }
    };

    this.dependencies.profit_center = {
      query : {
        tables : {
          'profit_center' : {
            columns : ['id', 'text']
          }
        }
      }
    };

    this.loadAll = function loadAll (){
      return validate.process(this.dependencies);
    };

    this.loadJournalRecord = function loadJournalRecord (){
      return validate.process(this.dependencies, ['journalRecord']);
    };

    this.loadAdditionalData = function loadAdditionalData (){
      return validate.process(this.dependencies, ['debtor', 'creditor', 'invoice', 'period', 'cost_center', 'profit_center']);
    };

    this.loadAccountData = function loadAccountData(){
      return validate.process(this.dependencies, ['account']);
    };
  }
]);
