Bug Squashing
========================
### Key:
[x] Indicates Fixed
[ ] Not yet fixed

### Bugs:
#### Settings
[ ] The "back" button on the settings page appends a perminent query string to the url,
which messes up page refresh.
#### Enterprise Registration
[x] The enterprise registration page should provide a way of know if changes have been saved.
[ ] The enterprise page cannot print.
[x] Invalid phone numbers and emails are allowed in the enterprise config form.
[ ] Selecting cash and currency accounts should notify the user that there is no chart of accounts.
#### Login/Logout
[x] Error during /logout does not eliminate the session data.
[x] Angular captures the logout request and throws internal errors.
[x] Login attempts after logout are captured by angular and throw internal errors.
[ ] Routes still loaded from config.json file.
#### Creditor Group Mgmt
[x] Account selects are not ordered properly

#### Fiscal Year
[ ] Opening balances still has button for randomly generating data

#### Exchange Rate
[ ] Exchange rate should refresh the daily exchange rate

#### CashBox
[ ] Cashbox should lock up if exchange rate is not available
[ ] Cashbox should allow adjusting amounts on an invoice to invoice basis.
