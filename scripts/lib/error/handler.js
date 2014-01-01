// scripts/lib/error/handler

// default error handling behavoir
module.exports = function (err, req, res, next) {
  console.log('\nError: ', err, '\n');
  res.send(500, err);
};
