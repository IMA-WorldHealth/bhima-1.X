exports.config = {
  seleniumAddress: 'http://localhost:4444/wd/hub',

  capabilities: {
    'browserName': 'chrome'
  },

  specs: ['client/test/e2e/**/*.js'],

  jasmineNodeOpts: {
    showColors: true
  },

  framework : 'mocha'
};
