angular.module('bhima.services')
.factory('appcache', ['$rootScope', '$q', function ($rootScope, $q) {
  var DB_NAME = 'bhima', VERSION = 21;
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
    request.onupgradeneeded = function(event) {
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

    request.onsuccess = function(event) {
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
}]);

