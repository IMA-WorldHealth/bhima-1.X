angular.module('bhima.services')
.service('JournalColumnsService', ['$translate', '$filter', 'precision',
  function ($translate, $filter, precision) {

    function getColumns (){
      var columns = [
        {id: 'uuid'           , name: $translate.instant('COLUMNS.ID')             , field: 'uuid'           , sortable: true },
        {id: 'fiscal_year_id' , name: $translate.instant('COLUMNS.FISCAL_YEAR_ID') , field: 'fiscal_year_id' , sortable: true },
        {id: 'period_id'      , name: $translate.instant('COLUMNS.PERIOD_ID')      , field: 'period_id'      , sortable: true },
        {id: 'trans_id'       , name: $translate.instant('COLUMNS.TRANS_ID')       , field: 'trans_id'       , sortable: true },
        {id: 'trans_date'     , name: $translate.instant('COLUMNS.DATE')           , field: 'trans_date'     , formatter : formatDate, sortable: true},
        {id: 'description'    , name: $translate.instant('COLUMNS.DESCRIPTION')    , field: 'description'    , width: 110, editor: Slick.Editors.Text},
        {id: 'account_id'     , name: $translate.instant('COLUMNS.ACCOUNT_NUMBER') , field: 'account_number' , sortable: true }                  ,
        {id: 'debit_equiv'    , name: $translate.instant('COLUMNS.DEB_EQUIV')      , field: 'debit_equiv'    , groupTotalsFormatter: totalFormat , sortable: true, maxWidth: 100, editor:Slick.Editors.Text},
        {id: 'credit_equiv'   , name: $translate.instant('COLUMNS.CRE_EQUIV')      , field: 'credit_equiv'   , groupTotalsFormatter: totalFormat , sortable: true, maxWidth: 100, editor:Slick.Editors.Text},
        {id: 'deb_cred_type'  , name: $translate.instant('COLUMNS.DC_TYPE')        , field: 'deb_cred_type'},
        {id: 'inv_po_id'      , name: $translate.instant('COLUMNS.INVPO_ID')       , field: 'inv_po_id'},
        {id: 'comment'        , name: $translate.instant('COLUMNS.COMMENT')        , field: 'comment'        , sortable : true, editor: Slick.Editors.Text} ,
        {id: 'cc_id'          , name: $translate.instant('COLUMNS.COST_CENTER')    , field: 'cc'          , sortable : true},
        {id: 'pc_id'          , name: $translate.instant('COLUMNS.PROFIT_CENTER')  , field: 'pc'          , sortable : true}
      ];

      return columns;
    }

    function formatDate(row, col, val) {
      return $filter('date')(val, 'yyyy-MM-dd');
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

    function setEditor (cols, editors){
      cols.forEach(function (col) {
        if (editors[col.id]) { col.editor = editors[col.id]; }
      });

      return cols;
    }    

    return {
      getColumns : getColumns,
      setEditor : setEditor
    };
  }
]);