// app/js/services/services.js

(function (angular) {
  'use strict';

  var services = angular.module('bhima.services', []);

  services.service('util', function() {

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

  })

  .service('precision', function () {
    var dflt_precision = 4,
        dflt_scalar = 1000,
        self = this;

    this.add = function add(n, m) {
      return self.round(n + m);
    };

    this.round = function round(n, p) {
      // round [fn]
      //
      // round takes in a number, n, and a precision, p,
      // returning the same number as a float to the
      // decimal percision p.
      if (!p) { p = dflt_precision; }
      return parseFloat(n.toFixed(p));

    };

    this.scale = function scale(n, s) {
      // scale [fn]
      //
      // scale scales a number by a default scalar
      // to avoid javascript rounding errors
      return n * (s || dflt_scalar);
    };

    this.unscale = function unscale(n, s) {
      // unscale [fn]
      //
      // unscale reduces a number by a default scalar
      // to revert scaled values to the origin metric
      return n / (s || dflt_scalar);
    };

    this.compare = function compare(n, m) {
      // compare [fn]
      //
      // compare is an extremely precise way to compare
      // the discrepancy between two numbers.  Returns a
      // float of the difference between the two numbers
      var _n = self.scale(n, 100000);
      var _m = self.scale(m, 100000);
      var discrepancy = self.round(_n - _m);
      return self.unscale(discrepancy, 100000);
    };

    this.sum = function sum (list) {
      return list.reduce(self.add, 0);
    };

  })

  //TODO passing list and dependencies to everything, could assign to object?
  .factory('validate', ['$q', 'connect', function($q, connect) {
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
        // console.log('ran tests', validate);
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
      var fList;

      fList = list.filter(function(key, index) {
        if(dependencies[key].processed) return false; //processed requests
        if(key===modelLabel) return false; //model store
        return true;
      });
      return fList;
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

    function testRequiredModel (tableName, primaryKey) {
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
  }])

  .factory('appcache', ['$rootScope', '$q', function ($rootScope, $q) {
    var DB_NAME = "bhima", VERSION = 21;
    var db, cacheSupported, dbdefer = $q.defer();

    function cacheInstance(namespace) {
      if(!namespace) throw new Error('Cannot register cache instance without namespace');
      return {
        namespace: namespace,
        fetch: fetch,
        fetchAll: fetchAll,
        put: put,
        remove: remove
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
      if (!requestMap[method]) return false;
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

    function remove(key) {
      var t = this, namespace = t.namespace;
      var deferred = $q.defer();

      dbdefer.promise
      .then(function () {
        var transaction = db.transaction(['master'], "readwrite");
        var objectStore = transaction.objectStore('master');
        var request;

        console.log('OBJECT STORE', objectStore);
        console.log('deleting', key);
        request = objectStore.delete([namespace, key]);

        request.onsuccess = function(event) {
          console.log('delete success?', event);
          deferred.resolve(event);
        };
        request.onerror = function(event) {
          console.log('delete errur');
          deferred.reject(event);
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
        };
        var transaction = db.transaction(['master'], "readwrite");
        var objectStore = transaction.objectStore('master');
        var request;

        //TODO jQuery dependency - write simple utility to flatten/ merge object
        writeObject = jQuery.extend(writeObject, value);
        request = objectStore.put(writeObject);

        request.onsuccess = function(event) {
          deferred.resolve(event);
        };

        request.onerror = function(event) {
          deferred.reject(event);
        };

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
  }])

  .factory('appstate', function ($q, $rootScope) {
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
  })

  .factory('store', ['$http', function ($http) {
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

        if (!id) throw 'No id property in the object.  Expected property: ' + identifier;

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
        index[id] = data.push(object) - 1;
        // enqueue item for sync
        queue.push({method: 'POST', url: '/data/' + target, data: object});
      };

      this.remove = function (id) {
        var data = this.data,
            index = this.index;
        if (id in index) {
          data.splice(index[id], 1);
          this.setData(data);
          queue.push({method: 'DELETE', url: '/data/' + target + '/' + id});
        }
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
          $http(req)
          .success(function () {
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
  }])

  .factory('connect', [ '$http', '$q', 'store', function ($http, $q, Store) {
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
      var handle, table, deferred = $q.defer();

      if (angular.isString(defn)) {
        $http.get(defn)
        .then(function (res) {
          res.identifier = stringIdentifier || 'id';
          deferred.resolve(new Store(res));
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
        var m = new Store(returned, table);
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
        var m = new Store(res, getRequest);
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
    function basicPut (table, data) {
      var format_object = {table: table, data: data};
      return $http.post('data/', format_object);
    }

    function basicPost (table, data, pk) {
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

    function packageError (err, table) {
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
      basicDelete: basicDelete,
      put : put,
      post : post,
      delete : delet,
      getModel: getModel // deprecate this.
    };
  }])

  .service('messenger', [
    '$timeout',
    '$sce',
    '$translate',
    'errorCodes',
    function ($timeout, $sce, $translate, errorCodes) {
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

          while (i--) {
            if (self.messages[i].id === id) {
              self.messages.splice(i, 1);
              break;
            }
          }

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

      // Future API
      // A blocking modal
      self.block = function (message, callback, errback) { };

      var unknown_msg = "An unanticipated error occured.";
      // Appropriate error formatting
      self.error = function (code, timer) {
        var err = errorCodes[code];
        // FIXME : translate doesn't work
        self.push({ title : 'ERROR: ' + err.title , msg : err.description, type: 'danger'}, timer || 5000);
      };
    }
  ])

  .service('errorCodes', function () {
    return {
      'ERR_TXN_IMBALANCE' : {
        title             : 'Transaction Imbalance',
        ref               : 'ERR_TXN_IMBALANCE',
        description       : 'Imbalanced transaction(s) detected',
      },
      'ERR_TXN_ZERO' : {
        title        : 'Zero-Valued Lines',
        ref          : 'ERR_TXN_ZERO',
        description  : 'Invalid transaction(s) line missing both debit and credit amounts',
      },
      'ERR_TXN_CORRUPT_DATE' : {
        title                : 'Corrupt Transaction Date',
        ref                  : 'ERR_TXN_CORRUPT_DATE',
        description          : 'Corrupted date detected in transaction(s)',
      },
      'ERR_TXN_MULTI_DATE' : {
        title              : 'Multiple Transaction Dates',
        ref                : 'ERR_TXN_MULTI_DATE',
        description        : 'Transaction dates do not agree.  Multiple dates detected for single transaction(s)',
      },
      'ERR_TXN_EMPTY_ACCOUNT' : {
        title                 : 'Empty Transaction Account',
        ref                   : 'ERR_TXN_EMPTY_ACCOUNT',
        description           : 'Empty account field detect in transaction(s)',
      },
      'ERR_TXN_EMPTY_DC_TYPE' : {
        ref                   : 'ERR_TXN_EMPTY_DC_TYPE',
        title                 : 'Empty Debitor/Creditor Type',
        description           : 'Empty debitor/creditor type detected in transaction(s) with debitor/creditor id present',
      },
      'ERR_TXN_EMPTY_DC_UUID' : {
        ref                   : 'ERR_TXN_EMPTY_DC_UUID',
        title                 : 'Empty Debitor/Creditor ID',
        description           : 'Empty debitor/creditor ID detected in transaction(s) with debitor/creditor type present',
      },
      'ERR_TXN_UNRECOGNIZED_DATE' : {
        ref                       : 'ERR_TXN_UNRECOGNIZED_DATE',
        title                     : 'Unrecognized Transaction Date',
        description               : 'Unrecognized dates in transaction(s).  Dates do not fall within a valid fiscal year',
      },
      'ERR_TXN_UNRECOGNIZED_DC_UUID' : {
        ref                          : 'ERR_TXN_UNRECOGNIZED_DC_UUID',
        title                        : 'Unrecognized Debitor/Creditor ID',
        description                  : 'Unrecognized debitor/creditor ID in transaction(s)',
      },
      'ERR_HTTP_UNREACHABLE' : {
        title                : 'Server Unreachable',
        ref                  : 'ERR_HTTP_UNREACHABLE',
        description          : 'Server returned a 404 unreachable response.',
      },
      'ERR_HTTP_INTERNAL' : {
        title             : 'Internal Server Error',
        ref               : 'ERR_HTTP_INTERNAL',
        description       : 'Server returned a 500 internal error response.',
      },
      'ERR_AUTH_UNAUTHORIZED' : {
        title                 : 'Authorized Access',
        ref                   : 'ERR_AUTH_UNAUTHORIZED',
        description           : 'User is not authorized to perform this action.',
      },
      'ERR_AUTH_UNRECOGNIZED' : {
        title                 : 'Unrecognized User',
        ref                   : 'ERR_AUTH_UNRECOGNIZED',
        description           : 'Invalid or unrecognized PIN registration.',
      },
      'ERR_SESS_EXPIRED' : {
        title            : 'Session Expired',
        ref              : 'ERR_SESS_EXPIRED',
        description      : 'Authenticated session has expired.'
      },
      'ERR_QUERY'   : {
        title       : 'Database Exception',
        ref         : 'ERR_QUERY',
        description : 'The database raised an exception to the query. Please contact a sysadmin.'
      },
      'ERR_ACCOUNT_LOCKED' : {
        title              : 'Locked Accounts',
        ref                : 'ERR_ACCOUNT_LOCKED',
        description        : 'Locked accounts included in transaction(s).'
      },
      'ERR_ACCOUNT_NULL' : {
        title            : 'Null Accounts',
        ref              : 'ERR_ACCOUNT_NULL',
        description      : 'Undefined or null accounts included in transaction(s).'
      },
      'ERR_RECORD_NOT_FOUND' : {
        title : 'Record Not Found',
        ref : 'ERR_RECORD_NOT_FOUND',
        description : 'The record you were looking for could not be retrieved'
      }
    };
  })

  .service('exchange', [
    '$timeout',
    'store',
    'appstate',
    'messenger',
    'precision',
    function ($timeout, Store, appstate, messenger, precision) {
      var called = false;

      function normalize (date) {
        return date.setHours(0,0,0,0);
      }

      function exchange (value, currency_id, date) {
        // This function exchanges data from the currency specified by currency_id to
        // the enterprise currency on a given date (default: today).
        date = date || new Date();
        date = normalize(new Date(date));
        if (!exchange.store) { return value; }

        var store = exchange.store.get(date);
        if (!store && !called) { // HACK to only show one messenger instance
          messenger.danger('No exchange rates loaded for date: ' + new Date(date));
          called = true;
          $timeout(function () { called = false; }, 50);
        }

        return precision.round(exchange.store && store && store.rateStore.get(currency_id) ? store.rateStore.get(currency_id).rate * value : value);
      }

      exchange.rate = function rate (value, currency_id, date) {
        date = date || new Date();
        date = normalize(new Date(date));
        if (!exchange.store) { return 1; }

        var store = exchange.store.get(date);
        if (!store) { messenger.danger('No exchange rates loaded for date: ' + new Date(date)); }
        return precision.round(exchange.store && store && store.rateStore.get(currency_id) ? store.rateStore.get(currency_id).rate : 1);
      };

      exchange.hasExchange = function hasExchange () {
        return !!exchange.store && !!Object.keys(exchange.store).length;
      };

      exchange.hasDailyRate = function hasDailyRate () {
        var date = normalize(new Date());
        return !!exchange.store && !!exchange.store.get(date);
      };

      appstate.register('exchange_rate', function (rates) {
        $timeout(function () { exchange.hasExchange(); }); // Force refresh

        var store = exchange.store = new Store({ identifier : 'date', data : [] });

        rates.forEach(function (rate) {
          var date = normalize(new Date(rate.date));
          if (!store.get(date)) {
            store.post({ date : date, rateStore : new Store({ data : [] }) });
            store.get(date).rateStore.post({ id : rate.enterprise_currency_id, rate : 1}); // default rate for enterprises
            store.get(date).rateStore.post({
              id : rate.foreign_currency_id,
              rate : rate.rate,
            });
          } else {
            store.get(date).rateStore.post({
              id : rate.foreign_currency_id,
              rate : rate.rate,
            });
          }
        });
      });

      return exchange;
    }
  ])

  .service('calc', [ 'precision', 'appstate', 'store', function (precision, appstate, Store) {
    // this service calculates the nearest rounded price
    // to pay or bill, based on the currency
    var store;

    appstate.register('currency', function (curr) {
      store = new Store({ data : curr});
    });

    return function calcPrice(price, currency_id) {
      var unit, r, round, total, diff;

      if (!store) { throw new Error('No currencies defined!'); }

      unit = store.get(currency_id).min_monentary_unit;
      r = price % unit;
      round = unit - r;
      total = precision.round(r > unit / 2 ? price + round : price - r, 0);
      diff = precision.round(unit - r);

      return { total : total, difference : diff };
    };

  }])

  .service('uuid', function () {
    return function () {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0,
        v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    };
  })

  .factory('requestNotificationChannel', ['$rootScope', function($rootScope) {
    // private notification messages
    var _START_REQUEST_ = '_START_REQUEST_';
    var _END_REQUEST_ = '_END_REQUEST_';

    // publish start request notification
    var requestStarted = function() {
      $rootScope.$broadcast(_START_REQUEST_);
    };
    // publish end request notification
    var requestEnded = function() {
      $rootScope.$broadcast(_END_REQUEST_);
    };
    // subscribe to start request notification
    var onRequestStarted = function($scope, handler){
      $scope.$on(_START_REQUEST_, function(event){
        handler();
      });
    };
    // subscribe to end request notification
    var onRequestEnded = function($scope, handler){
      $scope.$on(_END_REQUEST_, function(event){
        handler();
      });
    };

    return {
      requestStarted:  requestStarted,
      requestEnded: requestEnded,
      onRequestStarted: onRequestStarted,
      onRequestEnded: onRequestEnded
    };
  }]);


})(angular);
