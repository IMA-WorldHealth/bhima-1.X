/*global describe, it, beforeEach, process*/

// import testing framework
var chai = require('chai');
var chaiHttp = require('chai-http');
var expect = chai.expect;
chai.use(chaiHttp);

// workaround for low node versions
if (!global.Promise) {
  var q = require('q');
  chai.request.addPromises(q.Promise);
}

// do not throw self-signed certificate errors
process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;

// base URL
var url = 'https://localhost:8080';

/**
* The /users API endpoint
*
* This test suite implements full CRUD on the /users HTTP API endpoint.
*/
describe('The /users API endpoint', function () {
  var agent = chai.request.agent(url);
  var newUser = {
    username : 'newUser',
    password : 'newUser',
    projects : [1],
    email : 'newUser@test.org',
    first: 'new',
    last: 'user'
  };
  var badUser = {
    username : 'username',
    password : 'password',
  };

  // throw errors
  function handler(err) { throw err; }

  // login before each request
  beforeEach(function () {
    var user = { username : 'superuser', password : 'superuser', project: 1};
    return agent
      .post('/login')
      .send(user);
  });


  it('GET /users returns a list of users', function () {
    return agent.get('/users')
      .then(function (res) {
        expect(res).to.have.status(200);
        expect(res.body).to.not.be.empty;
        expect(res.body).to.have.length(4);
      })
      .catch(handler);
  });

  it('POST /users will add a valid user', function () {
    return agent.post('/users')
      .send(newUser)
      .then(function (res) {
        expect(res).to.have.status(201);
        expect(res.body).to.have.keys('id');

        // cache the user id
        newUser.id = res.body.id;
      })
      .catch(handler);
  });

  it('POST /users will reject an invalid user', function () {
    return agent.post('/users')
      .send(badUser)
      .then(function (res) {
        expect(res).to.have.status(400);
        expect(res.body).to.have.keys('code', 'reason', 'missingKeys');
        expect(res.body.code).to.be.equal('ERROR.ERR_MISSING_INFO');
        expect(res.body.missingKeys).to.have.length.above(2);
      })
      .catch(handler);
  });

  it('GET /users/:id/projects should not find one project assigned to the new user', function () {
    return agent.get('/users/' + newUser.id + '/projects')
      .then(function (res) {
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(res.body).to.have.length(1);
      })
      .catch(handler);
  });

  it('GET /users/:id will find the newly added user', function () {
    return agent.get('/users/' + newUser.id)
      .then(function (res) {
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(res.body.username).to.equal(newUser.username);
        expect(res.body.email).to.equal(newUser.email);
        expect(res.body.first).to.equal(newUser.first);
        expect(res.body.last).to.equal(newUser.last);
      })
      .catch(handler);
  });

  it('PUT /users/:id will update the newly added user', function () {
    return agent.put('/users/' + newUser.id)
      .send({ email : 'email@test.org' })
      .then(function (res) {
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(res.body.username).to.equal(newUser.username);
        expect(res.body.email).to.not.equal(newUser.email);

        // re-query the database
        return agent.get('/users/' + newUser.id);
      })
      .then(function (res) {
        expect(res).to.have.status(200);
        expect(res.body.email).to.equal('email@test.org');
      })
      .catch(handler);
  });

  it('PUT /users/:id will NOT update the new user\'s password', function () {
    return agent.put('/users/' + newUser.id)
      .send({ password : 'I am super secret.' })
      .then(function (res) {
        expect(res).to.have.status(400);
        expect(res).to.be.json;
        expect(res.body.code).to.equal('ERR_CANNOT_UPDATE_PASSWORD');
      })
      .catch(handler);
  });

  it('PUT /users/:id/password will update the new user\'s password', function () {
    return agent.put('/users/' + newUser.id + '/password')
      .send({ password : 'I am super secret.' })
      .then(function (res) {
        expect(res).to.have.status(200);
        expect(res).to.be.json;
      })
      .catch(handler);
  });

  it('DELETE /users/:id will delete the newly added user', function () {
    return agent.delete('/users/' + newUser.id)
      .then(function (res) {
        expect(res).to.have.status(204);
        expect(res.body).to.be.empty;
        return agent.get('/users/' + newUser.id);
      })
      .then(function (res) {
        expect(res).to.have.status(404);
      })
      .catch(handler);
  });

  it('DELETE /users/:id will send back a 404 if the user does not exist', function () {
    return agent.delete('/users/' + newUser.id)
      .then(function (res) {
        expect(res).to.have.status(404);
        expect(res.body).to.be.empty;
      })
      .catch(handler);
  });
});
