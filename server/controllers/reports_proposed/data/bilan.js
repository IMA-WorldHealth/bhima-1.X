// reports_proposed/data/bilan.js
// Collects and aggregates data for the enterprise bilan

var q       = require('q');
var db      = require('../../../lib/db');
var numeral = require('numeral');

// Constant: root account id
// var ROOT_ACCOUNT_ID = 0;

var formatDollar = '$0,0.00';
var bilanDate = new Date();

// TODO Query for balance and title account IDs
// var balanceAccountId = 2;
// var titleAccountId = 3;

// This method builds a tree data structure of
// accounts and children of a specified parentId.
// function getChildren(accounts, parentId, depth) {
//   var children;

//   // Base case: There are no child accounts
//   // Return an empty array
//   if (accounts.length === 0) { return []; }

//   // Returns all accounts where the parent is the
//   // parentId
//   children = accounts.filter(function (account) {
//     return account.parent === parentId;
//   });

//   // Recursively call get children on all child accounts
//   // and attach them as childen of their parent account
//   children.forEach(function (account) {
//     account.depth = depth;
//     account.children = getChildren(accounts, account.id, depth+1);
//   });

//   return children;
// }


// FIXME Whatever - Jog on CS 101 - oh man
// function filterEmptyAccounts(accounts) {
//   var removedAccount = true;

//   while (removedAccount) {
//     removedAccount = false;
//     accounts = accounts.filter(emptyFilter);
//   }

//   function emptyFilter(account) {
//     var hasNoChildren = account.children.length === 0;

//     if (account.account_type_id === titleAccountId && hasNoChildren) {
//       removedAccount = true;
//     } else {
//       account.children = account.children.filter(emptyFilter);
//       return account;
//     }
//   }

//   return accounts;
// }

// Adds the balance of a list of accounts to
// an aggregate value
// function aggregate(value, account) {

//   var isLeaf = account.children.length === 0;

//   // FIXME MySQL querry should never return NULL - normalization should not have to be done
//   account.balance = account.balance || 0;

//   // FIXME Balances are ONLY ever assigned to the very top level accounts, not for every title account
//   account.formattedBalance = numeral(account.balance).format(formatDollar);

//   // if the account has children, recursively
//   // recursively call aggregate on the array of accounts
//   if (!isLeaf) {
//     return value + account.children.reduce(aggregate, 0);
//   }
//   return value + account.balance;
// }

// function getBalance(account) {
//   var som = 0;
//   account.children.forEach(function (child) {
//     som += child.balance + getBalance(child);
//   });

//   return som;
// }

// expose the http route
exports.compile = function (options) {
  'use strict';

  var deferred = q.defer(), context = {}, infos = {}, assetData = {}, passiveData = {};
  context.reportDate = bilanDate.toDateString();

  var sql =
    'SELECT `acc`.`id` AS `accountId`, `acc`.`account_txt` AS `accounTxt`, `acc`.`account_number` AS `accountNumber`, ' +
    '`acc`.`is_brut_link` AS `accountIsBrutLink`, `ref`.`id` AS `referenceId`, `ref`.`ref` AS `referenceAbbr`, `ref`.`text` AS `referenceLabel`, ' +
    '`ref`.`position` AS `referencePosition`, `gref`.`id` AS `greferenceId`, `ref`.`is_report` AS `referenceIsReport`, ' +
    '`gref`.`reference_group` AS `greferenceAbbr`, `gref`.`text` AS `greferenceLabel`, `gref`.`position` AS `greferencePosition`, ' +
    '`sbl`.`id` AS `sectionBilanId`, `sbl`.`text` AS `sectionBilanLabel`, `sbl`.`is_actif` AS `sectionBilanIsActif`, ' +
    '`sbl`.`position` AS `sectionBilanPosition`, SUM(`gld`.`debit_equiv`) AS `generalLegderDebit`, SUM(`gld`.`credit_equiv`) AS `generalLegderCredit` ' +
    'FROM `section_bilan` `sbl` JOIN `reference_group` `gref` ON `sbl`.`id` = `gref`.`section_bilan_id` JOIN `reference` `ref` ON `gref`.`id` = `ref`.`reference_group_id` ' +
    'JOIN `account` `acc` ON `acc`.`reference_id` = `ref`.`id` JOIN `general_ledger` `gld` ON `gld`.`account_id` = `acc`.`id` WHERE `gld`.`trans_date`<= (SELECT MAX(`period_stop`) ' +
    'FROM `period` WHERE `period`.`fiscal_year_id`=?) AND `acc`.`is_ohada`=? GROUP BY `gld`.`account_id`;';

  db.exec(sql, [options.fy, 1])
  .then(function (currentAccountDetails) {
    infos.currentAccountDetails = currentAccountDetails;
    return db.exec(sql, [options.pfy, 1]);
  })
  .then(function (previousAccountDetails){
    infos.previousAccountDetails = previousAccountDetails;
    return q.when(infos);
  })
  .then(function (infos){
    //data processing

    var AssetGeneralBrut = 0, AssetGeneralAmortProv = 0, AssetGeneralNet = 0, AssetGeneralPreviousNet = 0;

    assetData.currentAccountDetails = infos.currentAccountDetails.filter(function (item){
      return item.sectionBilanIsActif === 1;
    });

    assetData.previousAccountDetails = infos.previousAccountDetails.filter(function (item){
      return item.sectionBilanIsActif === 1;
    });

    passiveData.currentAccountDetails = infos.currentAccountDetails.filter(function (item){
      return item.sectionBilanIsActif === 0;
    });

    passiveData.previousAccountDetails = infos.previousAccountDetails.filter(function (item){
      return item.sectionBilanIsActif === 0;
    });

    context.assetSide = processAsset(assetData);
    context.passiveSide = processPassive(passiveData);

    function processAsset (tbl){
      var currents = tbl.currentAccountDetails;
      var sections = getSections(currents);

      context.assetGeneralBrut = 0, context.assetGeneralAmortProv = 0, context.assetGeneralNet = 0, context.assetGeneralPreviousNet = 0,
      sections.forEach(function (section){
        section.totalBrut = 0, section.totalAmortProv = 0, section.totalNet = 0, section.totalPreviousNet = 0;
        section.grefs = getGroupReferences(section, currents);
        section.grefs.forEach(function (gref){
          gref.refs = getReferences(gref, currents);
          gref.refs.forEach(function (item){
            item.brut = getBrut(item, currents);
            item.brut_view = numeral(item.brut).format(formatDollar);
            section.totalBrut += item.brut;

            item.amort_prov = getAmortProv(item, currents);
            item.amort_prov_view = numeral(item.amort_prov).format(formatDollar);
            section.totalAmortProv += item.amort_prov;

            item.net = item.brut - item.amort_prov;
            item.net_view = numeral(item.net).format(formatDollar);
            section.totalNet += item.net;

            item.previousNet = getPreviousNet(item, tbl.previousAccountDetails);
            item.previousNet_view = numeral(item.previousNet).format(formatDollar);
            section.totalPreviousNet = item.previousNet;
          });

          section.totalBrut_view = numeral(section.totalBrut).format(formatDollar);
          section.totalAmortProv_view = numeral(section.totalAmortProv).format(formatDollar);
          section.totalNet_view = numeral(section.totalNet).format(formatDollar);
          section.totalPreviousNet_view = numeral(section.totalPreviousNet).format(formatDollar);

        });

          context.assetGeneralBrut += section.totalBrut;
          context.assetGeneralNet += section.totalNet;
          context.assetGeneralAmortProv += section.totalAmortProv;
          context.assetGeneralPreviousNet += section.totalPreviousNet;
      });

      context.assetGeneralBrut = numeral(context.assetGeneralBrut).format(formatDollar);
      context.assetGeneralAmortProv = numeral(context.assetGeneralAmortProv).format(formatDollar);
      context.assetGeneralNet = numeral(context.assetGeneralNet).format(formatDollar);
      context.assetGeneralPreviousNet = numeral(context.assetGeneralPreviousNet).format(formatDollar);
      return sections;
    }

    function processPassive (tbl){
      var currents = tbl.currentAccountDetails;
      var sections = getSections(currents);

      context.passiveGeneralBrut = 0, context.passiveGeneralAmortProv = 0, context.passiveGeneralNet = 0, context.passiveGeneralPreviousNet = 0,
      sections.forEach(function (section){
        section.totalBrut = 0, section.totalAmortProv = 0, section.totalNet = 0, section.totalPreviousNet = 0;
        section.grefs = getGroupReferences(section, currents);
        section.grefs.forEach(function (gref){
          gref.refs = getReferences(gref, currents);
          gref.refs.forEach(function (item){
            item.brut = getBrut(item, currents);
            item.brut_view = numeral(item.brut).format(formatDollar);
            section.totalBrut += item.brut;

            item.amort_prov = getAmortProv(item, currents);
            item.amort_prov_view = numeral(item.amort_prov).format(formatDollar);
            section.totalAmortProv += item.amort_prov;

            item.net = item.brut - item.amort_prov;
            item.net_view = numeral(item.net).format(formatDollar);
            section.totalNet += item.net;

            item.previousNet = getPreviousNet(item, tbl.previousAccountDetails);
            item.previousNet_view = numeral(item.previousNet).format(formatDollar);
            section.totalPreviousNet = item.previousNet;
          });

          section.totalBrut_view = numeral(section.totalBrut).format(formatDollar);
          section.totalAmortProv_view = numeral(section.totalAmortProv).format(formatDollar);
          section.totalNet_view = numeral(section.totalNet).format(formatDollar);
          section.totalPreviousNet_view = numeral(section.totalPreviousNet).format(formatDollar);

        });

          context.passiveGeneralBrut += section.totalBrut;
          context.passiveGeneralNet += section.totalNet;
          context.passiveGeneralAmortProv += section.totalAmortProv;
          context.passiveGeneralPreviousNet += section.totalPreviousNet;
      });

      context.passiveGeneralBrut = numeral(context.passiveGeneralBrut).format(formatDollar);
      context.passiveGeneralAmortProv = numeral(context.passiveGeneralAmortProv).format(formatDollar);
      context.passiveGeneralNet = numeral(context.passiveGeneralNet).format(formatDollar);
      context.passiveGeneralPreviousNet = numeral(context.passiveGeneralPreviousNet).format(formatDollar);
      return sections;
    }

    function exist (obj, arr, crit){
      return arr.some(function (item){
        return obj[crit] == item[crit];
      });
    }

    function getSections (currents){
      var sections = [];
      sections.push({
        sectionBilanId : currents[0].sectionBilanId,
        sectionBilanPosition : currents[0].sectionBilanPosition,
        sectionBilanLabel : currents[0].sectionBilanLabel,
        sectionBilanIsActif : currents[0].sectionBilanIsActif,
        grefs : []
      });

      for(var i = 1; i <= currents.length - 1; i++){
        if(!exist(currents[i], sections, 'sectionBilanId')){
          sections.push({
            sectionBilanId : currents[i].sectionBilanId,
            sectionBilanPosition : currents[i].sectionBilanPosition,
            sectionBilanLabel : currents[i].sectionBilanLabel,
            sectionBilanIsActif : currents[i].sectionBilanIsActif,
            grefs : []
          })
        }
      }

      return sections;
    }

    function getGroupReferences (section, currents){
      var greferences = [];

      for(var i = 0; i <= currents.length - 1; i++){
        if(currents[i].sectionBilanId == section.sectionBilanId){
          if(!exist(currents[i], greferences, 'greferenceId')){
            greferences.push({
              greferenceId : currents[i].greferenceId,
              greferenceAbbr : currents[i].greferenceAbbr,
              greferencePosition : currents[i].greferencePosition,
              greferenceLabel : currents[i].greferenceLabel,
              refs : []
            });
          }
        }
      }
      return greferences;
    }

    function getReferences (greference, currents){
      var references = [];

      for(var i = 0; i <= currents.length - 1; i++){
        if(currents[i].greferenceId == greference.greferenceId){
          if(!exist(currents[i], references, 'referenceId')){
            references.push({
              referenceId : currents[i].referenceId,
              referenceAbbr : currents[i].referenceAbbr,
              referencePosition : currents[i].referencePosition,
              referenceLabel : currents[i].referenceLabel,
              brut : 0,
              amort_prov : 0,
              net : 0,
              previousNet : 0
            });
          }
        }
      }
      return references;
    }

    function getBrut (reference, currents){
      var somDebit = 0, somCredit = 0;

      currents.forEach(function (item){
        if(item.referenceId == reference.referenceId && item.accountIsBrutLink == 1){
          somDebit+=item.generalLegderDebit;
          somCredit+=item.generalLegderCredit;
        }
      });
      return somDebit - somCredit;
    }

    function getAmortProv (reference, currents){
      var somDebit = 0, somCredit = 0;

      currents.forEach(function (item){
        if(item.referenceId === reference.referenceId && item.accountIsBrutLink === 0){
          somDebit+=(item.periodTotalDebit);
          somCredit+=(item.periodTotalCredit);
        }
      });
      return somDebit - somCredit;
    }

    function getPreviousNet (reference, currents){
      var somDebit = 0, somCredit = 0;

      currents.forEach(function (item){
        if(item.referenceId == reference.referenceId && item.accountIsBrutLink == 0){
          somDebit+=(item.generalLegderDebit) * -1;
          somCredit+=(item.generalLegderCredit) * -1;
        }else if(item.referenceId == reference.referenceId && item.accountIsBrutLink == 1){
          somDebit+=item.generalLegderDebit;
          somCredit+=item.generalLegderCredit;
        }
      });
      return somDebit - somCredit;
    }

    deferred.resolve(context);
  })
  .catch(deferred.reject)
  .done();

  return deferred.promise;
};
