use `kpk`;

delete from `posting_journal`;
delete from `general_ledger`;
delete from `transaction_type`;
delete from `patient`;
delete from `debitor`;
delete from `debitor_group`;
delete from `permission`;
delete from `unit`;
delete from `account`;
delete from `account_type`;
delete from `payment`;
delete from `exchange_rate`;
delete from `currency`;
delete from `inventory`;
delete from `inventory_unit`;
delete from `inventory_group`;
delete from `inventory_type`;
delete from `cash_item`;
delete from `cash`;
delete from `purchase`;
delete from `user`;
delete from `period`;
delete from `period_total`;
delete from `fiscal_year`;
delete from `enterprise`;
delete from `country`;
delete from `province`;
delete from `sector`;
delete from `village`;
delete from `sale`;
delete from `patient_group`;
delete from `price_list`;

-- registered units
INSERT INTO `unit` VALUES (0,'Root','TREE.ROOT','The unseen root node',NULL,1,'/partials/index.html','/root'),
(1,'Admin','TREE.ADMIN','The Administration Super-Category',0,1,'/partials/admin/index.html','/admin'),
(2,'Enterprise','TREE.ENTERPRISE','Manage the registered enterprises from here',1,0,'/partials/enterprise/','/enterprise'),
(4,'Users & Permissions','TREE.PERMISSION','Manage user privileges and permissions',1,0,'/partials/user_permission/','/permission'),
(5,'Finance','TREE.FINANCE','The Finance Super-Category',0,1,'/partials/finance/','/finance'),
(6,'Account','TREE.ACCOUNT','Chart of Accounts management',1,0,'/partials/accounts/create_account/','/create_account'),
(8,'Budgeting','TREE.BUDGETING','Plan your next move',0,10,'/partials/budget/index.html','/budget'),
(9,'Posting Journal','TREE.POSTING_JOURNAL','Daily Log',5,0,'/partials/journal/','/posting_journal'),
(10,'Reports','TREE.REPORTS','Do stuff and tell people about it',0,1,'/partials/reports/summary/','reports/summary'),
(11,'Inventory','TREE.INVENTORY','The Inventory Super-Category',0,1,'/partials/inventory/index.html','/inventory'),
(21,'Hospital','TREE.HOSPITAL','The Hospital Super-Category',0,1,'/partials/hospital/index.html','/hospital'),
(30,'Fiscal Year','TREE.FISCAL_YEAR','Fiscal year configuration page',1,0,'/partials/fiscal/','/fiscal'),
(31,'Patient Registration','TREE.PATIENT_REG','Register patients',21,0,'/partials/patient_registration/','/patient'),
(33,'Patient Records','TREE.PATIENT_RECORDS','Search for patient',21,0,'/partials/records/patient_records/','/patient_records/'),
(34,'Sales','TREE.SALES','Create an invoice for a sale',5,0,'/partials/sales/','/sales/'),
(35,'Sale Records','TREE.SALE_RECORDS','Search for a sale',5,0,'/partials/records/sales_records/','/sale_records/'),
(36,'Purchase Order','TREE.PURCHASE_ORDER','Create a new Purchase Order',11,0,'/partials/purchase_order/','/inventory/purchase'),
(37,'Budget by Account','TREE.BUDGET_BY_ACCOUNT','Budgeting by account',8,0,'/partials/budget/','/budgeting/'),
(38,'Cash Box','TREE.CASH','Pay invoices',5,0,'/partials/cash/','/cash'),
(39,'Register Stock','TREE.REGISTER_STOCK','',11,0,'/partials/inventory/register/','/inventory/register'),
(40,'Register Supplier','TREE.REGISTER_SUPPLIER','',11,0,'/partials/inventory/creditor/','/creditor'),
(41,'Purchase Order Records','TREE.PURCHASE_ORDER_RECORDS','',5,0,'/partials/records/purchase_order_records','/purchase_records/'),
(43,'Finance','TREE.REPORT_FINANCE','',10,0,'/partials/reports/finance/','/reports/finance'),
(45,'Price List','TREE.PRICE_LIST','Configure price lists!',1,0,'/partials/price_list/','/inventory/price_list'),
(46,'Exchange Rate','TREE.EXCHANGE','Set todays exchange rate!',1,0,'/partials/exchange_rate/','/exchange_rate'),
(47,'Transaction Report','TREE.REPORT_TRANSACTION','',10,0,'/partials/reports/transaction_report/','/reports/transaction_report'),
(48,'Creditor Groups','TREE.CREDITOR_GRP','',1,0,'/partials/creditor/group/','/creditors/creditor_group'),
(49,'Debitor Groups','TREE.DEBTOR_GRP','',1,0,'/partials/debitor/','/debitor/debitor_group'),
(50,'Inventory View','TREE.INVENTORY_VIEW','',11,0,'/partials/inventory/view/','/inventory/view'),
(51,'General Ledger','TREE.GENERAL_LEDGER','',10,0,'/partials/reports/ledger/','/reports/ledger/general_ledger'),
(52,'Location Manager','TREE.LOCATION','',1,0,'/partials/location/location.html','/location'),
(54,'Chart of Accounts','TREE.CHART_OF_ACCOUNTS','',10,0,'/partials/reports/chart_of_accounts/','/reports/chart_of_accounts/'),
(55,'Debitor Aging','TREE.DEBTOR_AGING','',10,0,'/partials/reports/debitor_aging/','/reports/debitor_aging/'),
(56,'Account Statement By Period','TREE.ACCOUNT_STATEMENT','',10,0,'/partials/reports/account_statement/','/reports/account_statement/'),
(57,'Income Expensive Balance','TREE.INCOME_EXPENSE','',10,0,'/partials/reports/income_expensive/','/reports/income_expensive/'),
(58,'Credit Note','TREE.CREDIT_NOTE','',5,0,'/partials/credit_note/','/credit_note/'),
(60,'Patient Group Assignment','TREE.PATIENT_GRP_ASSIGNMENT','',21,0,'/partials/patient_group_assignment/','/patient_group_assignment/'),
(61,'Patient Group','TREE.PATIENT_GRP','',1,0,'/partials/patient_group/','/patient_group/'),
(62,'Accounting','TREE.ACCOUNTING','',0,1,'/partials/accounting/index.html','/accounting/'),
(63,'Cost Center Management','TREE.COST_CENTER_MGMT','',62,0,'/partials/cost_center/','/cost_center/'),
(64,'Group Invoicing','TREE.GRP_INVOICING','',5,0,'/partials/group_invoice/','/group_invoice/'),
(65,'Currency','TREE.CURRENCY','',1,0,'/partials/currency/','/currency'),
(66,'Patient Renewal','TREE.RENEWAL','',21,0,'/partials/patient_renewal/','/renewal'),
(67,'Patient Registrations','TREE.PATIENT_REGISTRATION','',10,0,'/partials/reports/patient_registrations/','/reports/patient_registrations'),
(68,'Update Stock','TREE.UPDATE_STOCK','',11,0,'/partials/update_stock/','/update_stock/'),
(69,'Change Patient Group','TREE.SWAP_DEBITOR','',21,0,'/partials/swap_debitor/','/swap_debitor/'),
(70,'Cash Payments','TREE.CASH_PAYMENTS','',10,0,'/partials/reports/cash_payments/','/reports/cash_payments'),
(71,'Report All Transactions','TREE.ALL_TRANSACTIONS','',10,0,'/partials/reports/all_transactions/','/reports/all_transactions'),
(72,'Caution','TREE.CAUTION','',5,0,'/partials/caution/','/caution'),
(73,'Extra','TREE.EXTRA','',0,1,'/partials/extra/','/extra'),
(74,'Client','TREE.CLIENT','',73,0,'/partials/client/','/client'),
(75,'Beneficiary','TREE.BENEFICIARY','',73,0,'/partials/beneficiary/','/beneficiary'),
(76,'Main Cash','TREE.MAIN_CASH','',5,0,'/partials/pcash/','/main_cash'),
(77,'Project', 'TREE.PROJECT', '', 1, 0, '/partials/projects/', '/projects')
(78, 'Patient Standing', 'TREE.PATIENT_STANDING', '', 10, 0, '/partials/reports/patient_standing/', '/reports/patient_standing');

-- base user & permissions
INSERT INTO `user` (`id`, `username`, `password`, `first`, `last`, `email`, `logged_in`, `pin`) VALUES (1,'admin','1','System','Administrato','kpkdeveloper@gmail.com',0,"1234"),(2,'jniles','1','Jonathan','Niles','jonathanwniles@gmail.com',0,"1234"),(3,'delva','1','Dedrick','kitamuka','kitamuka@gmail.com',0, "1234"),(4,'sthreshley','ima','Larry','Sthreshley','example@email.me',0,"1234"),(5,'receptioniste','moyo','Reception','Reception','recept@example.me',0,"1234"),(14,'sfount','1','Steven','Fountain','StevenFountain@live.co.uk',0,"1234"),(15,'anaclet','tshiko','Anaclet','Kadiata','anakadiat@yahoo.fr',0,"1234"),(16,'caisse','moyo','Caisse','Aux',NULL,0,"1234"),(17,'Ntumba','dieumerci','Moise','Ngalamulume','ngalamulumemoise@gmail.com',0, "1234"),(18,'jean','jean','JEAN','SEKUNDO',NULL,0, "1234"); 
INSERT INTO `permission` VALUES (1,0,1),(2,1,1),(3,4,1),(4,10,5),(5,21,5),(6,31,5),(7,33,5),(8,60,5),(9,66,5),(10,67,5),(12,1,14),(13,2,14),(14,4,14),(15,5,14),(16,6,14),(17,8,14),(18,9,14),(19,10,14),(20,11,14),(21,21,14),(22,30,14),(23,31,14),(24,33,14),(25,34,14),(26,35,14),(27,36,14),(28,37,14),(29,38,14),(30,39,14),(31,40,14),(32,41,14),(33,43,14),(34,45,14),(35,46,14),(36,47,14),(37,48,14),(38,49,14),(39,50,14),(40,51,14),(41,52,14),(42,54,14),(43,55,14),(44,56,14),(45,57,14),(46,58,14),(47,60,14),(48,61,14),(49,62,14),(50,63,14),(51,64,14),(52,65,14),(53,66,14),(54,67,14),(55,68,14),(56,69,14),(57,70,14),(58,1,15),(59,5,15),(60,10,15),(61,11,15),(62,21,15),(63,30,15),(64,31,15),(65,33,15),(66,34,15),(67,35,15),(68,39,15),(69,45,15),(70,46,15),(71,49,15),(72,50,15),(73,52,15),(74,54,15),(75,67,15),(76,68,15),(78,70,15),(79,1,2),(80,2,2),(81,4,2),(82,5,2),(83,6,2),(84,8,2),(85,9,2),(86,10,2),(87,11,2),(88,21,2),(89,30,2),(90,31,2),(91,33,2),(92,34,2),(93,35,2),(94,36,2),(95,37,2),(96,38,2),(97,39,2),(98,40,2),(99,41,2),(100,43,2),(101,45,2),(102,46,2),(103,47,2),(104,48,2),(105,49,2),(106,50,2),(107,51,2),(108,52,2),(109,54,2),(110,55,2),(111,56,2),(112,57,2),(113,58,2),(114,60,2),(115,61,2),(116,62,2),(117,63,2),(118,64,2),(119,65,2),(120,66,2),(121,67,2),(122,68,2),(123,69,2),(124,70,2),(125,1,3),(126,2,3),(127,4,3),(128,5,3),(129,6,3),(130,8,3),(131,9,3),(132,10,3),(133,11,3),(134,21,3),(135,30,3),(136,31,3),(137,33,3),(138,34,3),(139,35,3),(140,36,3),(141,37,3),(142,38,3),(143,39,3),(144,40,3),(145,41,3),(146,43,3),(147,45,3),(148,46,3),(149,47,3),(150,48,3),(151,49,3),(152,50,3),(153,51,3),(154,52,3),(155,54,3),(156,55,3),(157,56,3),(158,57,3),(159,58,3),(160,60,3),(161,61,3),(162,62,3),(163,63,3),(164,64,3),(165,65,3),(166,66,3),(167,67,3),(168,68,3),(169,69,3),(170,70,3),(171,5,16),(172,10,16),(173,38,16),(174,70,16),(175,67,16),(176,35,16),(177,71,3),(178,72,3),(179,72,16),(180,60,15),(181,1,16),(182,46,16),(183,69,15),(184,1,17),(185,5,17),(186,6,17),(187,9,17),(188,10,17),(189,11,17),(190,21,17),(191,30,17),(192,33,17),(193,35,17),(194,45,17),(195,46,17),(196,49,17),(197,50,17),(198,52,17),(199,60,17),(200,65,17),(201,67,17),(202,68,17),(203,69,17),(204,70,17),(205,71,17),(206,58,15),(207,64,15),(208,73,3),(209,74,3),(210,75,3),(211,76,3),(212,1,18),(213,5,18),(214,10,18),(215,46,18),(216,52,18),(217,54,18),(218,70,18),(219,73,18),(220,74,18),(221,75,18),(222,76,18),(223,71,2),(224,72,2),(225,73,2),(226,74,2),(227,75,2),(228,76,2); 

-- System transactions (TODO seperate from Tshikaji?)
INSERT INTO `transaction_type` VALUES (1,'cash'),(2,'sale'),(3,'purchase'),(4,'journal'),(5,'group_invoice'),(6,'credit_note'),(7,'caution'),(8,'pcash');

-- Configure base currencies
INSERT INTO `currency` VALUES (1,'Congolese Francs','Fc',NULL,'.',',',50.00),(2,'United States Dollars','$',NULL,',','.',0.01);

-- Configure base chart of accounts
INSERT INTO `account_type` VALUES (1,'income/expense'),(2,'balance'),(3,'title');

-- Configure base inventory
INSERT INTO `inventory_unit` VALUES (1,'Act'),(2,'Pallet'),(3,'Pill'),(4,'Box'),(5,'Lot');
INSERT INTO `inventory_type` VALUES (0,'Article'),(1,'Assembly'),(2,'Service'),(3,'Discount');

