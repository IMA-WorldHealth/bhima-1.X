// angular.module('bhima.controllers')
// .controller('journal.grid', [
//   '$scope',
//   '$q',
//   'validate',
//   function ($scope, $translate, $filter, $q, precision, validate, appstate) {
//     var options, grid, checkboxSelector,
        

//     function initialise (models) {
      

//       populate();
//     }    

//     function populate() {
//       $scope.journal_bis.data = $scope.journal_bis.data.map(function (item) {
//         item.trans_date = new Date(item.trans_date);
//         return item;
//       });

//       expose();
//     }

//     function expose () {
//       ready.resolve([grid, columns, dataview, options, manager]);
//     }    

//     validate.process(dependencies)
//     .then(initialise)
//     .catch(function (error) {
//       ready.reject(error);
//     });
//   }
// ]);
