// app/js/services/services.js

(function (angular) {
  'use strict';

  var services = angular.module('kpk.services', []);
  
  services.service('kpkUtilitaire', function() {

    this.formatDate = function(dateString) {
      return new Date(dateString).toDateString();
    };

    this.convertToMysqlDate = function (dateParam) {
      var date = new Date(dateParam),
        annee,
        mois,
        jour;
      annee = String(date.getFullYear());
      mois = String(date.getMonth() + 1);
      if (mois.length === 1) {
        mois = "0" + mois;
      }

      jour = String(date.getDate());
      if (jour.length === 1) {
        jour = "0" + jour;
      }
      return annee + "-" + mois + "-" + jour;
    };

    this.isDateAfter = function(date1, date2){
      date1 = new Date(date1).setHours(0,0,0,0);
      date2 = new Date(date2).setHours(0,0,0,0);
      return date1 > date2;
    };

    this.areDatesEqual = function(date1, date2) {
      date1 = new Date(date1).setHours(0,0,0,0);
      date2 = new Date(date2).setHours(0,0,0,0);
      return date1 === date2;
    };

  });

  //TODO passing list and dependencies to everything, could assign to object?
  services.factory('validate', function($q, connect) {
    var modelLabel = 'model';

    var validateTests = [
      {flag: 'required', message : "Required data not found!", method : hasData}
    ];

    function refresh(dependencies, limit) {
      var list = limit || Object.keys(dependencies);
      
      list.forEach(function(modelKey) {
        dependencies[modelKey].processed = false;
      });
      return process(dependencies, limit);
    }

    function process(dependencies, limit) {
      var validate, deferred = $q.defer(), list = filterList((limit || Object.keys(dependencies)), dependencies);
      dependencies[modelLabel] = dependencies[modelLabel] || {};
    
      fetchModels(list, dependencies).then(function(model) {
        packageModels(list, dependencies, model);
        validate = validateModels(list, dependencies);
        console.log('ran tests', validate);
        if(validate.success) return deferred.resolve(dependencies.model);

        console.info("%c[validate]", "color: blue; font-weight: bold;", "Reminder that models have been tested and results should be handled");
        console.group("Validation results");
        console.log("Key Reference: '%s'", validate.reference);
        console.log("Flag Reference: '%s'", validate.flag);
        console.log("Passed: %s", validate.success);
        console.log("Message: '%s'", validate.message);
        console.groupEnd();
        deferred.reject(validate);

      }, function(error) { deferred.reject(error); });

      return deferred.promise;
    }
  
    function filterList(list, dependencies) {
      var filterList;

      filterList = list.filter(function(key, index) {
        if(dependencies[key].processed) return false; //processed requests
        if(key===modelLabel) return false; //model store
        return true;
      });
      return filterList;
    }

    function validateModels(list, dependencies) {
      var validateStatus = new Status();
    
      list.some(function(modelKey) {
        var model = dependencies.model[modelKey], details = dependencies[modelKey], modelTests = details.test || [], modelTestStatus = false;
      
        //Check for standard test flags
        validateTests.forEach(function(testObject) {
          if(details[testObject.flag]) modelTests.push(testObject);
        });
    
        //Run each test
        modelTestStatus = modelTests.some(function(testObject) {
          var testFailed, testMethod = testObject.method;
         
          testFailed = !testMethod(model.data);
          if(testFailed) validateStatus.setFailed(testObject, modelKey);
          return testFailed;
        });
        return modelTestStatus;
      });
      return validateStatus;
    }

    function packageModels(list, dependencies, model) {
      list.forEach(function(key, index) {
        dependencies.model[key] = model[index];
        dependencies[key].processed = true;
      });
    }

    function fetchModels(list, dependencies) {
      var deferred = $q.defer(), promiseList = [];
    
      list.forEach(function(key) {
        var dependency = dependencies[key], args = [dependency.query];
      
        //Hack to allow modelling reports with unique identifier - not properly supported by connect
        if(dependency.identifier) args.push(dependency.identifier);
        promiseList.push(connect.req.apply(connect.req, args));
      });
    
      $q.all(promiseList).then(function(populatedQuerry) {
        deferred.resolve(populatedQuerry);
      }, function(error) {
        deferred.reject(error);
      });
      return deferred.promise;
    }

    var testSuite = {
      "enterprise" : {method: testRequiredModel, args: ["enterprise"], result: null},
      "fiscal" : {method: testRequiredModel, args: ["fiscal_year"], result: null}
    };
  
    function testRequiredModel(tableName, primaryKey) {
      var deferred = $q.defer();
      var testDataQuery = {
        tables : {}
      };

      primaryKey = (primaryKey || "id");
      testDataQuery.tables[tableName] = {
        columns: [primaryKey]
      };

      //download data to test
      connect.req(testDataQuery)
      .then(function(res) {
      
        //run test on data
        deferred.resolve(isNotEmpty(res.data));
      }, function(err) {
      
        //download failed
        deferred.reject();
      });
      return deferred.promise;
    }

    function hasData(modelData) {
      return (modelData.length > 0);
    }

    function Status() {
    
      function setFailed(testObject, reference) {
        this.success = false;
        this.message = testObject.message;
        this.flag = testObject.flag;
        this.reference = reference;
      }

      this.setFailed = setFailed;
      this.success = true;
      this.validModelError = true;
      this.message = null;
      this.reference = null;
      this.flag = null;

      return this;
    }

    return {
      process : process,
      refresh : refresh
    };
  });

  services.factory('appcache', function ($rootScope, $q) {
    var DB_NAME = "kpk", VERSION = 21;
    var db, cacheSupported, dbdefer = $q.defer();

    function cacheInstance(namespace) {
      if(!namespace) throw new Error('Cannot register cache instance without namespace');
      return {
        namespace: namespace,
        fetch: fetch,
        fetchAll: fetchAll,
        put: put
      };
    }

    function init() {
      //also sets db - working on making it read better
      openDBConnection(DB_NAME, VERSION)
      .then(function(connectionSuccess) {
        dbdefer.resolve();
      }, function(error) {
        throw new Error(error);
      });
    }

    //generic request method allow all calls to be queued if the database is not initialised
    function request(method) {
      console.log(method, arguments);
      if(!requestMap[method]) return false;
      requestMap[method](value);
    }

    //TODO This isn't readable, try common request (queue) method with accessor methods
    function fetch(key) {
      var t = this, namespace = t.namespace;
      var deferred = $q.defer();
      dbdefer.promise
      .then(function() {
        //fetch logic
        var transaction = db.transaction(['master'], "readwrite");
        var objectStore = transaction.objectStore('master');
        var request = objectStore.index('namespace, key').get([namespace, key]);
      
        request.onsuccess = function(event) {
          var result = event.target.result;
          $rootScope.$apply(deferred.resolve(result));
        };
        request.onerror = function(event) {
          $rootScope.$apply(deferred.reject(event));
        };
      });
      return deferred.promise;
    }

    function put(key, value) {
      var t = this, namespace = t.namespace;
      var deferred = $q.defer();
    
      dbdefer.promise
      .then(function() {
        var writeObject = {
          namespace: namespace,
          key: key
        }
        var transaction = db.transaction(['master'], "readwrite");
        var objectStore = transaction.objectStore('master');
        var request;
     
        //TODO jQuery dependency - write simple utility to flatten/ merge object
        writeObject = jQuery.extend(writeObject, value);
        request = objectStore.put(writeObject);

        request.onsuccess = function(event) {
          deferred.resolve(event);
        }
        request.onerror = function(event) {
          deferred.reject(event);
        }
      });
      return deferred.promise;
    }

    function fetchAll() {
      var t = this, namespace = t.namespace;
      var deferred = $q.defer();

      dbdefer.promise
      .then(function() {
        var store = [];
        var transaction = db.transaction(['master'], 'readwrite');
        var objectStore = transaction.objectStore('master');
        var request = objectStore.index('namespace').openCursor(namespace);

        request.onsuccess = function(event) {
          var cursor = event.target.result;
          if(cursor) {
            store.push(cursor.value);
            cursor.continue();
          } else {
            $rootScope.$apply(deferred.resolve(store));
          }
        }

        request.onerror = function(event) {
          deferred.reject(event);
        }
      });
      return deferred.promise;
    }

    function openDBConnection(dbname, dbversion) {
      var deferred = $q.defer();
      var request = indexedDB.open(dbname, dbversion);
      request.onupgradeneeded = function(event) {
        db = event.target.result;
        //TODO naive implementation - one object store to contain all cached data, namespaced with feild
        //TODO possible implementation - create new object store for every module, maintain list of registered modules in master table
     
        //delete object store if it exists - DEVELOPMENT ONLY
        if(db.objectStoreNames.contains('master')) {
          //FIXME no error/ success handling
          db.deleteObjectStore('master');
        }
        var objectStore = db.createObjectStore("master", {keyPath: ['namespace', 'key']});
        objectStore.createIndex("namespace, key", ["namespace", "key"], {unique: true});
        objectStore.createIndex("namespace", "namespace", {unique: false});
        objectStore.createIndex("key", "key", {unique: false});
      };

      request.onsuccess = function(event) {
        db = request.result;
        $rootScope.$apply(deferred.resolve());
      };
      request.onerror = function(event) {
        deferred.reject(event);
      };
      return deferred.promise;
    }

    cacheSupported = ("indexedDB" in window);
    if(cacheSupported) {
      init();
    } else {
      console.log('application cache is not supported in this context');
    }
    return cacheInstance;
  });

  services.factory('appstate', function ($q, $rootScope) {
    //TODO Use promise structure over callbacks, used throughout the application and enables error handling
    var store = {}, queue = {};

    function set(storeKey, value) {
      store[storeKey] = value;
      executeQueue(storeKey);
    }

    function get(storeKey) {
      return store[storeKey];
    }

    function register(storeKey, callback) {
      var requestedValue = store[storeKey];
      var queueReference = queue[storeKey] = queue[storeKey] || [];

      if(requestedValue) {
        callback(requestedValue);
        return;
      }
      queueReference.push({callback: callback});
    }

    function executeQueue(storeKey) {
      var queueReference = queue[storeKey];
      if(queueReference) {
        queueReference.forEach(function(pendingRequest) {
          pendingRequest.callback(store[storeKey]);
        });
      }
    }

    return {
      get : get,
      set : set,
      register : register
    };
  });

  services.factory('store', function () {
    // store service
  
    return function (options, target) {
    
      // the data store, similar to Dojo's Memory Store.
      options = options || {};
      // globals
      this.index = {};
      this.data = {};

      // locals
      var queue = [];
      var identifier = options.identifier || 'id'; // id property
      var pprint = '[connect] ';
      var refreshrate = options.refreshrate || 500;

      // set an array of data
      this.setData = function (data) {
        var index = this.index = {};
        this.data = data;

        for (var i = 0, l = data.length; i < l; i += 1) {
          index[data[i][identifier]] = i;
        }
      };

      // constructor function
      var self = this;
      (function contructor () {
        for (var k in options) {
          self[k] = options[k];
        }
        // set data if it is defined
        if (options.data) self.setData(options.data);
        // set up refreshrate
      })();

      // get an item from the local store
      this.get = function (id) {
        return this.data[this.index[id]];
      };

      // put is for UPDATES
      this.put = function (object, opts) {      
        var data = this.data,
            index = this.index,
            id = object[identifier] = (opts && "id" in opts) ? opts.id : identifier in object ?  object[identifier] : false;

        if (!id) throw pprint + 'No id property in the object.  Expected property: ' + identifier;

        // merge or overwrite
        if (opts && opts.overwrite) {
          data[index[id]] = object; // overwrite
        } else {
          var ref = data[index[id]];
          if(!ref) ref = {};
          for (var k in object) {
            ref[k] = object[k]; // merge
          }
        }
        // enqueue item for sync
        queue.push({method: 'PUT', url: '/data/'+ target});
      };

      // post is for INSERTS
      this.post = function (object, opts) {

        var data = this.data,
            index = this.index,
            id = object[identifier] = (opts && "id" in opts) ? opts.id : identifier in object ?  object[identifier] : Math.random();
        if (id in index) throw pprint + 'Attempted to overwrite data with id: ' + id + '.';
        index[id] = data.push(object) - 1;
        // enqueue item for sync
        queue.push({method: 'POST', url: '/data/' + target, data: object});
      };

      this.remove = function (id) {
        var data = this.data,
            index = this.index;
      
        if (id in index) {
          console.log("Trying to split on ",data);
          data.splice(index[id], 1);
          this.setData(data);
          queue.push({method: 'DELETE', url: '/data/' + target + '/' + id});
        }
      };

      this.generateid = function () {
        // generate a new id by incrimenting the last id
        // in the store
        var id = Math.max.apply(Math.max, Object.keys(this.index)) + 1;
        return (id > 0)  ? id : 1;
      };

      this.contains = function (id) {
        // check to see if an object with
        // this id exists in the store.
        return !!this.get(id);
      };

      this.sync = function () {
        // sync the data from the client to the server
        var fail = [];
        queue.forEach(function (req) {
          console.log(pprint, 'Executing: ', req);
          $http(req)
            .success(function () {
              console.log(req.data.id, "synced successfully.");
            })
            .error(function (data, status, headers, config) {
              alert("An error in data transferred occured with status:", status);
              fail.push(req);
            });
        });
        queue = fail;
      };

      this.recalculateIndex = function () {
        var data = this.data, index = this.index;
        for (var i = 0, l = data.length; i < l; i += 1) {
          index[data[i][identifier]] = i;
        }
      };

      return this;
    };
  });

  services.factory('connect', function ($http, $q, store) {
    //summary:
    //  provides an interface between angular modules (controllers) and a HTTP server. Requests are fetched, packaged and returned
    //  as 'models', objects with indexed data, get, delete, update and create functions, and access to the services scope to
    //  update the server.

    //  TODO generic id property should be injected, currently set as ID
    //  TODO set flag for automatically flushing model updates to server
    //  TODO anonymous functions make for bad stack traces - name those bad boys

    //keep track of requests, model can use connect API without re-stating request
    //  model : request
    var requests = {};

    //FIXME remove identifier without breaking functionality (passing direct strings to req)
    function req (defn, stringIdentifier) {
      //summary:
      //  Attempt at a more more managable API for modules requesting tables from the server, implementation finalized
      //
      //  defn should be an object like
      //  defn =  {
      //    tables : {
      //      'account' : {
      //        columns: [ 'enterprise_id', 'id', 'locked', 'account_text']
      //      },
      //      'account_type' : {
      //        columns: ['type']
      //      }
      //    },
      //    join: ['account.account_type_id=account_type.id'],
      //    where: ['account.enterprise_id=101']
      //  };
      //
      //  where conditions can also be specified:
      //    where: ['account.enterprise_id=101', 'AND', ['account.id<100', 'OR', 'account.id>110']]
      /*
      if (angular.isString(defn)) {
        // CLEAN THIS UP
        var d = $q.defer();
        $http.get(defn).then(function (returned) {
          returned.identifier = stringIdentifier || 'id';
          d.resolve(new store(returned));
        }, function (err) {
          throw err; // temporary
        });
        return d.promise;
      }
     */
      var handle, table, deferred = $q.defer();

      if (angular.isString(defn)) {
        $http.get(defn)
        .then(function (res) {
          res.identifier = stringIdentifier || 'id';
          deferred.resolve(new store(res));
        }, function (err) {
          throw err;
        });
        return deferred.promise;
      }

      table = defn.primary || Object.keys(defn.tables)[0];

      handle = $http.get('/data/?' + JSON.stringify(defn));
      handle.then(function (returned) {
      
        //massive hack so I can use an identifier - set default identifier
        returned.identifier = defn.identifier || 'id';
        var m = new store(returned, table);
        requests[m] = defn;
        deferred.resolve(m);
      }, function(err) {
        //package error object with request parameters for error routing
        deferred.reject(packageError(err, table));
      });

      return deferred.promise;
    }

    function getModel(getRequest, identifier) {
      //TODO Decide on API to handle packing direct GET requests in model
      var handle, deferred = $q.defer();
      handle = $http.get(getRequest);
      handle.then(function(res) {
        res.identifier = identifier || 'id';
        var m = new store(res, getRequest);
        deferred.resolve(m);
      });
      return deferred.promise;
    }

    function fetch (defn) {
      //summary:
      //  Exactly the same as req() but now returns only
      //  data.  Think of it as a `readonly` store.
      var handle, deferred = $q.defer();

      if (angular.isString(defn)) return $http.get(defn);

      handle = $http.get('/data/?' + JSON.stringify(defn));
      handle.then(function (returned) {
        deferred.resolve(returned.data);
      });
      return deferred.promise;
    }

    function debitorAgingPeriod(){
      console.warn('connect.debitorAgingPeriod is deprecated.  Refactor your code to use fetch() or req().');
      var handle, deferred = $q.defer();
      handle = $http.get('debitorAgingPeriod/');
      handle.then(function(res) {
        deferred.resolve(res);
      });
      return deferred.promise;
    }

    // Cleaner API functions to replace basicPut*Post*Delete
    function put (table, data, pk) {
      var format_object = {table: table, data: data, pk: pk};
      return $http.put('/data/', format_object);
    }

    function post (table, data) {
      return $http.post('data/', {table : table, data : data});
    }

    function delet (table, column, id) {
      return $http.delete(['/data', table, column, id].join('/'));
    }

    // old API
    function basicGet(url) { // TODO: deprecate this
      console.warn('connect.basicGet is deprecated.  Please refactor your code to use either fetch() or req().');
      return $http.get(url);
    }

    function MyBasicGet(target){
      console.warn('connect.MyBasicGet is deprecated.  Please refactor your code to use either fetch() or req().');
      var promise = $http.get(target).then(function(result) {
        return result.data;
      });
      return promise;
    }

    function basicDelete (table, id, column) {
      console.warn('connect.basicDelete is deprecated.  Please refactor your code to use either connect.delete().');
      if (!column) column = "id";
      return $http.delete(['/data/', table, '/', column, '/', id].join(''));
    }

//    TODO reverse these two methods? I have no idea how this happened
    function basicPut(table, data) {
      var format_object = {table: table, data: data};
      return $http.post('data/', format_object);
    }

    function basicPost(table, data, pk) {
      var format_object = {table: table, data: data, pk: pk};
      return $http.put('data/', format_object);
    }

    // utility function
    function clean (obj) {
      // clean off the $$hashKey and other angular bits and delete undefined
      var cleaned = {};
      for (var k in obj) {
        if (k !== '$$hashKey' && angular.isDefined(obj[k]) && obj[k] !== "" && obj[k] !== null) cleaned[k] = obj[k];
      }
      return cleaned;
    }

    function packageError(err, table) {
      //I'm sure this is literally gross, should do reading up on this
      err.http = true;
      err.table = table || null;
      return err;
    }

    return {
      req: req,
      fetch: fetch,
      clean: clean,
      basicPut: basicPut,
      basicPost: basicPost,
      basicGet: basicGet,
      basicDelete: basicDelete,
      put : put,
      post : post,
      delete : delet,
      getModel: getModel,
      MyBasicGet: MyBasicGet,
      debitorAgingPeriod : debitorAgingPeriod
    };
  });


  services.service('messenger', function ($timeout, $sce) {
    var self = this;
    self.messages = [];
    var indicies = {};

    self.push = function (data, timer) {
      var id = Date.now();
      data.id = id;
      data.msg = $sce.trustAsHtml(data.msg); // allow html insertion
      self.messages.push(data);
      indicies[id] = $timeout(function () {
        var index, i = self.messages.length;

        while (i--) { if (self.messages[i].id === id) { self.messages.splice(i, 1); break; } }

      }, timer || 3000);
    };

    (function () {
      ['info', 'warning', 'danger', 'success']
      .forEach(function (type) {
        self[type] = function (message, timer) {
          self.push({type: type, msg: message }, timer);
        };
      });
    })();

    self.close = function (idx) {
      // cancel timeout and splice out
      $timeout.cancel(indicies[idx]);
      self.messages.splice(idx, 1);
    };

  });

  services.factory('exchange', [
    'appstate',
    'validate',
    'messenger',
    function (appstate, validate, messenger) {
      var map;

      appstate.register('exchange_rate', function (globalRates) {
        // build rate map anytime the exchange rate changes.
        map = {};
        globalRates.forEach(function (r) {
          map[r.foreign_currency_id] = r.rate;
        });
      });

      function exchange(value, currency_id, date) {
        if (!map) {
          console.error('No exchange rates loaded.');
          messenger.danger('No Exchange Rates loaded!');
        }
        return map ? (map[currency_id] || 1.00) * value : value;
      }

      return exchange;
    }
  ]);

})(angular);
