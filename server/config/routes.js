// Controllers 
var data = require('./../controllers/data');

// TODO createPurchase, createSale etc. could be combined in one module named finance 
// finance.createSale
var createPurchase = require ('./../controllers/createPurchase');
var createSale = require('./../controllers/createSale');

var serviceDist = require('./../controllers/serviceDist');
var consumptionLoss = require('./../controllers/consumptionLoss');

/**
 * Initialise link between server paths and controller logic
 *
 * TODO Pass authenticate and authorize middleware down through 
 * controllers, allowing for modules to subscribe to different 
 * levels of authority
*/
exports.initialise = function (app) { 
  console.log('[routes.js] Initialise routes');

  app.post('/data/', data.create);
  app.get('/data/', data.read);
  app.put('/data/', data.update);
  app.delete('/data/', data.deleteRecord);

  app.post('/purchase', createPurchase.execute);

  app.post('/sale/', createSale.execute);

  app.post('/service_dist/', serviceDist.execute);

  app.post('/consumption_loss/', consumptionLoss.execute);
};





//Temporary (for C + V) 
/*
var db = require('./../lib/db');
var parser = require('./../lib/parser');
var journal = require('./journal');
var uuid = require('./../lib/guid');
*/


