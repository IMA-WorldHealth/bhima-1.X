var map = { e  : 'entities',
            jc : 'jcond',
            c  : 'cond',
            r  : 'rows',
            t  : 'table',
            o  : 'orderby',
            u  : 'updateInfo',
            l  : 'limit'
};

function hasMap(key) {
  return map[key] ? true : false;
}

function getQueryObj(objRequest) {
  var base = {}, key, name;
  if (!objRequest) { return true; }  
  for (key in objRequest) {
    name = hasMap(key) ? map[key] : key;
    base[name] = objRequest[key];
  }
  return base;
}

exports.getQueryObj = getQueryObj;
