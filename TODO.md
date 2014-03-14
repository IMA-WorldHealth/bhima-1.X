### Important ###
 # Debtor ID is currently numeric, and is the same as Patient ID, it should be alpha numeric to allow debitors and patients to be debtor (? p12, e13 etc.)
 # Attempt to remove ALL functions from templates (performed on every digest)
 # Error handling

#Temporary TODO
  - Register any changes in module with a service, this should be checked before any navigation is allowed
  - /Remove Bootstrap.css (yw @jniles), too much padding and white space, design simple and compact layout using normalise etc. (see the GNU thing)/

### Invoicing module ###
 * Currenly only supports invoicing patient debitors and not debitors in general, looking up and processing debitors should be reworked

### General
 - Serve static content from a cookieless domains.
 - Remove unused CSS rules
 - !IMPORTANT :: add aliasing to connect.req();

### Grunt
  - Minify all CSS and Angular code.
  - Create a release directory, which all code is built to.

