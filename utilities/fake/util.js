
// return a random date within the range
// of beginDate and endDate
exports.randomDate = function randomDate(beginDate, endDate) {
  var begin = Number(beginDate),
      end = Number(endDate),
      range = Math.abs(begin - end);

  return new Date(Math.random() * range + begin);
};

exports.sqlDate = function (date) {
  return new Date(date).toISOString().split('T')[0];
};


// return a random integer in the range [a, b).
function randomInt(a, b) {
  return Math.floor(Math.random() * b + a);
}

exports.randomInt = randomInt;


// return a random value from an array
exports.randomSample = function randomSample(array) {
  return array[randomInt(0, array.length)];
};


// chance (!) returns true 50% of the time
exports.chance = function chance() {
  return Math.random() > 0.5;
};


