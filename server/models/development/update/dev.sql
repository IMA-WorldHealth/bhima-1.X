-- This file defines updates to the core BHIMA sql that are for development 
-- purposes only. If these changes are to be commited to the core SQL they should
-- be added to the update file and included at the next version upgrade

-- @sfount
-- Define report development routes 
-- 26/09/2015
INSERT INTO unit (`id`, `name`, `key`, `description`, `parent`, `url`, `path`) VALUES

-- Development folder
(120, 'Development', 'TREE.DEVELOPMENT.TITLE', 'Development', 0, '/partials/development', '/development'),
(121, 'Income Expense', 'TREE.DEVELOPMENT.INCOME_EXPENSE', 'Income Expense Report', 120, '/partials/development/reports', '/development/report/income_expense'),
(122, 'Chart of Accounts', 'TREE.DEVELOPMENT.CHART_OF_ACCOUNTS', 'Income Expense Report', 120, '/partials/development/reports', '/development/report/chart_of_accounts'),
(123, 'Patient Invoices', 'TREE.DEVELOPMENT.PATIENT_INVOICES', 'Income Expense Report', 120, '/partials/development/reports', '/development/report/patient_invoices');
