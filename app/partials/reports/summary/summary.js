angular.module('kpk.controllers').controller('summaryController', function($scope, $q, $compile) { 
  console.log('summary initialised');

  const ROW_LENGTH = 2;

  $scope.reports = [[]];
  console.log($scope.reports);

  function Report(title, view) { 
    return {
      'title': title,
      'view': view
    }
  }
  
  function init() { 
    //check if the user has a settings configuration in appcache - load from this if it exists
    var configuration = [
      {title: "Cash Box", content: "content", view: "view"},
      {title: "Finance", content: "content", view: "view2"},
      {title: "Finance", content: "content", view: "view2"},
      {title: "Finance", content: "content", view: "view2"},
      {title: "Finance", content: "content", view: "view2"},
      {title: "Finance", content: "content", view: "view2"},
      {title: "Finance", content: "content", view: "view2"}

    ]

    configuration.forEach(function(report) { 
      addReport(report);
    })
  }

  function addReport(report) { 
    var currentGroup = $scope.reports[$scope.reports.length - 1];

    if(currentGroup.length >= ROW_LENGTH) { 
      currentGroup = [];
      $scope.reports.push(currentGroup);
    }
    currentGroup.push(report);
  }

  function summariseCash() { 

  }

  init();
});