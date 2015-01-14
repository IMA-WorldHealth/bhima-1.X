FindAccount Directive
=====================

To use the *findAccount* directive, insert the following into your HTML file:

    <div find-account on-search-complete="selectAccount" on-submit="submitAccount"></div>

The required attributes are:

  * `submitAccount` is a callback function that will be called when
    the [Submit] button on the right side of the account selection
    input field is pressed.  It is called with the selected
    account.  Note that the submit button will not be enabled until
    an account is selected.

Optional attributes:

  * `selectAccount` is an optional callback function that will be
    called by the *findAccount* directive when an account is
    selected.  Its argument is either the selected account object
    or null (if the input field is reset).  This function should
    also save the account data for later use.
  
  * `enable-reset` tells the directive to add a reset button on
    the right end of the account selection input field.  When
    pressed, the current account selection will be cleared and the
    `selectAccount` will be called with `null` as its argument.
    Add it as an attribute like this:

       enable-reset

  * `on-reset` sets a callback function that will be called if the
    form's reset button is pressed.  This gives the invoking page a
    chance to reset its internal data if selected account is
    rejected.  Add the attribute as follows:

       on-reset="resetFunction"
