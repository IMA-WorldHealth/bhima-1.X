Bug Squashing
========================
### Key:
[x] Indicates Fixed
[ ] Not yet fixed

### Bugs:

#### Settings
[x] The "back" button on the settings page appends a perminent query string to the url,
which messes up page refresh.

#### Enterprise Registration
[x] The enterprise registration page should provide a way of know if changes have been saved.
[x] The enterprise page cannot print.
[x] Invalid phone numbers and emails are allowed in the enterprise config form.
[ ] Selecting cash and currency accounts should notify the user that there is no chart of accounts.
[x] Editing does not work.
[x] Editing the *current* enterprise should update appstate with new changes.

#### Login/Logout
[x] Error during /logout does not eliminate the session data.
[x] Angular captures the logout request and throws internal errors.
[x] Login attempts after logout are captured by angular and throw internal errors.
[x] Authorization.js does not filter access on user permissions.
[x] System blocks people who are logged in from accessing the application.

#### Creditor Group Mgmt
[x] Account selects are not ordered properly

#### Fiscal Year
[x] Opening balances still has button for randomly generating data
[ ] Opening balances take forever to load.
[x] Opening balances do not have proper currency formatting.

#### Exchange Rate
[x] Exchange rate should refresh the daily exchange rate
[x] Exchange rate does not support $100 -> X exchanges
[ ] Currency format only supports two decimal places
[x] Database only stores 2 decimal digits, screwing up 1000-1 rates.

#### CashBox
[x] Cashbox should lock up if exchange rate is not available
[ ] Cashbox should allow adjusting amounts on an invoice to invoice basis.
[x] Cashbox cannot post multiple invoices, only one (the first) invoice is posted.
[ ] Post a warning if no debitor invoices are found.
[ ] Formatting on "find patient" needs some love on smaller screens.
[ ] Cashbox submits even if no exchange rate is found.

#### Sales
[ ] Issue a warning to the user if a fiscal year does not exist.
[x] The submit button should be green, like everything else.

#### Opening Balance
[ ] Error when trying to post 0 record opening balances.
[ ] Opening balance modal is terribly slow.

#### Patient Registration
[ ] No indication whether the patient has been registered or not.
[x] Poorly formatted location selects on smaller screens
[x] Location selects do no register dependencies.

#### Posting Journal
[x] Only the lines concerning the patient's accounts should be recorded with their id.
[x] Sometimes, two invoice/po numbers are associated with one transaction.
