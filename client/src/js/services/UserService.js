angular.module('bhima.services')
.service('UserService', UserService);

UserService.$inject = [ '$http', 'util'];

/**
* User Service
*
* This service implements CRUD on the /users endpoint on the client.
*/
function UserService($http, util) {
  var service = this;

  service.create = create;
  service.read = read;
  service.update = update;
  service.delete = del;
  service.permissions = permissions;
  service.projects = projects;

  /* ------------------------------------------------------------------------ */

  // create a new user in the database
  function create(user) {
    return $http.post('/users', user)
    .then(util.unwrapHttpResponse);
  }

  // reads users from the database.
  // if an id is supplied with return a single user. Otherwise it will return a
  // list of users.
  function read(id) {
    var url = (id) ? '/users/' + id : '/users';

    return $http.get(url)
    .then(util.unwrapHttpResponse);
  }

  // updates a user with id
  function update(id, user) {
    return $http.put('/users/' + id, user)
    .then(util.unwrapHttpResponse);
  }

  // deletes a user with the given ID
  function del(id) {
    return $http.delete('/users/' + id)
    .then(util.unwrapHttpResponse);
  }

  // loads the user's permissions
  function permissions(id) {
    return $http.get('/users/' + id + '/permissions')
    .then(util.unwrapHttpResponse);
  }

  // loads the users's project permissions
  function projects(id) {
    return $http.get('/users/' + id + '/projects')
    .then(util.unwrapHttpResponse);
  }
}
