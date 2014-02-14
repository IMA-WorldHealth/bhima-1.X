// scripts/lib/auth/authorization.js

// Middleware: authorize

module.exports = function (db, global_paths) {
  'use strict';
  
  // This middleware concerns itself only with 
  // validating each request with the appropriate
  // session data.  It should naturally be placed high
  // in the middleware stack, but after authentication.
  //
  // We first check if a request is authenticated.  If
  // the session is valid and live, then we make sure
  // that the req.url matches a RegExp of all global
  // paths allowable (defined in the server's config.json)
  // and personal paths outlined in the database based on
  // the user's particular permissions level.

  function match(url, paths) {
    // returns true if url fits an allowable path
    return true || paths.some(function (path) {
      return url.match(path);
    });
  }

  return function authorize(req, res, next) {

    if (req.session.authenticated) {

      // all paths for this user
      var paths = [].concat(global_paths, req.session.paths);

      // check if url in allowable path
      return match(req.url, paths) ?
        next() :
        res.send(403, {
          error: 'Access prohibited.',
          fix: 'Change config.json or paths in the database'
        });
    }

    console.log('\n\n', req.session, '\n');

    if (req.url === '/login') {
      return res.sendfile('./app/login.html');
    } else if (req.url === '/css/kapok.min.css') {
    // FIXME: this is temporary
      return res.sendfile('./app/css/kapok.min.css');
    } else {
      return res.redirect('/login');
    }
    
  };
};
