### Important ###
 # Debtor ID is currently numeric, and is the same as Patient ID, it should be alpha numeric to allow debitors and patients to be debtor (? p12, e13 etc.)

#Temporary TODO
  -Register any changes in module with a service, this should be checked before any navigation is allowed
  -/Remove Bootstrap.css (yw @jniles), too much padding and white space, design simple and compact layout using normalise etc. (see the GNU thing)/
  -Style for Fiscal Year, Enterprise Select and Application Utility buttons (This should not just be default bootstrap)
  - Register any changes in module with a service, this should be checked before any navigation is allowed
  - Style for Fiscal Year, Enterprise Select and Application Utility buttons (This should not just be default bootstrap)
  - Register the user information in a service, potentially AppState()

### invoicing module ###
 * Currenly only supports invoicing patient debitors and not debitors in general, looking up and processing debitors should be reworked


* Have a service that holds the current user information
Ask Manunga how the accounting works in the hospital.
 - How billing of patients in beds in hospital wards takes place.

* Pick one: sockets or http
* Migrate to using grunt for building
* Serve static content from a cookieless domains.
* 
