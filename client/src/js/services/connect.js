angular.module('bhima.services')
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
    if (!column) column = 'id';
    return $http.delete(['/data/', table, '/', column, '/', id].join(''));
  }

  //  TODO reverse these two methods? I have no idea how this happened
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
      if (k !== '$$hashKey' && angular.isDefined(obj[k]) && obj[k] !== '' && obj[k] !== null) cleaned[k] = obj[k];
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
}]);
