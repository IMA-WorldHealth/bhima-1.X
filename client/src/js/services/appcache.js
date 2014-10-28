angular.module('bhima.services')
.factory('appcache', ['$rootScope', '$q', '$localForage', function ($rootScope, $q, $localForage) {

  // default driver is indexedDB
  var defaultDriver = 'asyncStorage';

  var mod = {};

  function LFWrapper (name) {
    this.namespace = name;
    try {
      this._storage = $localForage.instance(name);
    }
    catch(err) {
      this._storage = $localForage.createInstance({
        name : name,
        driver : defaultDriver
      });
    }
  }

  function convertToNumber(n) {
    var cn = Number(n);
    return Number.isNaN(cn) ? n : cn;
  }

  LFWrapper.prototype.fetchAll = function () {
    var storage = this._storage,
        namespace = this.namespace;

    return storage.keys()
      .then(function (keys) {
        return $q.all(keys.map(function (k) {
          return storage.getItem(k)
          .then(function (value) {
            return angular.extend(value, {
              key : convertToNumber(k),
              namespace : namespace
            });
          });
        }));
      })
      .then(function (values) {
        return values;
      });
  };

  LFWrapper.prototype.put = function (key, value) {
    return this._storage.setItem(key, value);
  };

  LFWrapper.prototype.fetch = function (key) {
    return this._storage.getItem(key);
  };

  LFWrapper.prototype.remove = function (key) {
    return this._storage.removeItem(key);
  };

  return LFWrapper;

 /*
  var DB_NAME = 'bhima', VERSION = 21;
  var db, cacheSupported, dbdefer = $q.defer();

  function cacheInstance(namespace) {
    if (!namespace) { throw new Error('Cannot register cache instance without namespace'); }
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
    .then(function () {
      dbdefer.resolve();
    }, function(error) {
      throw new Error(error);
    });
  }

  //TODO This isn't readable, try common request (queue) method with accessor methods
  function fetch(key) {
    var t = this, namespace = t.namespace;
    var deferred = $q.defer();
    dbdefer.promise
    .then(function() {
      //fetch logic
      var transaction = db.transaction(['master'], 'readwrite');
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
      var transaction = db.transaction(['master'], 'readwrite');
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
      var transaction = db.transaction(['master'], 'readwrite');
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
          console.log('CACHE: FetchALL()', store);
          $rootScope.$apply(deferred.resolve(store));
        }
      };

      request.onerror = function(event) {
        deferred.reject(event);
      };
    });
    return deferred.promise;
  }

  function openDBConnection(dbname, dbversion) {
    var deferred = $q.defer();
    var request = indexedDB.open(dbname, dbversion);
    request.onupgradeneeded = function (event) {
      db = event.target.result;
      //TODO naive implementation - one object store to contain all cached data, namespaced with feild
      //TODO possible implementation - create new object store for every module, maintain list of registered modules in master table

      //delete object store if it exists - DEVELOPMENT ONLY
      if(db.objectStoreNames.contains('master')) {
        //FIXME no error/ success handling
        db.deleteObjectStore('master');
      }
      var objectStore = db.createObjectStore('master', {keyPath: ['namespace', 'key']});
      objectStore.createIndex('namespace, key', ['namespace', 'key'], {unique: true});
      objectStore.createIndex('namespace', 'namespace', {unique: false});
      objectStore.createIndex('key', 'key', {unique: false});
    };

    request.onsuccess = function () {
      db = request.result;
      $rootScope.$apply(deferred.resolve());
    };
    request.onerror = function(event) {
      deferred.reject(event);
    };
    return deferred.promise;
  }

  cacheSupported = ('indexedDB' in window);
  if(cacheSupported) {
    init();
  } else {
    console.log('application cache is not supported in this context');
  }
  return cacheInstance;
//  */

}]);

