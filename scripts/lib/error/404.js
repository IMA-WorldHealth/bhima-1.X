// 404.js
// As according to the express website, http://expressjs.com/faq.html, 
// 404 errors do not generate errors.  To capture errors, will send a 404
// error alert to the client.

exports = module.exports = function (req, res, next) {
  // Send a 404 page to the client
  res.status(404);
  res.set('Content-Type', 'text/html');
  res.end('<h1>404 Content Not Found</h1>');
};
