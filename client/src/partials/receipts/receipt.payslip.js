angular.module('bhima.controllers')
.controller('receipt.payslip', [
  '$scope',
  '$q',
  '$http',
  'validate',
  'exchange',
  'appstate',
  'util',
  'messenger',
  function ($scope, $q, $http, validate, exchange, appstate, util, messenger) {
    var dependencies = {}, model = $scope.model = {common : {}};

    function processPayslip (invoiceId) {
      $scope.TotalPaid = 0;
      $scope.TotalWithheld = 0;
      $scope.TotalNet = 0;

      $http.get('/getDataPaiement/',{params : {
            'invoiceId' : invoiceId
          }  
      }).
      success(function(data) {
        getPPConf();

        function getHollyDayCount(paiement_period_confs) {
          var defer = $q.defer();
          var som = 0;
          
          $http.get('/getCheckHollyday/',{params : {
              'dateFrom' : util.sqlDate(data[0].dateFrom), 
              'dateTo' : util.sqlDate(data[0].dateTo),
              'employee_id' : data[0].employee_id,
              'line' : ''
            }
          }).
          success(function(res) {
            var hollydays = res;
            $scope.dataHollydays = hollydays;
            if(hollydays.length) {
              var soms = [];
              hollydays.forEach(function (h) {
                var nb = 0;


                function getValue (ppc) {
                  //paiement period config === ppc
                  var date_pweekfrom = new Date(ppc.weekFrom);
                  var date_pweekto = new Date(ppc.weekTo);

                  var date_hdatefrom = new Date(h.dateFrom);
                  var date_hdateto = new Date(h.dateTo);

                  var num_pweekfrom = date_pweekfrom.setHours(0,0,0,0);
                  var num_pweekto = date_pweekto.setHours(0,0,0,0);

                  var num_hdatefrom = date_hdatefrom.setHours(0,0,0,0);            
                  var num_hdateto = date_hdateto.setHours(0,0,0,0);

                  var minus_right = 0, minus_left = 0;

                  if(num_pweekto > num_hdateto){
                    //minus_right = date_pweekto.getDate() - date_hdateto.getDate();
                    minus_right = num_pweekto - num_hdateto;
                    minus_right /= (24*3600*1000);
                    minus_right = parseInt(minus_right);
                  }

                  if(num_pweekfrom < num_hdatefrom){
                    //minus_left = date_hdatefrom.getDate() - date_pweekfrom.getDate();
                    minus_left = num_hdatefrom - num_pweekfrom;
                    minus_left /= (24*3600*1000);
                    minus_left = parseInt(minus_left);                    
                  }

                  var nbOffDaysPos = 0; 
                  for(var i = 0; i < $scope.OffDaysData.length; i++){
                    var dateOff = new Date($scope.OffDaysData[i].date);
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

                paiement_period_confs.forEach(function (ppc) {
                  nb += getValue(ppc);
                  
                });
                h.nbJour = nb; 

                var dailyRate = data[0].basic_salary / $scope.max_day;
                h.dailyHollyd = dailyRate * (h.percentage /100); 
                h.somHolly = h.dailyHollyd * h.nbJour;
                $scope.TotalPaid += h.somHolly;
                $scope.TotalNet += h.somHolly;
                
                soms.push(nb);
              });

              som = soms.reduce(function (x, y){
                return x+y;
              }, 0);

               
              //$scope.total_day = data[0].working_day + som;
              $scope.total_day = data[0].working_day;

              if($scope.max_day > 0){

                data[0].basic_salary = exchange(
                                data[0].basic_salary,
                                data[0].currency_id,
                                util.sqlDate(new Date())
                              );
                $scope.daly_rate = data[0].basic_salary / $scope.max_day;
                

                $scope.amont_payable = $scope.daly_rate * $scope.total_day; 
                $scope.TotalPaid += $scope.amont_payable;
                $scope.TotalNet += $scope.amont_payable;
              } else {
                $scope.daly_rate = 0;
                $scope.amont_payable = 0; 
              }

              defer.resolve(som); 
            }else{
              $scope.total_day = data[0].working_day;

              if($scope.max_day > 0){

                data[0].basic_salary = exchange(
                                data[0].basic_salary,
                                data[0].currency_id,
                                util.sqlDate(new Date())
                              );

                $scope.daly_rate = data[0].basic_salary / $scope.max_day;
                $scope.amont_payable = $scope.daly_rate * $scope.total_day; 
                $scope.TotalPaid += $scope.amont_payable;
                $scope.TotalNet += $scope.amont_payable;
              } else {
                $scope.daly_rate = 0;
                $scope.amont_payable = 0; 
              }
              defer.resolve(0);
            }               
          });
          return defer.promise;
        }        

        function getOffDayCount() {          
          dependencies.offDays = {
            query : {
              tables : {
                'offday' : {
                  columns : ['id', 'label', 'date', 'percent_pay']
                }
              },
              where : ['offday.date>=' + util.sqlDate(data[0].dateFrom), 'AND', 'offday.date<=' + util.sqlDate(data[0].dateTo)]
            }
          };  

          validate.process(dependencies, ['offDays'])
          .then(function (model) {
            $scope.nbOffDays = model.offDays.data.length;
            $scope.OffDaysData = model.offDays.data;
          });
        }



        function getOffDay() {        
          
          dependencies.offDays = {
            query : {
              tables : {
                'offday' : {
                  columns : ['id', 'label', 'date', 'percent_pay']
                }
              },
              where : ['offday.date>=' + util.sqlDate(data[0].dateFrom), 'AND', 'offday.date<=' + util.sqlDate(data[0].dateTo)]
            }
          };  

          validate.process(dependencies, ['offDays'])
          .then(function (model) {
            $scope.dataOffDays = model.offDays;
            for(var i = 0; i < model.offDays.data.length; i++){

              model.offDays.data[i].rate_offDay = (model.offDays.data[i].percent_pay) * ($scope.daly_rate / 100);
              $scope.TotalPaid += model.offDays.data[i].rate_offDay;
              $scope.TotalNet += model.offDays.data[i].rate_offDay;
            }

          });
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
              where : ['config_paiement_period.paiement_period_id=' + data[0].paiement_period_id]
            }
          };

          validate.process(dependencies, ['paiement_period_conf'])
          .then(function (model) {
            var paiement_period_confs = model.paiement_period_conf.data;
            $scope.max_day = getMaxDays(paiement_period_confs);
            getOffDayCount(); 
            getHollyDayCount(paiement_period_confs);
            getOffDay(); 
          });
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
        $scope.dataPaiements = data;
      });

      $http.get('/getDataRubrics/',{params : {
            'invoiceId' : invoiceId
          }  
      }).
      success(function(data) {
        $scope.dataRubrics = data;
        data.forEach(function (item) {
          if(item.is_discount === 0){
            $scope.TotalPaid += item.value;
            item.valueP = item.value;
            item.valueR = 0;
            $scope.TotalNet += item.value;
          } else if(item.is_discount === 1){
            $scope.TotalWithheld += item.value;
            item.valueP = 0;
            item.valueR = item.value;
            $scope.TotalNet -= item.value;
          } 
          
        });  
        
      });

      $http.get('/getDataTaxes/',{params : {
            'invoiceId' : invoiceId
          }  
      }).
      success(function(data) {
        $scope.dataTaxes = data;
        data.forEach(function (item) {
          $scope.TotalWithheld += item.value;
          $scope.TotalNet -= item.value;
        });
      });

    } 

    function promiseInvoiceId (invoiceId) {
      return $q.when(invoiceId);
    }

  	appstate.register('receipts.commonData', function (commonData) {
  		commonData.then(function (values) {
        model.common.location = values.location.data.pop();
        model.common.InvoiceId = values.invoiceId;
        model.common.enterprise = values.enterprise.data.pop();
        promiseInvoiceId(values.invoiceId)
        .then(processPayslip)
        .catch(function (err){
          messenger.danger('error', err);
        });
  		});     
    });    
  }
]);