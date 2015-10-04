angular.module('bhima.services')
.service('JournalDataLoaderService', ['$q', 'validate',
  function ($q, validate) {
    var dependencies = {};

    dependencies.journalRecord = {
      identifier : 'uuid',
      query : 'journal_list/'
    };

    dependencies.account = {
      query : {
        'identifier' : 'account_number',
        'tables' : {
          'account' : { 'columns' : ['id', 'account_number', 'account_type_id', 'account_txt'] }
        }
      }
    };

    dependencies.debtor = {
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

    dependencies.creditor = {
      query: {
        'tables' : {
          'creditor' : { 'columns' : ['uuid', 'text'] },
          'creditor_group' : { 'columns' : ['name'] },
          'account' : { 'columns' : ['account_number'] }
        },
        join: ['creditor.group_uuid=creditor_group.uuid','creditor_group.account_id=account.id']
      }
    };

    dependencies.invoice = {
      query: {
        identifier : 'uuid',
        tables : {
          sale : { columns : ['uuid', 'note'] }
        }
      }
    };

    dependencies.period = {
      query : {
        tables : {
          period : { columns : ['id', 'fiscal_year_id', 'period_stop', 'period_start'] }
        }
      }
    };

    dependencies.cost_center = {
      query : {
        tables : {
          'cost_center': {
            columns : ['id', 'text']
          }
        }
      }
    };

    dependencies.profit_center = {
      query : {
        tables : {
          'profit_center' : {
            columns : ['id', 'text']
          }
        }
      }
    };

    function loadAll (){
      return validate.process(dependencies);
    }

    function loadJournalRecord (){
      return validate.process(dependencies, ['journalRecord']);
    }

    function loadAdditionalData (){
      return validate.process(dependencies, ['debtor', 'creditor', 'invoice', 'period', 'cost_center', 'profit_center'  ]);
    }

    return {
      loadAll : loadAll,
      loadJournalRecord : loadJournalRecord,
      loadAdditionalData : loadAdditionalData
    };
  }
]);
