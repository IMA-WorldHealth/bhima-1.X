var data = require('/server/controllers/data');
var report = require('/server/controllers/report');

/**
 * Initialise link between server paths and controller logic
 *
 * TODO Pass authenticate and authorize middleware down through 
 * controllers, allowing for modules to subscribe to different 
 * levels of authority
*/
exports.initialise = function (app) { 
  console.log('[routes.js] Initialise routes');

  app.post('data', data.create);
  app.get('data', data.read);
  app.put('data', data.update);
  app.delete('data', data.deleteRecord);
};
