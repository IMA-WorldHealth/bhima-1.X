module.exports = function (credentials) {
  var credentials = credentials || {username : 'sfount', password : '1'};

  function login(client) { 
    
    client.url('http://localhost:8080');

    client.waitForElementVisible('body', 1000);
    
    client.assert.visible('input[name=username]')
      .setValue('input[name=username]', credentials.username)
      .setValue('input[name=password]', credentials.password);
    
    client.click('input[type=submit]');
    
    client.waitForElementVisible('div[id=kpk-tree]', 1000) 
      .assert.title('BHIMA');
  }

  function logout (client) { 
    
    client.click('a[name=logout]')
      .pause(1000)
      .assert.title('Login to BHIMA')
      .end();
  }

  function navigateTree (folder, node, client) { 
    client.click('i[name="' + folder + '"]')
      .click('span[name="' + node + '"]');
  }

  return { 
    login : login,
    navigateTree : navigateTree,
    logout : logout
  };
};
