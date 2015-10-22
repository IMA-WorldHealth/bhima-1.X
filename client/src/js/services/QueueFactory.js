angular.module('bhima.services')
.factory('QueueFactory', QueueFactory);

/**
* Queue
*
* A generic list providing add, remove, and totalling functionality to a list of
* tabular data.  Useful for controllers that want to create tables and lists on
* the fly but don't want to deal with the mechanics of adding, removing, etc.
*/
function Queue() {
  var service = this;

  // bind service properties
  service.queue = [];

  // bind service methods
  service.enqueue = enqueue;
  service.empty   = empty;
  service.total   = total;
  service.dequeue = dequeue;

  /* ------------------------------------------------------------------------ */

  // add a value to the end of the queue
  function enqueue(object) {
    service.queue.push(object);
  }

  // removes a single value at idx from the queue
  // returns the removed object
  function dequeue(idx) {
    return service.queue.splice(idx, 1);
  }

  // totals a single column in the queue.  Assumes that you want to sum the
  // elements.
  //
  // @todo allow override comparitor function
  function total(column) {
    if (service.queue.length === 0) { return 0; }

    return service.queue.reduce(function (accumulator, object) {
      return accumulator + object[column];
    }, 0);
  }

  // removes all data from the queue
  function empty() {
    service.queue.length = 0;
  }

  return service;
}

/**
* QueueFactory
*
* Returns instances of the Queue, to allow easy adding, removing, and totalling
* objects.  Useful when you want to generically handle tabular data in a
* controller.
*/
function QueueFactory() {
  return Queue;
}
