angular.module('bhima.controllers')
.controller('journal.grid', [
  '$scope',
  '$translate',
  '$filter',
  '$q',
  'precision',
  'validate',
  'appstate',
  function ($scope, $translate, $filter, $q, precision, validate, appstate) {
    /* jshint unused : false */
    var dependencies = {}, ready = $q.defer();
    var columns, options, dataview, grid,
        manager = { session : {}, fn : {}, mode : {} };

    appstate.set('journal.ready', ready.promise);

    dependencies.journal = {
      query : {
        identifier : 'uuid',
        tables : {
          'posting_journal' : {
            'columns' : ['uuid', 'fiscal_year_id', 'period_id', 'trans_id', 'trans_date', 'doc_num', 'description', 'account_id', 'debit', 'credit', 'currency_id', 'deb_cred_uuid', 'deb_cred_type', 'inv_po_id', 'debit_equiv', 'credit_equiv', 'currency_id', 'comment', 'user_id']
          },
          'account' : { 'columns' : ['account_number'] }
        },
        join: ['posting_journal.account_id=account.id']
      }
    };

    function initialise (models) {
      angular.extend($scope, models);

      // set up grid properties
      columns = [
        {id: 'uuid'          , name: $translate.instant('COLUMNS.ID')             , field: 'uuid'           , sortable : true },
        {id: 'fiscal_year_id', name: $translate.instant('COLUMNS.FISCAL_YEAR_ID') , field: 'fiscal_year_id' , sortable: true },
        {id: 'period_id'     , name: $translate.instant('COLUMNS.PERIOD_ID')      , field: 'period_id'      , sortable: true },
        {id: 'trans_id'      , name: $translate.instant('COLUMNS.TRANS_ID')       , field: 'trans_id'       , sortable: true },
        {id: 'trans_date'    , name: $translate.instant('COLUMNS.DATE')           , field: 'trans_date'     , formatter : formatDate, sortable: true},
        {id: 'description'   , name: $translate.instant('COLUMNS.DESCRIPTION')    , field: 'description'    , width: 110 , editor: Slick.Editors.Text},
        {id: 'account_id'    , name: $translate.instant('COLUMNS.ACCOUNT_NUMBER') , field: 'account_number' , sortable: true },
        {id: 'debit_equiv'   , name: $translate.instant('COLUMNS.DEB_EQUIV')      , field: 'debit_equiv'    , groupTotalsFormatter: totalFormat , sortable: true, maxWidth: 100, editor:Slick.Editors.Text},
        {id: 'credit_equiv'  , name: $translate.instant('COLUMNS.CRE_EQUIV')      , field: 'credit_equiv'   , groupTotalsFormatter: totalFormat , sortable: true, maxWidth: 100, editor:Slick.Editors.Text},
        {id: 'deb_cred_uuid' , name: 'AR/AP Account'                      , field: 'deb_cred_uuid'},
        {id: 'deb_cred_type' , name: $translate.instant('COLUMNS.DC_TYPE')        , field: 'deb_cred_type'},
        {id: 'inv_po_id'     , name: $translate.instant('COLUMNS.INVPO_ID')       , field: 'inv_po_id'},
        {id: 'comment'       , name: $translate.instant('COLUMNS.COMMENT')        , field: 'comment', sortable : true, editor: Slick.Editors.Text}
      ];

      options = {
        enableCellNavigation: true,
        enableColumnReorder: true,
        forceFitColumns: true,
        editable: true,
        rowHeight: 30,
        autoEdit: false
      };

      populate();
    }

    function formatDate (row, col, val) {
      return $filter('date')(val);
    }

    function populate () {
      var groupItemMetadataProvider = new Slick.Data.GroupItemMetadataProvider();

      dataview = new Slick.Data.DataView({
        groupItemMetadataProvider: groupItemMetadataProvider,
        inlineFilter: true
      });

      grid = new Slick.Grid('#journal_grid', dataview, columns, options);

      grid.registerPlugin(groupItemMetadataProvider);
      grid.setSelectionModel(new Slick.RowSelectionModel({selectActiveRow: false}));

      // grid.setSelectionModel(new Slick.CellSelectionModel());

      dataview.onRowCountChanged.subscribe(function (e, args) {
        grid.updateRowCount();
        grid.render();
      });

      dataview.onRowsChanged.subscribe(function (e, args) {
        grid.invalidateRows(args.rows);
        grid.render();
      });

      grid.onCellChange.subscribe(function(e, args) {
        dataview.updateItem(args.item.id, args.item);
      });

      dataview.beginUpdate();
      dataview.setItems($scope.journal.data, 'uuid');
      dataview.endUpdate();

      expose();
    }

    function expose () {
      ready.resolve([grid, columns, dataview, options, manager]);
    }

    function totalFormat(totals, column) {
      var fmt = {
        'credit'       : '#F70303',
        'debit'        : '#02BD02',
        'debit_equiv'  : '#F70303',
        'credit_equiv' : '#02BD02'
      };

      var val = totals.sum && totals.sum[column.field];
      if (val !== null) {
        return '<span style="font-weight: bold; color:' + fmt[column.id] + ';">' + $filter('currency')(precision.round(val)) + '</span>';
      }
      return '';
    }

    validate.process(dependencies)
    .then(initialise)
    .catch(function (error) {
      ready.reject(error);
    });
  }
]);
