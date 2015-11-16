
angular.module('bhima.controllers')
.controller('PermissionsPasswordModalController', ModalController);

ModalController.$inject = [ '$modalInstance', 'UserService', 'user' ];

/**
* Permissions Passsword Modal Controller
*
* This controller is responsible for changing a user's password.  Provides a
* simply modal interface to
*/
function ModalController($modalInstance, Users, user) {
  var vm = this;

  vm.user = angular.copy(user);

  vm.validPassword = validPassword;
  vm.submit = submit;
  vm.cancel = cancel;

  /* ------------------------------------------------------------------------ */

  // checks if a vaid password exists
  function validPassword() {
    return vm.user.password &&
      vm.user.passwordVerify &&
      vm.user.password.length &&
      vm.user.passwordVerify.length &&
      vm.user.password === vm.user.passwordVerify;
  }

  // submits the password form
  function submit(invalid) {
    if (invalid) { return; }

    // try to update the user's passsword
    Users.updatePassword(vm.user.id, { password : vm.user.password })
    .then(function () {
      $modalInstance.close();
    })
    .catch(function (error) {
      console.log(error);
    });
  }

  function cancel() {
    $modalInstance.dismiss();
  }

}
