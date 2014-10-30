angular.module('bhima.controllers')
.controller('multi_payroll', [
  '$scope',
  '$routeParams',
  '$translate',
  '$http',
  'messenger',
  'validate',
  'appstate',
  'connect',
  '$location',
  'util',
  'appcache',
  'exchange',
  '$q',
  'ipr',
  'uuid',
  function ($scope, $routeParams, $translate, $http, messenger, validate, appstate, connect, $location, util, Appcache, exchange, $q, ipr, uuid) {
    var dependencies = {},
        cache = new Appcache('payroll'),
        session = $scope.session = {configured : false, complete : false, data : {}, selectedItem : {}, rows : []};

    session.cashbox = $routeParams.cashbox;

    dependencies.currencies = {
      required : true,
      query : {
        tables : {
          'currency' : {
            columns : ['id', 'symbol', 'min_monentary_unit']
          }
        }
      }
    };

    dependencies.exchange_rate = {
      required : true,
      query : {
        tables : {
          'exchange_rate' : {
            columns : ['id', 'enterprise_currency_id', 'foreign_currency_id', 'date', 'rate']
          }
        },
        where : ['exchange_rate.date='+util.sqlDate(new Date())]
      }
    };

    dependencies.employees = {
      required : true,
      query : 'employee_list/'
    };

    dependencies.user = {
      query : 'user_session'
    };

    dependencies.paiement_period = {
      query : {
        tables : {
          'paiement_period' : {
            columns : ['id', 'config_tax_id', 'config_rubric_id', 'config_cotisation_id', 'config_accounting_id', 'label', 'dateFrom', 'dateTo']
          }
        }
      }
    };

    dependencies.pcash_module = {
      required : true,
      query : {
        tables : {
          'primary_cash_module' : {
            columns : ['id']
          }
        },
        where : ['primary_cash_module.text=Payroll']
      }
    };

    dependencies.enterprise = {
      query : {
        tables : {
          'enterprise' : {
          columns : ['currency_id']
        }
        }
      }
    };

    dependencies.paiements = {
      query : {
        tables : {
          'paiement' : {
            columns : ['uuid', 'employee_id']
          }
        }
      }
    };

    appstate.register('project', function (project) {
      $scope.project = project;
        validate.process(dependencies, ['enterprise', 'pcash_module', 'paiement_period', 'user', 'exchange_rate', 'currencies'])
        .then(init, function (err) {
          messenger.danger(err.message + ' ' + err.reference);
          return;
        });
    });

    function reconfigure() {
      cache.remove('paiement_period');
      session.pp = null;
      session.configured = false;
      session.complete = false;
    }

    function init (model) {
      session.model = model;
      cache.fetch('selectedItem')
      .then(function (selectedItem){
        if (!selectedItem) { throw new Error('Monnaie non definie !'); }
        session.loading_currency_id = selectedItem.id;
        session.selectedItem = selectedItem;
        return cache.fetch('paiement_period');
      })
      .then(function (pp) {
        if(!pp) {
          throw new Error('Periode de paiement non definie !');
        }
        session.pp = pp;
        dependencies.paiements.query.where = ['paiement.paiement_period_id=' + session.pp.id];
        if(dependencies.paiements) {
          dependencies.paiements.processed = false;
        }

        if(dependencies.employees){
          dependencies.employees.processed = false;
        }

        return validate.process(dependencies, ['employees', 'paiements']);
      })
      .then(function (model) {
        session.model = model;
        session.configured = true;
        session.complete = true;
        return getPPConf();
      })
      .then(getOffDayCount)
      .then(getTrancheIPR)
      .then(function(tranches){
        session.tranches_ipr = tranches;
        return $q.when();
      })
      .then(getEmployees)
      .catch(function (err) {
        messenger.danger(err.message);
        return;
      });
    }

    function getEmployees () {
      session.rows = [];
      var unpaidEmployees = getUnpaidEmployees();
      unpaidEmployees.forEach(function (emp) {
        new EmployeeRow(emp)
        .then(function (row) {
          session.rows.push(row);
        });
      });
    }

    function getUnpaidEmployees () {
      return session.model.employees.data.filter(function (emp) {
        var pass = session.model.paiements.data.some(function (paiement) {
          return paiement.employee_id === emp.id;
        });
        return !pass;
      });
    }

    function refreshList () {
      return session.rows.filter(function (row) {
        var pass = session.model.paiements.data.some(function (paiement) {
          return paiement.employee_id === row.emp.id;
        });
        return !pass;
      });
    }

    function EmployeeRow (emp) {
      //FIX ME : clean this function
      var self = this;
      var def = $q.defer();
      getHollyDayCount(emp)
      .then(function (hld){
        var hl = 0;
        self.coefhl = 0;
        if(hld){
          hl = hld.nb;
          self.coefhl = hld.coeff;
        }

        self.off_day = session.data.off_day;
        self.emp = emp;
        self.emp.basic_salary =
        exchange.convertir(
          self.emp.basic_salary,
          session.model.enterprise.data[0].currency_id,
          session.selectedItem.id,
          util.sqlDate(new Date())
        );
        self.max_day = session.data.max_day;
        self.working_day = session.data.max_day - (hl + session.data.off_day);
        self.hollydays = hl;
        self.offdays = session.data.off_day;
        self.daily_salary = self.emp.basic_salary / session.data.max_day;
        self.visible = false;

        var taxes = session.model.tax_config.data;
        var cotisations = session.model.cotisation_config.data;

        var taxEmp = taxes.filter(function (item) {
          return item.is_employee  === 1;
        });

        var taxComp = taxes.filter(function (item) {
          return item.is_employee  == 0;
        });

        if(taxEmp){
          $scope.taxEmp = taxEmp;
        }

        if(taxComp){
          $scope.taxComp = taxComp;
        }

        var cotisationEmp = cotisations.filter(function (item) {
          return item.is_employee  === 1;
        });

        var cotisationComp = cotisations.filter(function (item) {
          return item.is_employee  == 0;
        });

        if(cotisationEmp){
          $scope.cotisationEmp = cotisationEmp;
        }

        if(cotisationComp){
          $scope.cotisationComp = cotisationComp;
        }
        var rubrics = session.model.rubric_config.data;

        rubrics.forEach(function (rub) {
          dataRubric = (rub.is_percent) ?
          ((self.daily_salary * (self.working_day + self.coefhl + self.offdays)) * rub.value) / 100 : rub.value;
          self[rub.abbr] = dataRubric;
        });

        taxes.forEach(function (tax) {
          dataTaxes = (tax.is_percent) ?
          ((self.daily_salary * (self.working_day + self.coefhl + self.offdays)) * tax.value) / 100 : tax.value;
          self[tax.abbr] = dataTaxes;
        });

        var employee_cotisation = 0;

        cotisations.forEach(function (cotisation) {
          dataCotisations = (cotisation.is_percent) ?
        ((self.daily_salary * (self.working_day + self.hollydays + self.offdays)) * cotisation.value) / 100 : cotisation.value;
          self[cotisation.abbr] = dataCotisations;
          if(cotisation.is_employee) {employee_cotisation += dataCotisations;}
        });

        self.net_before_taxe = ((self.working_day + self.coefhl + self.offdays) * self.daily_salary) - employee_cotisation;
        return getIPR(self);
      })
      .then(function (IPR){
        self.IPR1 = IPR;
        // return getEnterpriseINSS(self);
        self.offdays_cost = getOffDayCost(self);
        def.resolve(self);
      });
      // .then(function (enterprise_INSS){
      //   self.INS2 = enterprise_INSS;
      //   self.offdays_cost = getOffDayCost(self);
      //   def.resolve(self);
      // });
      return def.promise;
    }

    function getIPR(row) {
      var tranches = session.tranches_ipr;
      if(!tranches.length) {return 0;}

      var net_imposable = exchange.convertir(
        row.net_before_taxe,
        session.selectedItem.id,
        tranches[0].currency_id,
        util.sqlDate(new Date())
      );


      var montant_annuel = net_imposable * 12;

      var ind = -1;
      for(var i = 0; i< tranches.length; i++) {
        if(montant_annuel > tranches[i].tranche_annuelle_debut && montant_annuel < tranches[i].tranche_annuelle_fin) {
          ind = i;
          break;
        }
      }


      if(ind < 0) { return 0; }
      var initial = tranches[ind].tranche_annuelle_debut;
      var taux = tranches[ind].taux / 100;

      var cumul = (tranches[ind - 1]) ? tranches[ind - 1].cumul_annuel : 0;
      var value = (((montant_annuel - initial) * taux) + cumul) / 12;

      if(row.emp.nb_enfant > 0) {
        value -= (value * (row.emp.nb_enfant * 2)) / 100;
      }

      return exchange.convertir(value, tranches[0].currency_id, session.selectedItem.id, util.sqlDate(new Date()));
    }

    function getOffDayCost (row) {
      var cost = 0;
      session.model.offDays.data.forEach(function (offday) {
        cost = cost + (row.daily_salary * offday.percent_pay) / 100;
      });
      return cost;
    }

    function getPPConf() {

      dependencies.paiement_period_conf = {
        required : true,
        query : {
          tables : {
            'config_paiement_period' : {
              columns : ['id', 'weekFrom', 'weekTo']
            }
          },
          where : ['config_paiement_period.paiement_period_id=' + session.pp.id]
        }
      };

      dependencies.rubric_config = {
        required : true,
        query : {
          tables : {
            'config_rubric' : {
              columns : ['label']
            },
            'config_rubric_item' : {
              columns : ['rubric_id', 'payable']
            },
            'rubric' : {
              columns : ['id', 'abbr', 'label', 'is_percent', 'is_discount', 'value']
            }
          },
          join : [
            'config_rubric.id=config_rubric_item.config_rubric_id',
            'rubric.id=config_rubric_item.rubric_id'
          ],
          where : [
            'config_rubric.id=' + session.pp.config_rubric_id
          ]
        }
      };

      dependencies.tax_config = {
        required : true,
        query : {
          tables : {
            'config_tax' : {
              columns : ['label']
            },
            'config_tax_item' : {
              columns : ['tax_id', 'payable']
            },
            'tax' : {
              columns : ['id', 'abbr','label', 'is_percent', 'value', 'four_account_id', 'six_account_id', 'is_employee']
            }
          },
          join : [
            'config_tax.id=config_tax_item.config_tax_id',
            'tax.id=config_tax_item.tax_id'
          ],
          where : [
            'config_tax.id=' + session.pp.config_tax_id
          ]
        }
      };

      dependencies.cotisation_config = {
        required : true,
        query : {
          tables : {
            'config_cotisation' : {
              columns : ['label']
            },
            'config_cotisation_item' : {
              columns : ['cotisation_id', 'payable']
            },
            'cotisation' : {
              columns : ['id', 'abbr','label', 'is_percent', 'value', 'four_account_id', 'six_account_id', 'is_employee']
            }
          },
          join : [
            'config_cotisation.id=config_cotisation_item.config_cotisation_id',
            'cotisation.id=config_cotisation_item.cotisation_id'
          ],
          where : [
            'config_cotisation.id=' + session.pp.config_cotisation_id
          ]
        }
      };

      return validate.process(dependencies, ['paiement_period_conf', 'rubric_config', 'tax_config', 'cotisation_config']);
    }

    function getOffDayCount (model) {
      session.model = model;

      dependencies.offDays = {
        query : {
          tables : {
            'offday' : {
              columns : ['id', 'label', 'date', 'percent_pay']
            }
          },
          where : ['offday.date>=' + util.sqlDate(session.pp.dateFrom), 'AND', 'offday.date<=' + util.sqlDate(session.pp.dateTo)]
        }
      };
      validate.process(dependencies, ['offDays'])
      .then(function (model) {
        var offdays = model.offDays.data;
        var pp_confs = model.paiement_period_conf.data;
        var nb_offdays = 0;
        session.data.max_day = getMaxDays(pp_confs);
        offdays.forEach(function (offDay) {
          for(var i = 0; i < pp_confs.length; i++){
            if ((util.isDateAfter(offDay.date, pp_confs[i].weekFrom) || util.areDatesEqual(offDay.date, pp_confs[i].weekFrom)) &&
                (util.isDateAfter(pp_confs[i].weekTo, offDay.date) || util.areDatesEqual(offDay.date, pp_confs[i].weekTo))) {
              nb_offdays++;
            }
          }
        });
        session.data.offdays = offdays;
        session.data.off_day = nb_offdays;
      });
      return $q.when();
    }

    function getTrancheIPR () {
      return ipr.calculate();
    }

    function getMaxDays (ppcs) {
      var nb = 0;
      ppcs.forEach(function (item) {

        var t2 = new Date(item.weekTo).getTime();
        var t1 = new Date(item.weekFrom).getTime();
        nb += (parseInt((t2-t1)/(24*3600*1000))) + 1;
      });
      return nb;
    }

    function getHollyDayCount (employee) {
      var defer = $q.defer();
      var som = 0;
      var pp = session.pp;

      connect.fetch('/hollyday_list/' + JSON.stringify(pp) + '/' + employee.id)
      .then(function (res) {
        var hollydays = res;
        if(hollydays.length) {
          var pp_confs = session.model.paiement_period_conf.data;
          var soms = [];
          var config = [];

          hollydays.forEach(function (h) {
            var nb = 0, nbOf = 0;

            function getValue (ppc) {
              var date_pweekfrom = new Date(ppc.weekFrom);
              var date_pweekto = new Date(ppc.weekTo);

              var date_hdatefrom = new Date(h.dateFrom);
              var date_hdateto = new Date(h.dateTo);
              var nbOff = 0;

              var num_pweekfrom = date_pweekfrom.setHours(0,0,0,0);
              var num_pweekto = date_pweekto.setHours(0,0,0,0);

              var num_hdatefrom = date_hdatefrom.setHours(0,0,0,0);
              var num_hdateto = date_hdateto.setHours(0,0,0,0);

              var minus_right = 0, minus_left = 0;

              if(num_pweekto > num_hdateto){
                minus_right = parseInt((num_pweekto - num_hdateto) / (24*3600*1000));
              }

              if(num_pweekfrom < num_hdatefrom){
                minus_left = parseInt((num_hdatefrom - num_pweekfrom) / (24*3600*1000));
              }
              var nbOffDaysPos = 0; //contains offdays number included in holliday period

              for(var i = 0; i < session.data.offdays.length; i++){
                var dateOff = new Date(session.data.offdays[i].date);
                var num_dateOff = dateOff.setHours(0,0,0,0);
                if(((num_dateOff >= num_hdatefrom) && (num_dateOff <= num_hdateto)) &&
                  ((num_dateOff >= num_pweekfrom) && (num_dateOff <= num_pweekto))){
                  nbOffDaysPos++;
                }
              }
              var t2 = date_pweekto.getTime();
              var t1 = date_pweekfrom.getTime();
              var total = (parseInt((t2-t1)/(24*3600*1000))) + 1 - nbOffDaysPos;
              if(minus_left > total) { return 0; }
              if(minus_right > total) { return 0; }
              return total - (minus_left + minus_right);
            }

            pp_confs.forEach(function (ppc) {
              nb += getValue(ppc);
            });
            soms.push(nb);
            var valeur = nb * (h.percentage / 100);
            config.push(valeur);
          });

          som = soms.reduce(function (x, y){
            return x+y;
          }, 0);

          somConfig = config.reduce(function (x, y){
            return x+y;
          }, 0);

          defer.resolve({nb : som, coeff : somConfig});
        }else{
          defer.resolve(0);
        }
      });
      return defer.promise;
    }

    function getRubricPayroll (row) {
      var rubrics = session.model.rubric_config.data, housing = 0;
      console.log(session.model.rubric_config.data);

      rubrics.forEach(function (rub) {
        dataRubric = (rub.is_percent) ?
        ((row.daily_salary * (row.working_day + row.hollydays + row.offdays)) * rub.value) / 100 : rub.value;
        self[rub.abbr] = dataRubric;
      });
    }

    function getEmployeeINSS (row) {
      var taxes = session.model.tax_config.data, employee_inss = 0;
      if(!taxes.length) {

        return $q.when(employee_inss);
      }

      var item = taxes.filter(function (item) {
        return item.abbr === 'INS1';
      })[0];

      if(item) {
        employee_inss = (item.is_percent) ?
        ((row.daily_salary * (row.working_day + row.hollydays + row.offdays)) * item.value) / 100 : item.value;
      }
      return $q.when(employee_inss);
    }

    function getEnterpriseINSS (row) {
      var taxes = session.model.tax_config.data, enterprise_inss = 0;

      if(!taxes.length) {
        return $q.when(enterprise_inss);
      }

      var item = taxes.filter(function (item) {
        return item.abbr === 'INS2';
      })[0];

      if(item) {
        enterprise_inss = (item.is_percent) ?
        ((row.daily_salary * (row.working_day + row.hollydays + row.offdays)) * item.value) / 100 : item.value;
      }
      return $q.when(enterprise_inss);
    }


    function setCurrency(currency) {
      if (currency) {
        session.loading_currency_id = session.selectedItem.id || session.model.enterprise.data[0].currency_id;
        var reload = session.selectedItem.id ? false : true;
        session.selectedItem = currency;
        cache.put('selectedItem', currency);
        if(reload){
          init(session.model);
        }
      }
    }

    function formatPeriod (pp) {
      return [pp.label, util.sqlDate(pp.dateFrom), util.sqlDate(pp.dateTo)].join(' / ');
    }

    function setConfiguration (pp) {
      if(pp){
        cache.put('paiement_period', pp);
        session.configured = true;
        session.pp = pp;
        session.complete = true;
        init(session.model);
      }
    }

    function payEmployee (packagePay) {
      var def = $q.defer();

      connect.basicPut('paiement', [packagePay.paiement], ['uuid'])
        // .then(function () {
        //   return connect.basicPut('primary_cash', [packagePay.primary], ['uuid']);
        // })
        // .then(function () {
        //   return connect.basicPut('primary_cash_item', [packagePay.primary_details], ['uuid']);
        // })
        .then(function () {
          return connect.basicPut('rubric_paiement', packagePay.rc_records, ['id']);
        })
        .then(function () {
          return connect.basicPut('tax_paiement', packagePay.tc_records, ['id']);
        })
        .then(function (res){
          def.resolve(res);
        })
        .then(function () {
          var params = {
            paiement_uuid : packagePay.paiement.uuid,
            project_id : $scope.project.id
          };
          return $http.post('/posting_promesse_payment/', params);
        })
        .catch(function (err){
          def.reject(err);
        });

        return def.promise;
    }

    function submit (list) {

      var rubric_config_list = session.model.rubric_config.data;
      var tax_config_list = session.model.tax_config.data;
      var cotisation_config_list = session.model.cotisation_config.data;


      return $q.all(list.map(function (elmt) {
        var rc_records = [];
        var tc_records = [];
        var cc_records = [];
        var somRub = 0, SomTax = 0, somCot = 0;

        cotisation_config_list.forEach(function (cotisation) {
          if(cotisation.is_employee){
            somCot += elmt[cotisation.abbr];
          }
        });

        elmt.net_before_taxe -= somCot;

        tax_config_list.forEach(function (tax) {
          if(tax.is_employee){
            SomTax += elmt[tax.abbr];
          }
        });

        elmt.net_after_taxe = elmt.net_before_taxe - SomTax;

        rubric_config_list.forEach(function (rub) {
          change = elmt[rub.abbr];
          if(rub.is_discount){
            change *= -1;
          }
          somRub += change;
        });
        elmt.net_salary = elmt.net_after_taxe + somRub - (elmt.daily_salary * elmt.off_day) + elmt.offdays_cost;
        // console.log("on a comme salaire :", elmt.net_salary);

        var paiement = {
          uuid : uuid(),
          employee_id : elmt.emp.id,
          paiement_period_id : session.pp.id,
          currency_id : session.selectedItem.id,
          paiement_date : util.sqlDate(new Date()),
          working_day : elmt.working_day,
          net_before_tax : elmt.net_before_taxe,
          net_after_tax : elmt.net_after_taxe,
          net_salary : elmt.net_salary
        };

        rubric_config_list.forEach(function (rc) {
          var record = {
            paiement_uuid : paiement.uuid,
            rubric_id : rc.id,
            value : elmt[rc.abbr]
          };
          rc_records.push(record);
        });

        tax_config_list.forEach(function (tc) {
          var record = {
            paiement_uuid : paiement.uuid,
            tax_id : tc.id,
            value : elmt[tc.abbr],
            posted : 0
          };
          tc_records.push(record);
        });

        cotisation_config_list.forEach(function (cc) {
          var record = {
            paiement_uuid : paiement.uuid,
            cotisation_id : cc.id,
            value : elmt[cc.abbr],
            posted : 0
          };
          cc_records.push(record);
        });

        // var primary = {
        //   uuid          : uuid(),
        //   project_id    : $scope.project.id,
        //   type          : 'S',
        //   date          : util.sqlDate(new Date()),
        //   deb_cred_uuid : elmt.emp.creditor_uuid,
        //   deb_cred_type : 'C',
        //   account_id    : session.selectedItem.account_id,
        //   currency_id   : session.selectedItem.id,
        //   cost          : paiement.net_salary,
        //   user_id       : session.model.user.data.id,
        //   description   : 'Payroll : ' + elmt.emp.name + elmt.emp.postnom,
        //   cash_box_id   : session.cashbox,
        //   origin_id     : 6
        // };

        // var primary_details = {
        //   uuid              : uuid(),
        //   primary_cash_uuid : primary.uuid,
        //   debit             : 0,
        //   credit            : primary.cost,
        //   document_uuid     : paiement.uuid
        // };

        var packagePay = {
          paiement : paiement,
          // primary : primary,
          // primary_details : primary_details,
          rc_records : rc_records,
          tc_records : tc_records,
          cc_records : cc_records
        };

        var def = $q.defer();
        payEmployee(packagePay)
        .then(function (val) {
          def.resolve(val);
        });
        return def.promise;
      }))
      .then(function (tab) {
        messenger.success('success');
        validate.refresh(dependencies, ['paiements'])
        .then(function () {
          session.rows = refreshList();
        });
      })
      .catch(function (err) {
        messenger.danger(err);
      });
    }

    function refresh(row){
      var totaldays = row.working_day + row.hollydays + row.offdays;
      if(!row.working_day){
        row.working_day = 0;
      }

      if((row.working_day) && (totaldays <= row.max_day)){
        var taxes = session.model.tax_config.data;
        var rubrics = session.model.rubric_config.data;
        var cotisations = session.model.cotisation_config.data;

        rubrics.forEach(function (rub) {
          dataRubric = (rub.is_percent) ?
          ((row.daily_salary * (row.working_day + row.coefhl + row.offdays)) * rub.value) / 100 : rub.value;
          row[rub.abbr] = dataRubric;
        });

        taxes.forEach(function (tax) {
          dataTaxes = (tax.is_percent) ?
          ((row.daily_salary * (row.working_day + row.coefhl + row.offdays)) * tax.value) / 100 : tax.value;
          row[tax.abbr] = dataTaxes;
        });

        var employee_cotisation = 0;

        cotisations.forEach(function (cotisation) {
          dataCotisations = (cotisation.is_percent) ?
          ((row.daily_salary * (row.working_day + row.coefhl + row.offdays)) * cotisation.value) / 100 : cotisation.value;
          if(cotisation.is_employee) {employee_cotisation += dataCotisations;}
          row[cotisation.abbr] = dataCotisations;
        });

        row.net_before_taxe = ((row.working_day + row.coefhl + row.offdays) * row.daily_salary) - employee_cotisation;

        row.IPR1 = getIPR(row);

      } else if (totaldays > row.max_day) {
        messenger.danger($translate.instant('RUBRIC_PAYROLL.NOT_SUP_MAXDAY'));
        row.working_day = 0;
        var taxes = session.model.tax_config.data;
        var rubrics = session.model.rubric_config.data;
        var cotisations = session.model.cotisation_config.data;

        rubrics.forEach(function (rub) {
          dataRubric = (rub.is_percent) ?
          ((row.daily_salary * (row.working_day + row.coefhl + row.offdays)) * rub.value) / 100 : rub.value;
          row[rub.abbr] = dataRubric;
        });

        taxes.forEach(function (tax) {
          dataTaxes = (tax.is_percent) ?
          ((row.daily_salary * (row.working_day + row.coefhl + row.offdays)) * tax.value) / 100 : tax.value;
          row[tax.abbr] = dataTaxes;
        });

        var employee_cotisation = 0;

        cotisations.forEach(function (cotisation) {
          dataCotisations = (cotisation.is_percent) ?
          ((row.daily_salary * (row.working_day + row.coefhl + row.offdays)) * cotisation.value) / 100 : cotisation.value;
          if(cotisation.is_employee) {employee_cotisation += dataCotisations;}
          row[cotisation.abbr] = dataCotisations;
        });

        row.net_before_taxe = ((row.working_day + row.coefhl + row.offdays) * row.daily_salary) - employee_cotisation;
        row.IPR1 = getIPR(row);
        getHollyDayCount(row); //why?
      }
    }

    $scope.$watch('session.selectedItem', function (nval, oval) {

       if(session.rows.length) {
          session.rows.forEach(function (row) {
            row.emp.basic_salary =
              exchange.convertir(
                row.emp.basic_salary,
                session.loading_currency_id,
                session.selectedItem.id,
                util.sqlDate(new Date())
            );

            row.daily_salary =
              exchange.convertir(
                row.daily_salary,
                session.loading_currency_id,
                session.selectedItem.id,
                util.sqlDate(new Date())
            );

            var taxes = session.model.tax_config.data;
            var rubrics = session.model.rubric_config.data;
            var cotisations = session.model.cotisation_config.data;

            rubrics.forEach(function (rub) {
              row[rub.abbr] = exchange.convertir(
                row[rub.abbr],
                session.loading_currency_id,
                session.selectedItem.id,
                util.sqlDate(new Date())
              );
            });

            taxes.forEach(function (tax) {
              row[tax.abbr] = exchange.convertir(
                row[tax.abbr],
                session.loading_currency_id,
                session.selectedItem.id,
                util.sqlDate(new Date())
              );
            });

            cotisations.forEach(function (cotisation) {
              row[cotisation.abbr] = exchange.convertir(
                row[cotisation.abbr],
                session.loading_currency_id,
                session.selectedItem.id,
                util.sqlDate(new Date())
              );
            });
            row.net_before_taxe =
              exchange.convertir(
                row.net_before_taxe,
                session.loading_currency_id,
                session.selectedItem.id,
                util.sqlDate(new Date())
            );

            row.net_after_taxe =
              exchange.convertir(
                row.net_after_taxe,
                session.loading_currency_id,
                session.selectedItem.id,
                util.sqlDate(new Date())
            );

            row.offdays_cost =
              exchange.convertir(
                row.offdays_cost,
                session.loading_currency_id,
                session.selectedItem.id,
                util.sqlDate(new Date())
            );

            row.net_salary =
              exchange.convertir(
                row.net_salary,
                session.loading_currency_id,
                session.selectedItem.id,
                util.sqlDate(new Date())
            );
          });
        }
    }, true);

    $scope.setCurrency = setCurrency;
    $scope.formatPeriod = formatPeriod;
    $scope.setConfiguration = setConfiguration;
    $scope.reconfigure = reconfigure;
    $scope.submit = submit;
    $scope.refresh = refresh;
  }
]);
