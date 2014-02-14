#Meeting@Safricas 13/02/2014

##Enterprises
|Design |
[] - Enterprises must share data (i.e Clinic and hospital using the same chart
of accounts)

[] Enterprises must have relationships and heirarchy

##Posting Journal
|Features |Bugs |Refactor |
[] - Super User - delete lines/ edit any cell, altering the balance of any 
transaction

[] - Bug fixes (see bug.md)

[] - Font/ display must be larger

[] - Trial balance must remember which records were analysed and only post them,
no new records

[] - Posting Journal, General Ledger and trial balance must have utilites to 
print and export to CSV and Excel

[] - Splitting and adding transactions must be rolled back given an error 
(generally should be applied to any transaction consisting of multiple parts)

##Patient Registration 
|Features |
[] - Optionally store picture of patient along with other information, this can
then be used during patient lookup for verification and should mitigate
duplication of patient records

##Chart of Accounts
|Design |Bugs |
[] - Accounts parent relationships should reference account_id not
account_number

[] - Transition (throwaway) columns to add other reference account numbers and 
descriptions 

##Patient Groups
|Design |Bugs |
[x] - Privacy issues with groups, should not be known to everyone (cannot be 
assigned at patient registration)

[] - Design of patient groups: Do they have to be assigned and signed by a 
doctor? Are there multiple levels privacy/ value?

##Exchange Rates
|Features |
[] - Exchange rate should be defined for $100 to resolve rounding issues

[] - Enterprise should gain and lose money on exchange (exchange for current 
day differs from the day of the sale, dollars purchased could have changed
value)

##Reports
|Features |Bugs |
[] - Certain reports must be filterable my specific accounts/ time periods

[] - All reports must be print friendly (preferably using a similar style)

[] - General General Ledger report, lookup any account for any given time
period.

[] - Running totals for accounts and balances

##Sales 
|Features |Design |
[] - Assembly sale items - multiple lines that hit multiple accounts (i.e 
consulation consists of consulting (7.50) and a fiche (0.50)
  [] - John Clark - inventory management

[] - Stock consumption design 

##Receipts 
|Features | 
[] - Branding/logo and name of hospital on all receipts / reports

##Purcahse orders and inventory
|Bugs |
[] - Basic purcahse order functionality, system ability to move money from cash
to assets (also see stock consumption)

[] - Resolve broken stock registration

##Application Branding 
|Features |
[] - Logo, name and fonts

[] - ukaid branding - paid for by the people of Britain

##MySQL Backup 
|Features | 
