/*global describe, it, beforeEach, process*/

var chai = require('chai');
var chaiHttp = require('chai-http');
var expect = chai.expect;
chai.use(chaiHttp);

// workaround for low node versions
if (!global.Promise) {
  var q = require('q');
  chai.request.addPromises(q.Promise);
}

// environment variables - disable certificate errors
process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;

// base URL
var url = 'https://localhost:8080';
var user = { username : 'superuser', password : 'superuser', project: 1};

/**
* The /cashboxes API endpoint
*/
describe('The /cashboxes API endpoint', function () {
  var agent = chai.request.agent(url);

  // constants
  var NUMBER_OF_CASHBOXES = 2;
  var NUMBER_OF_AUX_CASHBOXES = 1;
  var NUMBER_OF_CASHBOX_CURRENCIES = 2;

  // throw errors
  function handler(err) { throw err; }

  // login before each request
  beforeEach(function () {
    return agent
      .post('/login')
      .send(user);
  });

  it('GET /cashboxes returns a list of cashboxes', function () {
    return agent.get('/cashboxes')
      .then(function (res) {
        expect(res).to.have.status(200);
        expect(res.body).to.not.be.empty;
        expect(res.body[0]).to.contain.keys('id', 'text');
        expect(res.body).to.have.length(NUMBER_OF_CASHBOXES);
      })
      .catch(handler);
  });

  it('GET /cashboxes?is_auxillary=1 returns only auxillary cashboxes', function () {
    return agent.get('/cashboxes?is_auxillary=1')
      .then(function (res) {
        expect(res).to.have.status(200);
        expect(res.body).to.not.be.empty;
        expect(res.body).to.have.length(NUMBER_OF_AUX_CASHBOXES);
      })
      .catch(handler);
  });

  it('GET /cashboxes/:id should return a single cashbox with currencies', function () {
    return agent.get('/cashboxes/1')
      .then(function (res) {
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(res.body).to.not.be.empty;
        expect(res.body).to.contain.keys('currencies', 'id', 'text');
        expect(res.body.currencies).to.have.length(NUMBER_OF_CASHBOX_CURRENCIES);
      })
      .catch(handler);
  });

  it('GET /cashboxes/:id should return a 404 for invalid cashbox', function () {
    return agent.get('/cashboxes/invalid')
      .then(function (res) {
        expect(res).to.have.status(404);
      })
      .catch(handler);
  });

});
