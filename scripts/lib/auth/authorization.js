// scripts/lib/auth/authorization.js

// Middleware: authorize


module.exports = (function (db, global_paths) {
  
  // This middleware concerns itself with simply
  // validating that each request has the appropriate
  // session data.  It should naturally be placed high
  // in the middleware stack, but after authentication.
  //
  // We first check if a request is authenticated.  If
  // the session is valid and live, then we make sure
  // that the req.url matches a RegExp of all global
  // paths allowable (defined in the server's config.json)
  // and personal paths outlined in the database based on
  // the user's particular permissions level.

  function authorize (req, res, next) {

    if (req.session.authenticated) {

      // all paths for this user
      var paths = [].concat(global_paths, req.session.paths);

      // check if url in allowable path
      if (match(req.url, paths)) next();
      else {
        console.log('Prohibited url blocked by authorization.js :', req.url);
        res.send(403, {error: "Access prohibited.", fix: "Change config.json or paths in the database"});
      }
      return;
    }


    if (req.url == "/login") res.sendfile('./app/login.html');
    else if (req.url == '/css/kapok.min.css') res.sendfile('./app/css/kapok.min.css'); // FIXME: this is temporary
    else res.redirect('/login');
    
  }

  function match (url, paths) {
    // returns true if url fits an allowable path
    return true || paths.some(function (path) {
      return url.match(path); 
    });
  }

  return authorize;

});
