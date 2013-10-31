#Temporary TODO
  -Register any changes in module with a service, this should be checked before any navigation is allowed
  -/Remove Bootstrap.css (yw @jniles), too much padding and white space, design simple and compact layout using normalise etc. (see the GNU thing)/
  -Style for Fiscal Year, Enterprise Select and Application Utility buttons (This should not just be default bootstrap)
  - Register any changes in module with a service, this should be checked before any navigation is allowed
  - Smart-table TODOs
  -- Add support for multiple select (requires data.objectstore()) from a <smart-table>
  -- Add support for custom footers for <smart-table>
  -- Add support for infinite scrolling/Virtual Scrolling to <smart-table>
  - Register any changes in module with a service, this should be checked before any navigation is allowed
  - Style for Fiscal Year, Enterprise Select and Application Utility buttons (This should not just be default bootstrap)

### invoicing module ###
 * Currenly only supports invoicing patient debitors and not debitors in general, looking up and processing debitors should be reworked
### util.js ###
 * Create a file called util.js with utility functions including:
 ** util.mixin(object1, object2) -- mixes (deep copy) two objects together.
 
### data.js ###
 * Create a file called data.js to keep "stores" in.
 ** data.objectstore() -- Essentially a clone of the Dojo Memory store,
     perhaps with an updated API.

### Notifications ### 
 * use new Notification() (supported by Chrome and FireFox) to send the client messages!

### Design decisions ###
- SocketService: Use `factory` function.
-- Should we be optimistic and expect to never have data corruption?
-- Should we embed error methods?
-- What is the API?
--- Is everything wrapped in $q.get()'s?
--- Do we use Node.js style, SocketService.get(function(data, err) { ... }) ?
-- Add flag for `fragmented` or `non-fragmented` synchronization
----> Fragmented implies that [{packet1}, {packet2}, {packet3}] will each get a separate socket.send()
