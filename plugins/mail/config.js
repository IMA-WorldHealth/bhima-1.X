module.exports = {
  'emails' : [{
    'name' : 'daily',
    //*/3 * * * * (for test)
    'frequency' : '0 18 * * *', 
    'addressList' : 'developers',
  }, {
    'name' : 'weekly',
    // */2 * * * * (for test)
    'frequency' : '0 19 * * 7',
    'addressList' : 'wk'
  }, {
    'name' : 'monthly',
    'frequency' : '*/1 * * * *',// */1 * * * * (for test)//'0 20 28-31 * *', 
    // 'frequency' : '0 20 28-31 * *',
    'addressList' : 'test'
  }]
}