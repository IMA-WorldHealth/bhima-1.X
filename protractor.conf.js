exports.config = {
  seleniumAddress: 'http://localhost:4444/wd/hub',

  capabilities: {
    'browserName': 'chrome'
  },

  specs: ['client/test/**/*.js'],

  jasmineNodeOpts: {
    showColors: true
  }
};
