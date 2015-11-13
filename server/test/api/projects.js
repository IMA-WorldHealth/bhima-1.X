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
* The /projects API endpoint
*
* This test suite implements full CRUD on the /projects HTTP API endpoint.
*/
describe('The /projects API endpoint', function () {
  var agent = chai.request.agent(url);

  // throw errors
  function handler(err) { throw err; }

  // login before each request
  beforeEach(function () {
    var user = { username : 'superuser', password : 'superuser', project: 1};
    return agent
      .post('/login')
      .send(user);
  });


  it('GET /projects returns a list of projects', function () {
    return agent.get('/projects')
      .then(function (res) {
        expect(res).to.have.status(200);
        expect(res.body).to.not.be.empty;
      })
      .catch(handler);
  });

  // TODO -- this is super lazy.  Make it testable!
  it('DELETE /projects/:id will send back a 404 if the prjects does not exist', function () {
    return agent.delete('/projects/' + Math.random())
      .then(function (res) {
        expect(res).to.have.status(404);
        expect(res.body).to.be.empty;
      })
      .catch(handler);
  });
});
