// Controller.js
(function(angular) {
  'use strict'; 
  var controllers = angular.module('kpk.controllers', []);

//************************************************************************************
//******************************* TREE CONTROLLER ************************************
//************************************************************************************  
controllers.controller('treeController', function($scope, $q, $location, appcache, kpkConnect) {    
    var deferred = $q.defer();
    var result = getRoles();
    $scope.treeData = [];
    var cb = function(role, units){
      var element = {};
      element.label = role.name;
      element.id = role.id;
      element.children = [];

//      Set default element state
      element.collapsed = true;
//      console.log(appcache.checkDB());

      for(var i = 0; i<units.length; i++){
        element.children.push({"label":units[i].name, "id":units[i].id, "p_url":units[i].p_url, "children":[]});
      }
      $scope.treeData.push(element);

    };

    result.then(function(values){
      for(var i = 0; i<values.length; i++){
        getChildren(values[i], cb);
      }
    });
 
    
    $scope.$watch('navtree.currentNode', function( newObj, oldObj ) {
        if( $scope.navtree && angular.isObject($scope.navtree.currentNode) ) {
            $location.path($scope.navtree.currentNode.p_url);
        }
    }, true);

    function getRoles(){
      var request = {}; 
      request.e = [{t : 'unit', c : ['id', 'name']}];
      request.c = [{t:'unit', cl:'parent', v:0, z:'='}];
      kpkConnect.get('/tree?',request).then(function(data) { 
        deferred.resolve(data);
      });
      return deferred.promise;
    }

    function getChildren(role, callback){
      var request = {}; 
      request.e = [{t : 'unit', c : ['id', 'name', 'url']}];
      request.c = [{t:'unit', cl:'parent', v:role.id, z:'='}];
      kpkConnect.get('/tree?',request).then(function(data) {
          callback(role, data); 
        
      });

    };

});

//***********************************************************************************
//********************** UTIL CONTROLLER ********************************************
//***********************************************************************************
 
controllers.controller('utilController', function($rootScope, $scope, $q, $translate, kpkConnect, appstate, kpkUtilitaire) { 
  /////
  // summary: 
  //  Responsible for all utilities (buttons/ selects etc.) on the application side bar
  //  
  // TODO 
  //  -All operations on models should be local, and then exposed to scope
  //  -Should use connect instead of kpkConnect (soon to be deleted)
  /////

  $scope.toggleTranslate = function toggleTranslate(key) { 

    $translate.uses(key);
  }
  /*$scope.enterprise_model = {};
  $scope.fiscal_model = {};
  $scope.period_model = {};
  $scope.p_select = {};

  var resp = fillEntrepriseSelect();

  //FIXME Errors are thrown if no fiscal years are assigned to an enterprise, this should be handled
  //TODO period is used very rarely, probably doesn't need a selection on the application
  resp
  .then(function(enterprise_id) {
    return fillFiscalSelect(enterprise_id);
  })
  .then(function(fiscal_id) {
    fillPeriod(fiscal_id);
  });

  //remplissage selects

  function fillPeriod(fiscal_id){
    var req_db = {};
    req_db.e = [{t:'period', c:['id', 'period_start', 'period_stop']}];
    req_db.c = [{t:'period', cl:'fiscal_year_id', z:'=', v:fiscal_id}];
    kpkConnect.get('/data/?',req_db).then(function(data){
      for(var i = 0; i<data.length; i++){
        data[i].period_start = kpkUtilitaire.formatDate(data[i].period_start);
        data[i].period_stop = kpkUtilitaire.formatDate(data[i].period_stop);
      }
      $scope.period_model = data;
      $scope.p_select = $scope.period_model[0];
    });
  }
    //debut functions
  $scope.select = function(id) {
  };
  function fillEntrepriseSelect(){
    var deferred = $q.defer();
    var req_db = {};
    req_db.e = [{t:'enterprise', c:['id', 'name', 'region']}];
    kpkConnect.get('/data/?', req_db).then(function(data){
      $scope.enterprise_model = data;
      $scope.e_select = $scope.enterprise_model[1]; //Select default enterprise (should be taken from appcache if multiple enterprises are used)
      deferred.resolve($scope.e_select.id);
    });
    return deferred.promise;
  }

  function fillFiscalSelect(enterprise_id){
    var deferred = $q.defer();
    var req_db = {};
    req_db.e = [{t:'fiscal_year', c:['id', 'fiscal_year_txt']}];
    req_db.c = [{t:'fiscal_year', cl:'enterprise_id', z:'=', v:enterprise_id}];
    kpkConnect.get('/data/?',req_db).then(function(data){
      $scope.fiscal_model = data;
      $scope.f_select = $scope.fiscal_model[0];
      deferred.resolve($scope.f_select.id);
    });
    return deferred.promise;
  }
    //fin remplissage selects

  $scope.$watch('e_select', function(nval, oval) {
    if(nval){
      appstate.update('enterprise', nval);
      fillFiscalSelect(nval.id);
    }
  });

  $scope.$watch('f_select', function(nval, oval) {
    if(nval){
      appstate.update('fiscal', nval);
      fillPeriod(nval.id);
    }
  });

  $scope.$watch('p_select', function(nval, oval) {
    appstate.update('period', nval);
  });*/
});



  //Logout button logic - page currently being viewed can be saved
controllers.controller('appController', function($scope, $location, appcache) { 
    console.log("Application controller fired");

    var url = $location.url();


    console.log("url", url);

    //Assuming initial page load
    if (url === '') {
      //only navigate to cached page if no page was requested
      appcache.getNav().then(function(res) {
        if(res) {
          $location.path(res);
        }
      });
    }
    
    //Log URL changes and cache locations - for @jniles
    $scope.$on('$locationChangeStart', function(e, n_url) { 
      //Split url target - needs to be more general to allow for multiple routes?
      var target = n_url.split('/#')[1];
      if(target) appcache.cacheNav(target);
    });
});

controllers.controller('viewController', function($scope) { 
});

//***************************************************************************************
//***************************** CREDITORS CONTROLLER ************************************
//***************************************************************************************

controllers.controller('creditorsController', function($scope, $q, $modal, kpkConnect){

  //initialisations
  $scope.creditor={};
  $scope.creditorExiste = 0;
  
  //populating creditors
  getCreditors();

  //populating group
  getGroups();

  //populating location
  getLocations();

  //les fonctions
  function getCreditors(){
    var req_db = {};

    req_db.e = [{t:'supplier', c:['id', 'name', 'address_1', 'address_2', 'location_id', 'creditor_id', 'email', 'fax', 'note', 'phone', 'international', 'locked']}];
    kpkConnect.get('/data/?', req_db).then(function(data){
      $scope.creditors = data;
    });
  }
  function getGroups(){
    var req_db = {};
    req_db.e = [{t:'creditor_group', c:['id', 'group_txt', 'account_id']}];
    kpkConnect.get('/data/?', req_db).then(function(data){
      $scope.groups = data;
    });
  }

  function getLocations(){
    var req_db = {};

    req_db.e = [{t:'location', c:['id', 'city', 'region']}];
    kpkConnect.get('/data/?', req_db).then(function(data){
      $scope.locations = data;
    });
  }

  $scope.showDialog = function() {
    var instance = $modal.open({
    templateUrl: "/partials/creditor/creditor-modal.html",
    backdrop: true,
    controller: function($scope, $modalInstance, selectedAcc, kpkConnect) {
      $scope.group = {};
      //populating accounts
      getAccounts();
      function getAccounts(){
        var req_db = {};
        req_db.e = [{t:'account', c:['id', 'account_number', 'account_txt']}];
        req_db.c = [{t:'account', cl:'locked', z:'=', v:0, l:'AND'}, {t:'account', cl:'account_number', z:'>=', v:400000, l:'AND'}, {t:'account', cl:'account_number', z:'<', v:500000}];
        kpkConnect.get('/data/?', req_db).then(function(data){
          $scope.accounts = data;
        });
      }       
        
      $scope.close = function() {
        $modalInstance.dismiss();
      };
      $scope.submit = function() {
        $modalInstance.close({group:$scope.group.group, account:$scope.group.account_id});
      };
    },
    resolve: {
      selectedAcc: function() {
        return 'hello';
      },
    }
    });
    instance.result.then(function(values) {
      kpkConnect.send('creditor_group', [{id:'', group_txt:values.group, account_id:values.account.id}]);
      getGroups();
    }, function() {
      //console.log('dedrick');
    });
  };

  $scope.verifyExisting = function(){
   if($scope.creditorExiste ==0){
       if($scope.creditor.name){
        if(isThere($scope.creditors, 'name', $scope.creditor.name)){
          var req_db = {};
          req_db.e = [{t:'supplier', c:['id', 'name', 'address_1', 'address_2', 'location_id', 'creditor_id', 'email', 'fax', 'note', 'phone', 'international', 'locked']}];
          req_db.c = [{t:'supplier', cl:'name', z:'=', v:$scope.creditor.name}];
          kpkConnect.get('/data/?', req_db).then(function(data){
           if(data.length>0){
            var id_promise = getCreditorGroupId(data[0].creditor_id);
            id_promise.then(function(value){
              $scope.creditor_group = getCreditorGroup(value.id);
            });
            data[0].location_id = getCreditorLocation(data[0].location_id);
            data[0].international = toBoolean(data[0].international);
            data[0].locked = toBoolean(data[0].locked);
            $scope.creditor = data[0];
            $scope.creditorExiste = 1;
           }        
          });
        }
      }
   }
  }

  $scope.fill = function(index){
    //getCreditors();
    $scope.creditorExiste = 0;
    $scope.creditor = $scope.creditors[index];
    $scope.creditor.international = toBoolean($scope.creditor.international);
    $scope.creditor.locked = toBoolean($scope.creditor.locked);
    $scope.creditor.location_id = getCreditorLocation($scope.creditors[index].location_id);
    var id_promise = getCreditorGroupId($scope.creditors[index].creditor_id);
    id_promise.then(function(value){
      $scope.creditor_group = getCreditorGroup(value.id);
    });
  }

  $scope.save = function(creditor, creditor_group){
    creditor.location_id = extractId(creditor.location_id);
    var creditor_group_id = extractId(creditor_group);
    var result = existe(creditor.id);
    result.then(function(response){
      if(response){             

        var sql_update = {t:'supplier', data:[creditor],pk:["id"]};
        kpkConnect.update(sql_update);
        $scope.creditor={};
        $scope.creditor_group = {};
        $scope.creditorExiste = 0;
        getCreditors();
      }else{
        //on insert
        var creditor_id_promise = getCreditorId(creditor_group_id);
        creditor_id_promise.then(function(value){
          creditor.creditor_id = value;
          kpkConnect.send('supplier', [creditor]);
        $scope.creditor={};
        $scope.creditor_group = {};
        $scope.creditorExiste = 0;
        getCreditors();
        });
      }
      
    });
  }

  function getCreditorId(id){
    var def = $q.defer();
    kpkConnect.send('creditor', [{id:'', creditor_group_id:id}]);
    var request = {}; 
    request.e = [{t : 'creditor', c : ['id']}];
    request.c = [{t:'creditor', cl:'id', v:'LAST_INSERT_ID()', z:'='}];
    kpkConnect.get('data/?',request).then(function(data) {
      console.log(data);
      def.resolve(data[0].id);

    });
    return def.promise;
  }

  function existe(id){
    var def = $q.defer();
    if(id){
      var request = {}; 
      request.e = [{t : 'creditor', c : ['id']}];
      request.c = [{t:'creditor', cl:'id', v:id, z:'='}];
      kpkConnect.get('data/?',request).then(function(data) {
       (data.length > 0)?def.resolve(true):def.resolve(false);    
      });
    }else{
      def.resolve(false);
    }
    return def.promise;
  }

  function toBoolean(number){
    return number>0;
  }

  function extractId(obj){
    return obj.id;
  }

  function getCreditorLocation(idLocation){
    var indice = -1;
    for(var i = 0; i<$scope.locations.length; i++){
      if($scope.locations[i].id == idLocation){
        indice = i;
        break;
      }
    }
    if (indice!=-1){
      return $scope.locations[indice];
    }else{
      return {};
    }
  }

  function getCreditorGroup(idGroup){
    var indice = -1;
    for(var i = 0; i<$scope.groups.length; i++){
      if($scope.groups[i].id == idGroup){
        indice = i;
        break;
      }
    }
    if (indice!=-1){
      return $scope.groups[indice];
    }else{
      return {};
    }
  }

  function getCreditorGroupId(idCreditor){
    var def = $q.defer();    
    var req_db = {};
    req_db.e = [{t:'creditor', c:['creditor_group_id']}];
    req_db.c = [{t:'creditor', cl:'id', z:'=', v:idCreditor}];
    kpkConnect.get('/data/?', req_db).then(function(data){
      var groupID = data[0].creditor_group_id;
      req_db.e = [{t:'creditor_group', c:['id']}];
      req_db.c = [{t:'creditor_group', cl:'id', z:'=', v:groupID}];
      kpkConnect.get('/data/?', req_db).then(function(data){
      def.resolve(data[0]);
      });
    });
    return def.promise;
  }

  function isThere(jsontab, cle, value){
    var indice = -1;
    for(var i = 0; i<jsontab.length; i++){
      if(jsontab[i][cle] == value){
        indice = i;
        break;
      }
    }
    if (indice!=-1){
      return true;
    }else{
      return false;
    }
  }

  $scope.delete = function(creditor){

    kpkConnect.delete('supplier', creditor.id);
    $scope.creditor = {};
    getCreditors();
  }
 });

controllers.controller('notifyController', function($scope, $q, appnotify) {
  /*summary
  *   Displays the model for any notification pushed to the appnotify service
  */
  console.log("notify controller initialised");

//  Notify controller must watch the model from the service and display accordingly
  $scope.notification = appnotify.notification;
  $scope.style = appnotify.style[0];

  $scope.removeNotification = function() {
//    Would need to remove with ID for multiple notifications
    appnotify.clearAll();
  }

});

controllers.controller('purchaseOrderController', function($scope, $q, connect, appstate, appnotify) {
  console.log("Inventory invoice initialised");

//  FIXME There is a lot of duplicated code for salesController - is there a better way to do this?
//  FIXME Resetting the form maintains the old invoice ID - this causes a unique ID error, resolve this
  $scope.sale_date = getDate();
  $scope.inventory = [];

  $scope.process = ["PO", "QUOTE"];
  $scope.current_process = $scope.process[0];

  $scope.purchase_order = {payable: "false"};

  var inventory_query = {
    'tables' : {
      'inventory' : {
        'columns' : [
          'id',
          'code',
          'text',
          'price',
          'type_id'
        ]
      }
    },
    'where' : [
      'inventory.type_id=0'
    ]
  }
  var inventory_request = connect.req(inventory_query);


  var max_sales_request = connect.basicGet('/max/id/sale');
  var max_purchase_request = connect.basicGet('/max/id/purchase');

  var creditor_query = {
    'e' : [{
      t : 'supplier',
      c : ['id', 'name', 'location_id', 'creditor_id']
    }, {
      t : 'location',
      c : ['city', 'region', 'country_id']
    }],
    'jc' : [{
      ts : ['location', 'supplier'],
      c : [ 'id', 'location_id']
    }]
  };

  var creditor_request = connect.basicReq(creditor_query);
  var user_request = connect.basicGet("user_session");

  function init() {

    $scope.inventory = [];
    $scope.purchase_order.payable = "false";
    $scope.creditor = "";

    $q.all([
      inventory_request,
      // sales_request,
      // purchase_request,
      max_sales_request,
      max_purchase_request,
      creditor_request,
      user_request

    ]).then(function(a) {
      $scope.inventory_model = a[0];
      $scope.max_sales = a[1].data.max;
      $scope.max_purchase = a[2].data.max;
      $scope.creditor_model = a[3];
      $scope.verify = a[4].data.id;

//      Raw hacks - #sorry, these might be the same entity anyway
      var id = Math.max($scope.max_sales, $scope.max_purchase);
      $scope.invoice_id = createId(id);
    });
  }

  function getDate() {
    //Format the current date according to RFC3339 (for HTML input[type=="date"])
    var now = new Date();
    return now.getFullYear() + "-" + (now.getMonth() + 1) + "-" + ('0' + now.getDate()).slice(-2);
  }

  function createId(current) {
    /*
    *summary 
    *  Format and increment according to transaction ID format
    */
    var default_id = 100000;
    if(!current) return default_id;
    return current+1;
  }

  function formatInvoice() {
    var t = 0;
    for(var i= 0, l = $scope.inventory.length; i < l; i++) {
      t += $scope.inventory[i].quantity * $scope.inventory[i].price;
    }
//    verify total

    var format = {
      enterprise_id : appstate.get("enterprise").id, //Not async safe - may return null
      id : $scope.invoice_id,
      cost : t,
      currency_id : 1, // FIXME
      creditor_id : $scope.creditor.id,
      invoice_date : $scope.sale_date,
      purchaser_id : $scope.verify,
      note : $scope.formatText(),
      posted : '0'
    };
//    verify format
    return format;
  }

  function generateItems() {
    var deferred = $q.defer();
    var promise_arr = [];

    //iterate through invoice items and create an entry to sale_item
    $scope.inventory.forEach(function(item) {
      var format_item = {
        purchase_id : $scope.invoice_id,
        inventory_id : item.item.id,
        quantity : item.quantity,
        unit_price : item.price,
        total : item.quantity * item.price
      };
      console.log("Generating sale item for ", item);

      promise_arr.push(connect.basicPut('purchase_item', [format_item]));
    });

    $q.all(promise_arr).then(function(res) { deferred.resolve(res)});
    return deferred.promise;
  }

  $scope.submitPurchase = function() {
    var purchase = formatInvoice();

    console.log("Posting", purchase, "to 'purchase table");

    connect.basicPut('purchase', [purchase])
      .then(function(res) {
        if(res.status==200) {
          var promise = generateItems();
          promise
            .then(function(res) {
              console.log("Purchase order successfully generated", res);
              connect.journal([{id:$scope.invoice_id, transaction_type:3, user:1}]); //just for the test, send data to the journal traget server-side
//              Navigate to Purchase Order review || Reset form
//              Reset form
                init();

            });
        }
      });
  }

  $scope.updateItem = function(item) {

    if(item.item) {
      if(!item.quantity) item.quantity = 1;
      item.text = item.item.text;
      item.price = item.item.price;
    } else {
//      Reset
      item.text = "";
      item.price = "";
      item.quantity = "";
    }
  }

  $scope.updateInventory = function() {
    $scope.inventory.push({});
  }

  $scope.formatText = function() {
//      FIXME String functions within digest will take hours and years
    var c = "PO " + $scope.invoice_id + "/" + $scope.sale_date;
    if($scope.creditor) c += "/" + $scope.creditor.name + "/";
    return c;
  }



//  Radio inputs only accept string true/false? boolean value as payable doesn't work
  $scope.isPayable = function() {
    if($scope.purchase_order.payable=="true") return true;
    return false;
  };

  // FIXME Again - evaluated every digest, this is a bad thing
  $scope.invoiceTotal = function() {
    var total = 0;
    $scope.inventory.forEach(function(item) {
      if(item.quantity && item.price) {
        //FIXME this could probably be calculated less somewhere else (only when they change)
        total += (item.quantity * item.price);
      }
    });
    return total;
  }

  $scope.itemsInInv = function() {
    if($scope.inventory.length>0) return true;
    return false;
  }

  $scope.select = function(index) {
    $scope.current_process = $scope.process[index];
  }

  $scope.formatCreditor = function(creditor) {
    return creditor.name;
  }

  init();


});


controllers.controller('priceListController', function ($scope, $q, connect, appstate) {
  var pln, pl, grp, inv, eid, models, validate, stores, dirty, flags, dependencies, changes;

  // FIXME: Eventually move away form this method of getting enterprise id
  // so that we can refresh when the enterprise changes
  eid = appstate.get('enterprise').id;

  // price list names
  pln = {
    tables: { 'price_list_name' : { columns :  ["id", "name"] }},
    where : ["price_list_name.enterprise_id="+eid]
  };

  // inventory
  inv = {
    tables : { 'inventory' : { columns: ["id", "code", "text"] }} 
  };
  
  // inventory group
  grp = { 
    tables : { 'inv_group' : { columns: ["id", "name", "symbol"] }}
  };

  // price list 
  pl = {
    tables: { 'price_list' : { columns : ["id", "list_id", "inventory_id", "price", "discount", "note"] }},
    where : []
  };

  // initialize models
  models       = $scope.models = {};
  flags        = $scope.flags  = {};
  dirty        = $scope.dirty  = {};
  validate     = $scope.validate = {};
  flags.edit   = {};
  flags.errors = {};
  stores       = {};
  dependencies = ["plnames", "inv", "grp"];

  $q.all([
    connect.req(pln),
    connect.req(inv),
    connect.req(grp)
  ]).then(function (arr) {
    // load dependencies
    for (var i = arr.length - 1; i >= 0; i--) {
      models[dependencies[i]] = arr[i].data;
      stores[dependencies[i]] = arr[i];
    }
    flags.edit.list = Infinity;
  });

  // List controls

  // create a new price list
  $scope.addList = function () {
    var id, list;
    id = stores.plnames.generateid();
    list = {id: id};
    stores.plnames.put(list);
    // after creating, immediately edit
    $scope.editList(id);
  };

  // validate and save
  $scope.saveList = function () {
    var id = flags.edit.list;
    var list = stores.plnames.get(id);
    if (!validate.list(list)) stores.plnames.delete(id);
    else {
      list.enterprise_id = eid;
      connect.basicPut('price_list_name', [list]);
    }
    flags.edit.list = Infinity;
  };

  // edit a list
  $scope.editList = function (id) {
     flags.edit.list = id;
  };

  // load a specific price list
  $scope.loadList = function (id) {
    if (flags.edit.list === Infinity) {
      console.log("loading list");
      pl.where = ["price_list.list_id=" + id];
      connect.req(pl).then(function (res) {
        models.pl = res.data;
        stores.pl = res;
      });
      flags.list = id;
      flags.add = true;
    }
  };

  // Item controls
  
  // remove an item from the price list
  $scope.removeItem = function (id) {
    flags.add = true;
    stores.pl.delete(id);
  };

  // add an item to the price list
  $scope.addItem = function () {
    var id = stores.pl.generateid();
    stores.pl.put({id: id, list_id: flags.list});
    $scope.editItem(id);
  };
 
  // edit an item in the price list 
  $scope.editItem = function (id) {
    flags.edit.item = id;
    flags.add = false;
  };

  // label the inventory properly
  $scope.label = function (invid) {
    // sometimes it is not defined
    var item = invid ? stores.inv.get(invid) : {};
    return (item && item.text) ? item.text : "";
  };

  // validate and exit editing
  $scope.saveEdit = function () {
    var item = stores.pl.get(flags.edit.item);
    if (validate.item(item)) { 
      flags.edit.item = Infinity; 
      flags.add = true;
    }
  };

  // filter controls
  $scope.filter = function (id) {
    flags.filter = id >= 0 ? stores.grp.get(id).symbol : "";
    refreshInventory();
  };

  function refreshInventory () {
    var inv = { tables : { 'inventory' : { columns: ["id", "code", "text"] }}};
    if (flags.filter) {
      inv.where = ["inventory.group_id="+flags.filter];
    }
    connect.req(inv).then(function (res) {
      models.inv = res.data;
      stores.inv = res;
    });
  }

  // validation

  // validate item
  validate.item = function (item) {
    // an item must have ether a price or a 
    // discount, but not both
    var bool = !!item.id && !!item.inventory_id && ((!!item.price || !!item.discount) && !(!!item.price && !!item.discount));
    return bool;
  };

  validate.list = function (list) {
    // a list must have all fields filled out
    var bool = !!list.id && !!list.name;
    return bool;
  };

  // form controls

  $scope.save = function () {
    // TODO: do all this with connect
    // stores
    function clean (obj) {
      var cln = {};
      for (var k in obj) {
        if (k !== "hashkey") {
          cln[k] = obj[k]; 
        } 
      }
      return cln;
    }

    var data = models.pl.map(clean);
    console.log("saving:", data);
    connect.basicPut('price_list', data);
  };

  $scope.erase = function () {
    // TODO: add a user warning before doing this..
    models.pl.forEach(function (i) {
      stores.pl.delete(i.id); 
    });
  };

});


controllers.controller('exchangeRateController', function ($scope, connect) {
  var currency;

  currency = {
    tables : {
      'currency' : {
        columns: ["id", "name", "symbol", "note", "current_rate", "last_rate", "updated"]
      }
    }
  };

  var model, store, from, to;
  from = $scope.from = {};
  to = $scope.to = {};
  $scope.form = {};
  connect.req(currency).then(function (response) {
    store = response;
    $scope.currencies = response.data;
    to.data = angular.copy(response.data);
    from.data = angular.copy(response.data);
  });

  $scope.filter = function (v) {
    return v.id !== from.currency_id;
  };
  
  $scope.updateTo = function () {
    to.symbol = store.get(to.currency_id).symbol;
  };

  $scope.updateFrom = function () {
    from.symbol = store.get(from.currency_id).symbol;
  };

  $scope.getToSymbol = function () {
    var data = (store && store.get(from.currency_id)) ? store.get(from.currency_id) : {};
    return (data.id === to.currency_id) ? "" : to.symbol; 
  };
  
  $scope.submit = function () {
    // transform to MySQL date
    var date = new Date();
    var updated = date.getFullYear() + '-' + date.getMonth() + '-' + date.getDay();
    var data = {
      id: from.currency_id,
      current_rate: from.current_rate,
      last_rate : store.get(from.currency_id).current_rate,
      updated: updated 
    };
    connect.basicPost('currency', [data], ['id']);
  };

  $scope.valid = function () {
    // OMG
    return !(!!to.currency_id && !!from.currency_id && !!from.current_rate);
  };

  $scope.label = function (curr) {
    return [curr.symbol, '|', curr.name].join(' '); 
  };

});

controllers.controller('createAccountController', function($scope, $q, connect) { 
  console.log("createAccountController initialised");

  $scope.model = {};
  $scope.model['accounts'] = {'data' : []};

//  Request
  var account_request = {
    'tables' : {
      'account' : {
        'columns' : ["id", "account_txt", "account_type_id", "fixed"]
      }
    }
  }

  //  grid options
  var grid;
  var dataview;
  var sort_column = "id";
  var columns = [
    {id: 'id', name: 'No.', field: 'id', sortable: true, maxWidth: 80},
    {id: 'account_txt', name: 'Text', field: 'account_txt'},
    {id: 'account_type_id', name: 'Type', field: 'account_type_id', maxWidth: 60},
    {id: 'fixed', name: 'Fixed', field: 'fixed', maxWidth: 60}
  ];
  var options = {
    enableCellNavigation: true,
    enableColumnReorder: true,
    forceFitColumns: true,
    /*Bootstrap style row height*/
    rowHeight: 30
  };

  function init() { 

    connect.req(account_request).then(function(res) { 
      $scope.model['accounts'] = res;
      console.log($scope.model['accounts'].data);
      grid = new Slick.Grid('#account_grid', $scope.model['accounts'].data, columns, options);
    })
  }

  init();
});

})(angular);
