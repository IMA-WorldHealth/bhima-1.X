angular.module('bhima.services')
.service('StateManagerService', StateManagerService);

function StateManagerService() {
  var service = this;

  var messages = {
    created : { type : 'success', code : 'STATE.CREATED' },
    updated : { type : 'success', code : 'STATE.UPDATED' },
    deleted : { type : 'success', code : 'STATE.DELETED'  },
    errored : { type : 'danger', code : 'STATE.ERRORED' },
  };

  var states = {
    create:  'create',
    created: 'created',
    delete:  'delete',
    deleted: 'deleted',
    updated: 'updated',
    update:  'update',
    errored: 'errored'
  };

  service.create = create;
  service.created = created;
  service.default = deflt;
  service.delete = service.del;
  service.deleted = service.deleted;
  service.errored = service.errored;
  service.update = service.update;
  service.updated = service.updated;
  service.states = states;

  /* ------------------------------------------------------------------------ */

  function create() {
    service.state = states.create;
  }

  function created() {
    service.state = states.created;
    service.message = messages.created;
  }

  function del() {
    service.state = states.delete;
  }

  function deleted() {
    service.state = states.deleted;
    service.message = messages.deleted;
  }

  // default message is blank
  function deflt() {
    service.state = '';
    service.message = '';
  }

  function errored() {
    service.state = states.errored;
    service.message = messages.errored;
  }

  function update() {
    service.state = states.update;
  }

  function updated() {
    service.state = states.updated;
    service.message = messages.updated;
  }

  return service;
}
