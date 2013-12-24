// Services.js
//TODO: Define API for getting data from the server - providing query data, simple table names, etc.

(function (angular) {
  'use strict';
  
  var services = angular.module('kpk.services', []);
    
      //FIXME: depricated - yo
    services.service('kpkConnect', function($http) { 
      this.fetch = function(table, columns, where, value) {     
        var query = { 
          e: [{t : table, c : columns}]
        };
        
        if(where) { 
          query.c = [{t : table, cl : where, v : value, z : '='}];
        }
        
        var promise = $http.get('/data/?' + JSON.stringify(query)).then(function(result) { 
            // I can now manipulate the data before returning it if needed
            return result.data;
          });
          return promise;
      };      
       //Because TODO
      this.raw_fetch = function(qeury_object) { 
        var promise = $http.get('/data/?' + JSON.stringify(qeury_object)).then(function(result) { 
          return result.data;
        });
        return promise;
      }; 

      this.get = function(target, requestObject){
        var promise = $http.get(target + JSON.stringify(requestObject)).then(function(result) { 
          return result.data;
        });
        return promise;
      };

      this.basicGet = function(target, param){
        if(!param){
          var promise = $http.get(target).then(function(result) { 
            return result.data;
          });
        }      
        return promise;
      };

      this.send = function(table, data) { 
        var sql= {t:table, data:data};
        $http.post('data/',sql);
      };

      this.sendTo = function(target, table, data) { 
        var sql= {t:table, data:data};
        $http.post(target,sql);
      };

      this.update = function(objectRequest) { 
        $http.put('data/',objectRequest);
      };

      this.delete = function(table, id) { 
        $http.delete('data/'+id+'/'+table);
      };
    });

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
      }

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
      }

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
      }
  });

  services.factory('appcache', function($q) { 
    var DB_NAME = "kpk";
    var VERSION = 2;

    var db, cacheSupported;
    var requestMap = { 
      'get' : get
    }

    function init() { 
      //also sets db - working on making it read better
      openDBConnection(DB_NAME)
      .then(function(connectionSuccess) { 

      }, function(error) { 

      });
    }

    //generic request method allow all calls to be queued if the database is not initialised
    function request(method, value) { 
      if(!requestMap[method]) return false;
      requestMap[method](value);
    }

    function get(value) { 

    }

    function openDBConnection(dbname) { 
      var deferred = $q.defer();
      var request = indexedDB.open(dbname);
      request.onupgradeneeded = function(event) { 
        db = event.target.result;

        // if(!db.objectStoreNames.contains()
        deferred.resolve();
      }
      request.onsuccess = function(event) { 
        db = request.result;
        deferred.resolve();
      }
      request.onerror = function(event) { 
        deferred.reject(event);
      }
      return deferred.promise;
    }

    cacheSupported = ("indexedDB" in window);
    if(cacheSupported) { 
      init();
    } else { 
      console.log('application cache is not supported in this context');
      //throw new Error();
    }

    return { 
      request : request
    };
  });

  services.factory('appstate', function($q) { 
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
      comp[comp_id] = ref;
    }

    function get(comp_id) { 
      //summary: 
      //  Reference to value by di
      return comp[comp_id];
    }

    function register(comp_id, callback) { 
      var id = this.id;
      if(!queue[comp_id]) { 
        queue[comp_id] = [];
      }

      queue[comp_id].push({ref: this, callback: callback});
      //init call to pass current value
      if(comp[comp_id]) { 
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
      var handle, deferred = $q.defer();
      var table = defn.primary || Object.keys(defn.tables)[0];


      handle = $http.get('/temp/?' + JSON.stringify(defn));
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

      console.log('received options', options);

      // globals
      this.index = {};
      this.data = {};

      // locals
      var queue = [];
      var identifier = options.identifier || 'id'; // id property
      console.log('id:', identifier);
      var pprint = '[connect] ';
      var tgt = "/temp/"; // temporary target until we standardize connect.
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
            console.log('this data', this.data, 'this index ', this.index);

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

    function journal(invoice_ids) {
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
    };

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
          this.index[this.data[i]["id"]] = i;
        }
      };

      //data manipulation
      model.get = function (id) {
        return this.data[this.index[id]];
      };

      model.put = function (object) {
        var id = object["id"];
        if (id in this.index) {
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

    function basicDelete (table, col,  id) {
      // deletes something from the table `table` where id is `id` 
      if (!col) col = "id";
      $http.delete('/data/'+id+'/'+col+'/'+table);
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


  services.factory('message', function ($timeout) {
    var message,
        delay = 3000,
        timer;

    function close () {
      if (timer) $timeout.close(timer);
      message.active = false;
    }

    function show () {
      message.active = true;
      timer = $timeout(function () {
        message.active = false;
      }, 3000);
    }

    message = {
      content : "",
      title : "",
      type : "",
      close : close,
      show : show,
      active : false
    };

    return message; 

  });

})(angular);
