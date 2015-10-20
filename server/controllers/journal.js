var tableRouter;

// Todo -- Why do we need this?
// GET /journal/:table/:id
function lookupTable(req, res, next) {
  // What are the params here?
  request(req.params.table, req.params.id, req.session.user.id, function (err) {
    if (err) { return next(err); }
    res.status(200).send();
  });
}

// FIXME/TODO -- rename HTTP routes into meaningful routes
// Each route should describe what it actually is trying to do.
// At miniumum the route name + the controller name should allow
// the developer to guess what the implications of each route are.
tableRouter = {
  'sale'                       : require('./journal/sale').create,
  'cash'                       : require('./journal/cash').payment,
  'cash_discard'               : require('./journal/cash').refund,
  //'payroll'                  : require('./journal/primarycash').payroll,
  'group_invoice'              : require('./journal/convention').invoice,
  'credit_note'                : require('./journal/sale').creditNote,
  'caution'                    : require('./journal/sale').caution,
  'pcash_convention'           : require('./journal/primarycash').convention,
  'pcash_employee'             : require('./journal/primarycash').payEmployee,
  'primary_expense'            : require('./journal/primarycash').genericExpense,
  'salary_advance'             : require('./journal/primarycash').salaryAdvance,
  'primary_income'             : require('./journal/primarycash').genericIncome,
  'cash_return'                : require('./journal/primarycash').refund,
  'transfert'                  : require('./journal/primarycash').transfer,
  'indirect_purchase'          : require('./journal/purchase').indirectPurchase,
  'confirm_indirect_purchase'  : require('./journal/purchase').confirmIndirectPurchase, // TODO - rename
  'confirm_direct_purchase'    : require('./journal/purchase').directPurchase,
  'distribution_patient'       : require('./journal/distribution').patient,
  'distribution_service'       : require('./journal/distribution').service,
  'consumption_loss'           : require('./journal/distribution').loss,
  'salary_payment'             : require('./journal/primarycash').salaryPayment,
  'employee_invoice'           : require('./journal/employee').invoice,
  'promesse_payment'           : require('./journal/employee').promisePayment,
  'promesse_cotisation'        : require('./journal/employee').promiseCotisation,
  'promesse_tax'               : require('./journal/employee').promiseTax,
  'tax_payment'                : require('./journal/employee').taxPayment,
  'cotisation_payment'         : require('./journal/primarycash').cotisationPayment,
  'reversing_stock'            : require('./journal/distribution').reverseDistribution,
  'advance_paiment'            : require('./journal/employee').advancePayment,
  'extra_payment'              : require('./journal/finance').extraPayment,
  'cancel_support'             : require('./journal/finance').cancelInvoice,
  'create_fiscal_year'         : require('./journal/fiscal').create,
  'fiscal_year_resultat'       : require('./journal/fiscal').close,
  'confirm_integration'        : require('./journal/purchase').integration,
  'donation'                   : require('./journal/inventory').donation
};


// FIXME - redesign
//
// If there are classes of routes that need extra information, that must be
// WELL DOCUMENTED and an explanation provided for why they might need
// extra params.
//
// It is my impression that these journal modules are called from other
// routes that are not HTTP endpoints.  Perhaps it would be better to have
// two separate functions for doing that, rather than a single endpoint.
function request (table, id, user_id, done, debCaution, details) {

  console.log('Call for TABLE:', table);
  // handles all requests coming from the client
  if (debCaution >= 0) {
    tableRouter[table](id, user_id, done, debCaution);
  } else if (details) {
    tableRouter[table](id, user_id, details, done);
  } else {
    tableRouter[table](id, user_id, done);
  }
  return;
}

module.exports = {
  request : request,
  lookupTable : lookupTable
};
