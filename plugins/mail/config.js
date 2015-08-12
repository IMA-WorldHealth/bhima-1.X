module.exports = {
  'emails' : [{
    'name' : 'daily',
    'frequency' : '0 23 * * *',
    //'frequency' : '*/1 * * * *', // every minute
    'addressList' : 'developers',
  }, {
    'name' : 'weekly',
    'frequency' : '0 0 * * 5',
    'addressList' : 'developers'
  }, {
    'name' : 'monthly',
    'frequency' : '0 0 1 * *',
    'addressList' : 'developers'
  }]
};
