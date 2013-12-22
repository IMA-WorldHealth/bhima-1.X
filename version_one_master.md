Meeting @ Safricas - 18/12/2013
-------------------------------

Summary 
-------
Meeting to discuss progress, status and vision for the kapok HIS. All goals and requirements
outlined in this document are with respect to kpk 'phase 1' specification, tentatively assigned
for February 2014.

Overview
-------- 
Discussion and required action topics are split into 5 key areas, all relating to acheiving 
the 02/14 date.

(1) Error Handling 
(2) Printing
(3) Testing
(4) Features
(5) Reporting

(1) Error Handling 
------------------
- Notification (messaging) service, error/info/warning/debug messages are displayed at the top
    right of the application for a specified period of time.
- Errors bubble through server, sent to client and displayed uniformly, client errors should 
    be caught and handled.
- Validation service
    - Validate models
			Runs a number of tests on provided models, these can either be specified by the calling
      module or selected from pre-written tests - returns promise 
      - Required model (the model must not be empty etc.)
      - Filter function across every item in model, throw error on failure
		- Validate application components
			Verify that essential components (fiscal years, enterprises, database records) etc. exist, tests
			are not concerned with logic, just existence. All of these tests should be run on application startup
			and provided to units that require them.
			- Units can require components
- Propegate errors from journal (on the server) to the client - return error messages for missing fiscal years etc.

(2) Printing 
------------
- Determine best method for printing receipts/ invoices/ reports
	- Server/ Client PDF
	- CSS rules
- Implement printing for patient records, receipts and reports
- Printing documentation (print.md - lay out method of printing for everyone to implement in modules)

(3) Testing 
-----------

(4) Features
------------
-	Location creation interface 

(5) Reporting
------------- 
