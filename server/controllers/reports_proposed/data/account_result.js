var q       = require('q');
var db      = require('../../../lib/db');
var numeral = require('numeral');
var formatDollar = '$0,0.00';
var resultAccountDate = new Date();

// expose the http route
exports.compile = function (options) {
  'use strict';  
  var i18nAccountResult = options.language == 'fr' ? require('../lang/fr.json').ACCOUNT_RESULT : require('../lang/en.json').ACCOUNT_RESULT;
  var deferred = q.defer(), context = {}, infos = {}, chargeData = {}, produitData = {};
  var sql =
    'SELECT `acc`.`id` AS `accountId`, `acc`.`account_txt` AS `accounTxt`, `acc`.`account_number` AS `accountNumber`, ' +
    '`ref`.`id` AS `referenceId`, `ref`.`ref` AS `referenceAbbr`, `ref`.`text` AS `referenceLabel`, ' +
    '`ref`.`position` AS `referencePosition`, `ref`.`is_report` AS `referenceIsReport`, ' +
    '`src`.`id` AS `sectionResultId`, `src`.`text` AS `sectionResultLabel`, `src`.`is_charge` AS `sectionResultIsCharge`, ' +
    '`src`.`position` AS `sectionResultPosition`, SUM(`gld`.`debit_equiv`) AS `generalLegderDebit`, SUM(`gld`.`credit_equiv`) AS `generalLegderCredit` ' +
    'FROM `section_resultat` `src` JOIN `reference` `ref` ON `ref`.`section_resultat_id` = `src`.`id` ' +
    'JOIN `account` `acc` ON `acc`.`reference_id` = `ref`.`id` JOIN `general_ledger` `gld` ON `gld`.`account_id` = `acc`.`id` WHERE `gld`.`period_id` IN (SELECT `id` ' +
    'FROM `period` WHERE `period`.`fiscal_year_id`=?) AND `acc`.`is_ohada`=? AND `acc`.`account_type_id`=? GROUP BY `gld`.`account_id` ORDER BY `src`.`position`, `ref`.`position` ASC;';

  var doBalance = function (somDebit, somCredit, isCharge){
    return (isCharge == 1)? somDebit - somCredit : somCredit - somDebit;
  }

  //populating context object
  context.reportDate = resultAccountDate.toDateString();
  context.options = options;
  context.i18nAccountResult = i18nAccountResult;

  db.exec(sql, [options.fy, 1, 1])
  .then(function (currentAccountDetails) {
    infos.currentAccountDetails = currentAccountDetails;
    return q.all(options.parentIds.map(function (fid){
      return db.exec(sql, [fid, 1, 1]);
    }));
  })
  .then(function (ans){

    ans = ans.map(function (items){

      var charges = items.filter(function (item){
        return item.sectionResultIsCharge === 1;
      });

      var produits = items.filter(function (item){
        return item.sectionResultIsCharge === 0;
      });

      /** transform our array of array to an object which contains to array charge and produit**/
      return {charges : charges, produits : produits};
    });

    infos.previous = ans;
    return q.when(infos);
  })
  .then(function (infos){  

    context.previous = infos.previous;
    //data processing
    chargeData.currentAccountDetails = infos.currentAccountDetails.filter(function (item){
      return item.sectionResultIsCharge === 1;
    });

    produitData.currentAccountDetails = infos.currentAccountDetails.filter(function (item){
      return item.sectionResultIsCharge === 0;
    });

    context.chargeSide = processCharge(chargeData);
    context.profitSide = processProduit(produitData);


    function processCharge (tbl){
      var currents = tbl.currentAccountDetails;
      var sections = (currents.length > 0) ? getSections(currents, 1) : [];

      context.chargeGeneral = 0;

      /**initialize each context Genereal total for previous**/
      infos.previous.forEach(function (item, i){ context['chargeGeneralPrevious' + i] = 0; });

      sections.forEach(function (section){
        section.total = 0;
        /**initialize each section total previous**/
        infos.previous.forEach(function (item, i){ section['totalPrevious' + i] = 0; });

        section.refs = getReferences(section, currents);

        section.refs.forEach(function (item){
            item.net = getNet(item, currents, section.sectionResultIsCharge, doBalance);
            item.net_view = numeral(item.net).format(formatDollar);
            section.total += item.net;

            //previous net processing
            infos.previous.forEach(function (previousYearData, index){
              item['previous' + index] = getPrevious(item, previousYearData.charges, section.sectionResultIsCharge, doBalance);
              item['previous_view' + index] = numeral(item['previous' + index]).format(formatDollar);
              section['totalPrevious' + index] += item['previous' + index];
            });
        });

        context.chargeGeneral += section.total;
        section.total_view = numeral(section.total).format(formatDollar);
       

        /** iterate to have each total previous**/
        infos.previous.forEach(function (previousYearData, index){
          context['chargeGeneralPrevious' + index] += section['totalPrevious' + index];
          section['totalPrevious_view' + index] = numeral(section['totalPrevious' + index]).format(formatDollar);
        }); 
      });

      context.chargeGeneral = numeral(context.chargeGeneral).format(formatDollar);

      /** iterate to have each total view previous**/
      infos.previous.forEach(function (previousYearData, index){
        context['chargeGeneralPrevious' + index] = numeral(context['chargeGeneralPrevious' + index]).format(formatDollar);
      });

      return sections;
    }

    function processProduit (tbl){
      var currents = tbl.currentAccountDetails;
      var sections = (currents.length > 0) ? getSections(currents, 0) : [];

      context.produitGeneral = 0;

      /**initialize each context Genereal total for previous**/
      infos.previous.forEach(function (item, i){ context['produitGeneralPrevious' + i] = 0; });

      sections.forEach(function (section){
        section.total = 0;
        /**initialize each section total previous**/
        infos.previous.forEach(function (item, i){ section['totalPrevious' + i] = 0; });

        section.refs = getReferences(section, currents);

        section.refs.forEach(function (item){
            item.net = getNet(item, currents, section.sectionResultIsCharge, doBalance);
            item.net_view = numeral(item.net).format(formatDollar);
            section.total += item.net;

            //previous net processing
            infos.previous.forEach(function (previousYearData, index){
              item['previous' + index] = getPrevious(item, previousYearData.produits, section.sectionResultIsCharge, doBalance);
              item['previous_view' + index] = numeral(item['previous' + index]).format(formatDollar);
              section['totalPrevious' + index] += item['previous' + index];
            });
        });

        section.total_view = numeral(section.total).format(formatDollar);
        context.produitGeneral += section.total;

        /** iterate to have each total previous**/
        infos.previous.forEach(function (previousYearData, index){
          context['produitGeneralPrevious' + index] += section['totalPrevious' + index];
          section['totalPrevious_view' + index] = numeral(section['totalPrevious' + index]).format(formatDollar);
        }); 
      });

      context.produitGeneral = numeral(context.produitGeneral).format(formatDollar);

      /** iterate to have each total view previous**/
      infos.previous.forEach(function (previousYearData, index){
        context['produitGeneralPrevious' + index] = numeral(context['produitGeneralPrevious' + index]).format(formatDollar);
      });

      return sections;
    }

    function exist (obj, arr, crit){
      return arr.some(function (item){
        return obj[crit] == item[crit];
      });
    }

    function getSections (currents, isCharge){
      var sections = [];

      for(var i = 0; i <= currents.length - 1; i++){
        if(currents[i].sectionResultIsCharge === isCharge){
          if(!exist(currents[i], sections, 'sectionResultId')){
            sections.push({
              sectionResultId : currents[i].sectionResultId,
              sectionResultPosition : currents[i].sectionResultPosition,
              sectionResultLabel : currents[i].sectionResultLabel,
              sectionResultIsCharge : currents[i].sectionResultIsCharge,
              refs : []
            })
          }
        }
      }

       /** getting section form previous**/
      infos.previous.forEach(function (item){
        var previous = [];
        previous = previous.concat(item.charges);
        previous = previous.concat(item.produits);
        previous.forEach(function (item){
          if(item.sectionResultIsCharge === isCharge){
            if(!exist(item, sections, 'sectionResultId')){
              sections.push({
                sectionResultId : item.sectionResultId,
                sectionResultPosition : item.sectionResultPosition,
                sectionResultLabel : item.sectionResultLabel,
                sectionResultIsCharge : item.sectionResultIsCharge,
                refs : []
              })
            }            
          }
        });        
      });

      return sections;
    }

    function getReferences (section, currents){
      var references = [];

      for(var i = 0; i <= currents.length - 1; i++){
        if(currents[i].sectionResultId == section.sectionResultId){
          if(!exist(currents[i], references, 'referenceId')){
            references.push({
              referenceId : currents[i].referenceId,
              referenceAbbr : currents[i].referenceAbbr,
              referencePosition : currents[i].referencePosition,
              referenceLabel : currents[i].referenceLabel,
              net : 0,
              previousNet : 0
            });
          }
        }
      }

      /** getting reference form previous**/
      infos.previous.forEach(function (items){
        var previous = [];
        previous = previous.concat(items.charges);
        previous = previous.concat(items.produits);

        previous.forEach(function (item){
          if(item.greferenceId == section.sectionResultId){
            if(!exist(item, references, 'referenceId')){
              references.push({
                referenceId : item.referenceId,
                referenceAbbr : item.referenceAbbr,
                referencePosition : item.referencePosition,
                referenceLabel : item.referenceLabel,
                net : 0,
                previousNet : 0
              });              
            }
          }          
        });
      });

      return references;
    }

    function getNet(reference, currents, isCharge, fn){
      var somDebit = 0, somCredit = 0;

      currents.forEach(function (item){
        if(item.referenceId === reference.referenceId){
          somDebit+=item.generalLegderDebit;
          somCredit+=item.generalLegderCredit;
        }
      });
      return fn(somDebit, somCredit, isCharge);
    }

    function getPrevious (reference, previous, isCharge, fn){
      var somDebit = 0, somCredit = 0;

      previous.forEach(function (item){
        if(item.referenceId === reference.referenceId){
          somDebit+=item.generalLegderDebit;
          somCredit+=item.generalLegderCredit;
        }
      });

      return fn(somDebit, somCredit, isCharge);
    }    

    deferred.resolve(context);
  })
  .catch(deferred.reject)
  .done();

  return deferred.promise;
};
