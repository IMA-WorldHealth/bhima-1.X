// scripts/lib/error/handler

// default error handling behavoir
module.exports = function (err, req, res, next) {
  console.error('\n', 'Sending Error: ', err, '\n');
  res.json(500, err);
};
