/**
 * @description 
 *
 * @returns 
 *
 * @todo currently proof of concept client side document report - include 
 * limiting by project and user parameters (provided on client)
 */

var q       = require('q');
var db      = require('../../../lib/db');
var numeral = require('numeral');

/**
 * Default configuration options 
 * TODO Should this be served and displayed to the client for report 
 * coniguration?
 */
var DEFAULT_HEADING = 'Patient Invoice Records';

exports.compile = function (options) { 
  'use strict';
 
  var deferred = q.defer();
  var context = {};

  // Verify parameters
  if (!options.dateFrom || !options.dateTo) { 
    
    // TODO Uniform reject methods (+Error objects)
    return q.reject(new Error('Invalid report options'));
  }

  // Attach parameters/ defaults to completed context
  context.heading = options.heading || DEFAULT_HEADING;
  context.subheading = options.subheading;

  context.dateFrom = options.dateFrom;
  context.dateTo = options.dateTo;

  // Compile information switch 
  context.compileDate = new Date();
  context.displayCompileInformation = true;
  
  var invoiceQuery =
    'SELECT sale.uuid, sale.reference, sale.cost, sale.currency_id, sale.debitor_uuid, sale.invoice_date, ' +
    'sale.note, sale.posted, sale.seller_id, credit_note.uuid as `creditId`, credit_note.description as `creditDescription`, ' +
    'credit_note.posted as `creditPosted`, first_name, last_name, middle_name, patient.reference as `patientReference`, project.abbr as `projectAbbr`, CONCAT(project.abbr, sale.reference) as `hr_id` ' +
    'FROM sale LEFT JOIN credit_note on sale.uuid = credit_note.sale_uuid ' +
    'LEFT JOIN patient on sale.debitor_uuid = patient.debitor_uuid ' +
    'LEFT JOIN project on sale.project_id = project.id ' +
    'WHERE sale.invoice_date >= ? AND sale.invoice_date <= ? ';


  db.exec(invoiceQuery, [options.dateFrom, options.dateTo])
    .then(function (invoices) { 

      context.invoices = invoices;
      deferred.resolve(context);
    })
    .catch(deferred.reject)
    .done();

  return deferred.promise;
};
