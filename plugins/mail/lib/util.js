var util = exports;
var sessionDate = new Date();

util.setDate = function (date) {
  sessionDate = date;
};

util.date = configureDate();


util.generateUuid = function () { 
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0,
    v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

function configureDate() { 
  
  // Handle requests for tables with only timestamp fields
  var dateFrom = "\'" + sessionDate.getFullYear() + "-0" + (sessionDate.getMonth() + 1) + "-" + sessionDate.getDate() + " 00:00:00\'";
  var dateTo = "\'" + sessionDate.getFullYear() + "-0" + (sessionDate.getMonth() + 1) + "-" + (sessionDate.getDate() + 1)  + " 00:00:00\'"; 
  
  return { 
    from : dateFrom,
    to : dateTo
  };
}
