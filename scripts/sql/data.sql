use `kpk`;

insert into `enterprise` values 
  (200, 'Kinshasa', 'RDC', 'Test', 0824741022, 1, 57000);

insert into `account` (`enterprise_id`, `id`, `account_txt`, `account_type_id`, `account_category`, `fixed`) values 
  (200, 57000, 0, 'Caisse of Enterprise 200', 1, 300, 0);

insert into `fiscal_year` (`enterprise_id`, `id`, `number_of_months`, `fiscal_year_txt`, `transaction_start_number`, `transaction_stop_number`, `fiscal_year_number`, `start_month`, `start_year`, `previous_fiscal_year`) values 
  ();


-- INSERT INTO `debitor_group` VALUES 
--   (1,1,'Employees' ,,1,3,'','','The employees of hospital X',0,1,1,1,1),
-- 	(1,2,'Fr Rienheart Conv.',410400,1,3,'','','Frere Rienheart\'s conventionees',1,1,2,1,2),
-- 	(1,3,'Malades Interne',410800,1,3,'','','Outpatient sick folks',0,1,1,1,4),
-- 	(1,4,'Malades Ambulatoire',410000,1,3,'','','Inpatient sick folks',0,1,2,1,3),
-- 	(1,5,'Pauvres',410700,1,3,'','','Poor people who cannot pay.  (i.e. tax write-offs)',0,1,1,1,2);
-- 
-- 
-- 
-- 
-- INSERT INTO `inv_group` VALUES
--   (0,'Services','S',700000,NULL,NULL,NULL),
-- 	(1,'Medicines','M',700000,700100,NULL,NULL),
-- 	(2,'Surgery','C',710400,NULL,NULL,NULL),
-- 	(3,'Office Supplies','O',310000,310900,NULL,NULL);
-- 
-- 
-- INSERT INTO `inventory` VALUES 
--   (101,1,'CHCRAN','Craniotomie',20000.00,2,1,0,0,0,0,0,2,0),
-- 	(101,2,'CHGLOB','Goitre Lobectomie/Hemithyroidect',20000.00,2,1,0,0,0,0,0,2,0),
-- 	(101,3,'CHGTHY','Goitre Thyroidectomie Sobtotale',20000.00,2,1,0,0,0,0,0,2,0),
-- 	(101,4,'CHEXKY','Excision De Kyste Thyroiglosse',20000.00,2,1,0,0,0,0,0,2,0),
-- 	(101,5,'CHPASU','Parotidectomie Superficielle',20000.00,2,1,0,0,0,0,0,2,0),
-- 	(101,6,'CHTRAC','Trachectome',20000.00,2,1,0,0,0,0,0,2,0),
-- 	(101,7,'EXKYSB','Kyste Sublingual',20000.00,2,1,0,0,0,0,0,2,0),
-- 	(101,8,'EXKYPB','Petite Kyste De La Bouche',20000.00,2,1,0,0,0,0,0,2,0),
-- 	(101,9,'BICNOI','Bic Noire',1.00,3,4,0,0,0,0,0,0,1);
