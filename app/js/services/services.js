// Services.js
//TODO: Define API for getting data from the server - providing query data, simple table names, etc.

(function (angular) {
  'use strict';
  
  var services = angular.module('kpk.services', []);
    
  services.service('kpkUtilitaire', function() { 
    this.formatDate = function(dateString) {
      return new Date(dateString).toDateString();
    };

    Date.prototype.toMySqlDate = function (dateParam) {
      var date = new Date(dateParam), annee, mois, jour;
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

    this.convertToMysqlDate = function(dateString) {
      return new Date().toMySqlDate(dateString);
    };

    this.isDateAfter = function(date1, date2){
      date1 = new Date(date1);
      date2 = new Date(date2);

      if(date1.getFullYear > date2.getFullYear){
        return true;
      }else if(date1.getFullYear() == date2.getFullYear()){
        if(date1.getMonth() > date2.getMonth()){
          return true;
        }else if(date1.getMonth() == date2.getMonth()){
          if(date1.getDate() > date2.getDate())
            return true;
            return false;
        }else if(date1.getMonth() < date2.getMonth()){
          return false;
        }
      }else if(date1.getFullYear() < date2.getFullYear()){
        return false;
      }
    };

    this.areDatesEqual = function(date1, date2){
      date1 = new Date(date1);
      date2 = new Date(date2);

      if(date1.getFullYear != date2.getFullYear){
        return false;
      }else if(date1.getFullYear() == date2.getFullYear()){
        if(date1.getMonth() != date2.getMonth()){
          return false;
        }else if(date1.getMonth() == date2.getMonth()){
          if(date1.getDate() != date2.getDate())
            return false;
            return true;
        }
      }
    };
  });
  
  //service to check existence of required data from the server, tests are run on startup and can be querried from modules as needed
  services.factory('validate', function($q, connect) {  
    function validate() {
      
      //remove startup tests to only serve model validation
      runStartupTests();
    }
    
    //expose methods
    function registerRequirements(requirements) { 
      var response = {};

      //FIXME requirements validation 
      requirements.forEach(function(item, index) { 
        if(testSuite[item]) { 
          
          //if testSuite[item] isn't completed, queue until everything is ready
          response[item] = testSuite[item].result;
        } else { 
          response[item] = null;
        } 
      });
    }
    
    //FIXME rewrite this method
    function processModels(models) { 
      //TODO tests should be a list of 
      //[{test: function(), message: ""}]
      var deferred = $q.defer(), pass = true; 
      /*
       * dependencies
       * {
       *  query : { tables...}
       *  test : function(return true or false);
       *  required: true || false
       *
      */

      angular.forEach(models, function(dependency, key) { 
        var required = dependency.required || false, data = dependency.model.data;
        var tests = dependency.test || [];
        
        //run default required test
        if(required) {
          pass = isNotEmpty(data);
          if(!pass) {  
            deferred.resolve({passed: false, message: 'Required table ' + key + ' has no data'});
            return false; //break from loop 
          }
        }
      
        //if required fails loop will return before this point 
        //TODO tests can currently only be syncronous
        tests.forEach(function(test) { 
          var testResult = test();
          if(!testResult) { 
            pass = testResult;
            return false; //break from loop
          }
        });
      }); 

      deferred.resolve({passed: pass, message: 'End of process'}); 
      return deferred.promise;
    }

    //private methods  
    //TODO Either the service should define, run and store test results to be accessed from units, or the tests should be defined elsewhere i.e application.js
    function runStartupTests() { 
      console.log('running testSuite');

      angular.forEach(testSuite, function(test, key) { 
        var args = test.args || [];

        console.log('running test ', key, test);
        test.method(args).then(function(res) {
          console.log('completed test ', key, 'result: ', res);
          test.result = res;
        });
      });
    }

    var testSuite = { 
      "enterprise" : {method: testRequiredModel, args: ["enterprise"], result: null},
      "fiscal" : {method: testRequiredModel, args: ["fiscal_year"], result: null}
    }
    
    function testRequiredModel(tableName, primaryKey) { 
      var deferred = $q.defer();
      var testDataQuery = { 
        tables : {}
      }

      primaryKey = (primaryKey || "id"); 
      testDataQuery.tables[tableName] = { 
        columns: [primaryKey]
      }

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
       
    //utility methods
    function isNotEmpty(data) { 
      if(data.length > 0) return true;
      return false;
    }

    validate();

    return {
      processModels: processModels
    };
  });


  services.factory('appcache', function ($rootScope, $q) { 
    var DB_NAME = "kpk";
    var VERSION = 16;

    var db, cacheSupported, dbdefer = $q.defer();

    function cacheInstance(namespace) { 
      if(!namespace) throw new Error('Cannot register cache instance without namespace');
      return { 
        namespace: namespace,
        fetch: fetch,
        fetchAll: fetchAll,
        put: put
      }
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
          console.log('write successful'); 
          deferred.resolve(event);
        }
        request.onerror = function(event) { 
          console.log('unable to put', event);
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
          console.log('getall failure'); 
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
        console.log('[appcahce] upgraded');
       
        //delete object store if it exists - DEVELOPMENT ONLY
        if(db.objectStoreNames.contains('master')) {
          //FIXME no error/ success handling
          db.deleteObjectStore('master');  
        }
        var objectStore = db.createObjectStore("master", {keyPath: ['namespace', 'key']});
        objectStore.createIndex("namespace, key", ["namespace", "key"], {unique: true}); 
        objectStore.createIndex("namespace", "namespace", {unique: false});
        objectStore.createIndex("key", "key", {unique: false});
        deferred.resolve();
      };
      request.onsuccess = function(event) {
        db = request.result;
        $rootScope.$apply(deferred.resolve());
      };
      request.onerror = function(event) { 
        console.log('connection failed');
        deferred.reject(event);
      };
      return deferred.promise;
    }

    cacheSupported = ("indexedDB" in window);
    if(cacheSupported) { 
      init();
    } else { 
      console.log('application cache is not supported in this context');
      //throw new Error();
    }

    return cacheInstance;
  });

  services.factory('appstate', function ($q, $rootScope) { 
    /*
    * summary: 
    *  generic service to share values throughout the application by id - returns a promise that will either be populated or rejected
    *  to allow asynchronous loading
    * TODO
    *   -Unregister callbacks form unit/module, these could be auto unhooked from application controller?
    */
  
    var instance = {
      //summary: 
      //  expose required function to Angular modules, all other functions are considered private
      id: Date.now(),
      get: get,
      set: set,
      register: register,
      update: update
    };

    var comp = {};
    var queue = {};

    function set(comp_id, ref) { 
      //summary: 
      //  Assign id reference to value
      console.log(comp_id, 'set', Date.now(), ref);
      comp[comp_id] = ref;
    }

    function get(comp_id) { 
      //summary: 
      //  Reference to value by di
      return comp[comp_id];
    }

    function register(comp_id, callback) { 
      // FIXME: These are strict violations
      var id = this.id;
      console.log('request for callback', comp_id);
      if(!queue[comp_id]) { 
        queue[comp_id] = [];
      }

      queue[comp_id].push({ref: this, callback: callback});
      //init call to pass current value
      if(comp[comp_id]) { 
        console.log("calling callback()", comp_id);
        callback(comp[comp_id]);
      }
    }

    function update(comp_id, value) { 
      comp[comp_id] = value;
      var l = queue[comp_id];
      if(l) { 
        l.forEach(function(recept) { 
          console.log("Attempting callback", comp[comp_id]);
          recept.callback(comp[comp_id]);
        });
      }
    }

    return instance;
  });

  services.factory('connect', function ($http, $q) {
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

    function req (defn) {
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
      if (angular.isString(defn)) {
        // CLEAN THIS UP
        var d = $q.defer();
        $http.get(defn).then(function (returned) {
          returned.identifier = 'id';
          d.resolve(new Model(returned))
        });
        return d.promise;
      }

      var handle, deferred = $q.defer();
      var table = defn.primary || Object.keys(defn.tables)[0];


      handle = $http.get('/data/?' + JSON.stringify(defn));
      handle.then(function (returned) {
        
        //massive hack so I can use an identifier - set defualt identifier
        returned.identifier = defn.identifier || 'id';
        var m = new Model(returned, table);
        requests[m] = defn;
        deferred.resolve(m);
      }, function(err) { 
        //package error object with request parameters for error routing
        deferred.reject(packageError(err, table));
      });

      return deferred.promise;
    }

    function loc() { 
      //FIXME Stupid method to package location table in Model, super temporary (shouldn't need to download all locations for individual user) 
      var handle, deferred = $q.defer();
      handle = $http.get('location/');
      handle.then(function(res) { 
        var m = new Model(res, 'location');

        console.log('loc', m);
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

      handle = $http.get('/temp/?' + JSON.stringify(defn));
      handle.then(function (returned) {
        deferred.resolve(returned.data);
      });
      return deferred.promise;
    }

    function Model (options, target) {
      // the data store, similar to Dojo's Memory Store.
      options = options || {};
      // globals
      this.index = {};
      this.data = {};

      // locals
      var queue = [];
      var identifier = options.identifier || 'id'; // id property
      var pprint = '[connect] ';
      var tgt = "/data/"; // temporary target until we standardize connect.
      var refreshrate = options.refreshrate || 500;

      // set an array of data
      this.setData = function (data) {
        var index = this.index = {};
        this.data = data;

        for (var i = 0, l = data.length; i < l; i++) {
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
        queue.push({method: 'PUT', url: tgt + target});
      };

      // post is for INSERTS
      this.post = function (object, opts) {

        var data = this.data,
            index = this.index,
            id = object[identifier] = (opts && "id" in opts) ? opts.id : identifier in object ?  object[identifier] : Math.random();
        if (id in index) throw pprint + 'Attempted to overwrite data with id: ' + id + '.';
        index[id] = data.push(object) - 1;
        // enqueue item for sync
        queue.push({method: 'POST', url: tgt + target, data: object});
      };

      this.remove = function (id) {
        var data = this.data,
            index = this.index;
        
        if (id in index) {
          console.log("Trying to split on ",data);
          data.splice(index[id], 1);
          this.setData(data);
          queue.push({method: 'DELETE', url: tgt + target + '/' + id});
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

      return this;
    }

    function journal (invoice_ids) {
      return $http.post('/journal/', invoice_ids);
    }

    function basicGet(url) {
      return $http.get(url);
    }

    function MyBasicGet(target){
      var promise = $http.get(target).then(function(result) { 
        return result.data;
      });
      return promise;
    }

//    FIXME accepts any request (temporarily making up for 'req()' shortcomings) this should be deprecated
    function basicReq(reqobj) {
      //summary: 
      //  return a packaged model given a straight request object
      var deferred = $q.defer();
      var model = {};
      var handle = $http.get('/data/?' + JSON.stringify(reqobj)).then(function (returned) {
        var m = packageModel(model, returned.data);
        //unable to uniformly set request object, this will cause a problem
        requests[m] = reqobj;
        deferred.resolve(m);
      }, function(err) { 
        //oh lawd
        deferred.reject(packageError(err, reqobj.e.t));
      });

      return deferred.promise;
    }

    function packageModel(model, data) {

      model.index = {};
      model.data = data;

      //determine indexs
      model.calculateIndex = function () {
        this.index = {};
        for (var i = this.data.length - 1; i >= 0; i--) {
          this.index[this.data[i].id]= i;
        }
      };

      //data manipulation
      model.get = function (id) {
        return this.data[this.index[id]];
      };

      model.put = function (object) {
        var id = object.id;
 ;       if (id in this.index) {
          //TODO: Implement overwrite flag/ behaviour
          throw new Error("Object overwrite attempted.");
        } else {
          //update index and insert object
          this.index[id] = this.data.push(object) - 1;
        }
      };

      model.delete = function (id) {
        var i = this.index;
        if (id in i) {
          this.data.splice(i[id], 1);
          this.calculateIndex();
          //Check if changes should be automatically reflected in server etc.
          connect_delete(this, id);
          return true;
        }
      };

      // generate id
      model.generateid = function () {
        var ids, id, idx = this.index;
        ids = Object.keys(idx);
        id = Math.max.apply(Math.max, ids) + 1;
        return (id > 0) ? id : 1;
      };

      model.flush = function () {

      };

      //initialise index
      model.calculateIndex();
      return model;
    }

    function basicDelete (table, id, column) {
      if (!column) column = "id";
      $http.delete(['/data/', table, '/', column, '/', id].join(''));
    }

//    TODO reverse these two methods? I have no idea how this happened
    function basicPut(table, object) {
      var format_object = {t: table, data: object};
      return $http.post('data/', format_object);
    }

    function basicPost(table, object, primary) {
      var format_object = {t: table, data: object, pk: primary};
      return $http.put('data/', format_object);
    }

    function clean (obj) {
      // clean off the $$hashKey and other angular bits and delete undefined
      var cleaned = {};
      for (var k in obj) {
        if (k != '$$hashKey' && angular.isDefined(obj[k]) && obj[k] !== "" && obj[k] !== null) cleaned[k] = obj[k];
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
      loc: loc,
      basicReq: basicReq,
      basicPut: basicPut,
      basicPost: basicPost,
      basicGet: basicGet,
      basicDelete: basicDelete,
      journal: journal,
      fetch: fetch,
      clean: clean,
      MyBasicGet: MyBasicGet
    };
  });


  services.service('messenger', function ($timeout) {
    var self = this;
    self.messages = [];
    var indicies = {};

    self.push = function (msg, timer) {
      var id = Date.now();
      msg.id = id;
      self.messages.push(msg); 
      indicies[id] = $timeout(function () {
        var index, i = self.messages.length;

        while (i--) { if (self.messages[i].id === id) { self.messages.splice(i, 1); break; } }

      }, timer || 3000);
    };

    self.close = function (idx) {
      // cancel timeout and splice out
      $timeout.cancel(indicies[idx]);
      self.messages.splice(idx, 1);
    };

  });

  services.service('printer', function () {
    var self = this;

    this.print = function (data) {
      self.data  = data;
      self.data.print = true;
    }

    this.clear = function () {
      self.data = {};
    }

  });

})(angular);
