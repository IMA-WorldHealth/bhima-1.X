// scripts/lib/auth/authorization.js

// Middleware: authorize


module.exports = (function (db, global_paths) {

  function authorize (req, res, next) {

    if (req.session.logged_in) {

      // all paths for this user
      var paths = [].concat(global_paths, req.session.paths);

      // check if url in allowable path
      if (match(req.url, paths)) next();
      else {
        console.log('Prohibited url blocked by authorization.js :', req.url);
        res.send(403, {error: "Access prohibited."});
      }
      return;
    }


    if (req.url === "/login") res.sendfile('./app/login.html');
    else res.redirect('/login');
    
  }

  function match (url, paths) {
    // returns true if url fits an allowable path
    return paths.some(function (path) {
      return url.match(path); 
    });
  }

  return authorize;

});
