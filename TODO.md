### Important ###
 # FIXME Any modules that generate IDs have a risk of clashing if two executed at the same time
 # Debtor ID is currently numeric, and is the same as Patient ID, it should be alpha numeric to allow debitors and patients to be debtor (? p12, e13 etc.)
 # Attempt to remove ALL functions from templates (performed on every digest)

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
 - Ask Manunga how the accounting works in the hospital.
 - How billing of patients in beds in hospital wards takes place.

* Migrate to using HTTP only
* Serve static content from a cookieless domains.

## Other
 - Fix up journal code 
