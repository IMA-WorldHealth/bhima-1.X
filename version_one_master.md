Meeting @ Safricas - 18/12/2013
-------------------------------

Summary 
-------
Meeting to discuss progress, status and vision for the kapok HIS. All goals and requirements
outlined in this document are with respect to kpk 'phase 1' specification, tentatively assigned
for February 2014.

Overview
-------- 
Discussion and required action topics are split into 6 key areas, all relating to acheiving 
the 02/14 date.

(1) Error Handling 
(2) Printing
(3) Testing
(4) Features
(5) Reporting
(6) Bug Fixes

(1) Error Handling 
------------------
-> Notification (messaging) service, error/info/warning/debug messages are displayed at the top
   right of the application for a specified period of time.
-> Errors bubble through server, sent to client and displayed uniformly, client errors should 
   be caught and handled.
-> Validation service
      -> Validate models
         Runs a number of tests on provided models, these can either be specified by the calling
         module or selected from pre-written tests - returns promise 
          -> Required model (the model must not be)

(4) Features
-----------------
-> Create a module that handles "journal vouchers", or any kind of account-to-account transfer 
   of funds.  The module should allow us to keep track of any arbitrary fund transfers in a 
   live hospital setting.
-> Exchange Rate/Currency module that registers daily, monthly, or periodly exchange rates and
   is configurable via either (1) the settings page or (2) the enterprise creation page.  The
   exchange rate is then global throughout the application and checked on every posting to the
   journal.

(6) Bug Fixes
----------------
-> All modules must respect "locks" placed on accounts, groups, and time periods.  If a locked
   item appears in a dropdown, it should be disabled and labeled as "item_name [locked]". Locks
   are configurable via the group/account/period creation pages.
-> Debitors/Creditors/Patients must all use the same unique identifier syntax or format so that
   all search boxes behave relatively the same throughout the application.
-> All modules that write to the database must use database-generated ids.  
-> Inventory registraton page must have meaningful units.  Unit type should then determine the
   display of unit weight and unit volume.

