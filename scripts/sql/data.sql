use `kpk`;

insert into `enterprise` (`id`, `region`, `city`, `country`, `name`, `phone`, `type`, `cash_account`) values 
  (101, 'Kinshasa', 'Kinshasa', 'RDC', 'Test', 0824741022, 1, null),
  (200, 'Tshikaji Region', 'Tshikaji City', 'RDC', 'Tshikaji IPCK', 0824741022, 1, null);


update `enterprise` set `cash_account`=1 where `id`=200;

insert into `fiscal_year` (`enterprise_id`, `id`, `number_of_months`, `fiscal_year_txt`, `transaction_start_number`, `transaction_stop_number`, `fiscal_year_number`, `start_month`, `start_year`, `previous_fiscal_year`) values 
  (200, 1, 12, 'Tshikaji 2013', null, null, 1, 07, 2013, null);

insert into `period` (`id`, `fiscal_year_id`, `period_start`, `period_stop`, `locked`) values
	('1', '1', '2012-09-01', '2012-09-30', '0'),
	('2', '1', '2012-10-01', '2012-10-31', '0'),
	('3', '1', '2012-11-01', '2012-11-30', '0'),
	('4', '1', '2012-12-01', '2012-12-31', '0'),
	('5', '1', '2013-01-01', '2013-01-31', '0'),
	('6', '1', '2013-02-01', '2013-02-28', '0'),
	('7', '1', '2013-03-01', '2013-03-31', '0'),
	('8', '1', '2013-04-01', '2013-04-30', '0'),
	('9', '1', '2013-05-01', '2013-05-31', '0'),
	('10', '1', '2013-06-01', '2013-06-30', '0'),
	('11', '1', '2013-07-01', '2013-07-31', '0'),
	('12', '1', '2013-08-01', '2013-08-31', '0');

insert into `account` (`id`, `account_type_id`, `enterprise_id`, `account_number`, `text`, `account_category_id`) values
	(0,    1, 200, 60111000, "Medicaments" ,1),
	(1,    1, 200, 60111200, "Perfusion" ,1),
	(2,    1, 200, 60211000, "Achat sang" ,1),
	(3,    1, 200, 61111000, "Cons. Fournitures Medicales" ,1),
	(4,    1, 200, 61111400, "Fournitures Optique" ,1),
	(5,    1, 200, 61111129, "Repase Malades Fistuleuse" ,1),
	(6,    1, 200, 61111144, "Cons Laboratoire" ,1),
	(7,    1, 200, 61112180, "Produits Alimentaires GH" ,1),
	(8,    1, 200, 61121700, "Cons. Rx" ,1),
	(9,    1, 200, 61311150, "Materiel et equipement admin" ,1),
	(10,   1, 200, 61311151, "Autres consommables admin" ,1),
	(11,   1, 200, 61311152, "Fiches" ,1),
	(12,   1, 200, 61411000, "Carburant et lubrificant" ,1),
	(13,   1, 200, 61401000, "gasoil" ,1),
	(14,   1, 200, 61431350, "LC ophtalmologie go" ,1),
	(15,   1, 200, 51461350, "Mobility in Mission" ,1),
	(16,   1, 200, 61111152, "vetements professionnels" ,1),
	(17,   1, 200, 61601000, "fournitures de service" ,1),
	(18,   1, 200, 61601010, "fournitures d'entretien" ,1),
	(19,   1, 200, 61831350, "LC ophtalmologie /pces" ,1),
	(20,   1, 200, 61861350, "mobility in mission/pces" ,1),
	(21,   1, 200, 61871000, "pieces de rechange" ,1),
	(22,   1, 200, 61900100, "autres fournitures" ,1),
	(23,   1, 200, 61901000, "petit materiel" ,1),
	(24,   1, 200, 61421110, "Bois et braises" ,2),
	(25,   1, 200, 61561000, "eau" ,2),
	(26,   1, 200, 61561100, "electricite" ,2),
	(27,   1, 200, 62101000, "transport du personnel" ,2),
	(28,   1, 200, 62111129, "transport malades fistuleuses" ,2),
	(29,   1, 200, 62301000, "deplacement et voyages" ,2),
	(30,   1, 200, 62801000, "autres fraise de transport" ,2),
	(31,   1, 200, 63121000, "entretienm terrain" ,2),
	(32,   1, 200, 63151000, "entretien mat. de transport" ,2),
	(33,   1, 200, 63161000, "entretien machines & autres EQ" ,2),
	(34,   1, 200, 63161350, "entretien lc mobility" ,2),
	(35,   1, 200, 63201010, "honoraires avocat" ,2),
	(36,   1, 200, 63201030, "honoraires auditeurs" ,2),
	(37,   1, 200, 63211100, "consultants externes" ,2),
	(38,   1, 200, 63211129, "honoraires s/operations fistu" ,2),
	(39,   1, 200, 63301000, "frais bancaires" ,2),
	(40,   1, 200, 63311000, "frais postes et communications" ,2),
	(41,   1, 200, 63321600, "dr sabua scholarship" ,2),
	(42,   1, 200, 63331122, "mbf women development" ,2),
	(43,   1, 200, 63331350, "entretien imck lc" ,2),
	(44,   1, 200, 63331540, "hydro entretien" ,2),
	(45,   1, 200, 63341000, "frs formation du personnel" ,2),
	(46,   1, 200, 63351000, "autres services exterieurs" ,2),
	(47,   1, 200, 63411000, "loyers & charges locatives" ,2),
	(48,   1, 200, 63601000, "annonces et publicite" ,2),
	(49,   1, 200, 64071000, "assurance vehicules" ,2),
	(50,   1, 200, 64511000, "assistance au personnel" ,2),
	(51,   1, 200, 64511100, "supplement bourses residents" ,2),
	(52,   1, 200, 64521000, "dons & cotisations" ,2),
	(53,   1, 200, 64521120, "representation a l'epn" ,2),
	(54,   1, 200, 64601000, "differences de change" ,2),
	(55,   1, 200, 64701000, "soins gratuites (charite)" ,2),
	(56,   1, 200, 64701100, "soins gratuits cpc/cmco" ,2),
	(57,   1, 200, 64711000, "maladies decedes" ,2),
	(58,   1, 200, 64751100, "soins gratuits eleves" ,2),
	(59,   1, 200, 64801000, "frs judiciaires" ,2),
	(60,   1, 200, 64901000, "conseil d'administration et autres" ,2),
	(61,   1, 200, 64921000, "comite des finances" ,2),
	(62,   1, 200, 64951000, "documentation" ,2),
	(63,   1, 200, 64961000, "autres charges & pertes diverses" ,2),
	(64,   1, 200, 64971000, "aumonerie" ,2),
	(65,   1, 200, 66141000, "amendes et penalites fscales" ,2),
	(66,   1, 200, 66201000, "controle technique" ,2),
	(67,   1, 200, 66301000, "taxes diverses" ,2),
	(68,   1, 200, 65111000, "salaires bruts et primes" ,3),
	(69,   1, 200, 65111129, "prime s/operations fistules" ,3),
	(70,   1, 200, 65141000, "allocation familiales legales" ,3),
	(71,   1, 200, 65211000, "charge sociales diverses inss" ,3),
	(72,   1, 200, 65221000, "decleration i.n.p.p" ,3),
	(73,   1, 200, 65301000, "indeminites diverses" ,3),
	(74,   1, 200, 65321000, "frs pharmaceutiqeus cash travail" ,3),
	(75,   1, 200, 65321100, "frais funeraires" ,3),
	(76,   1, 200, 65321200, "soins medicaux en nature" ,3),
	(77,   1, 200, 65331000, "indemnites de transport" ,3),
	(78,   1, 200, 65341000, "indeminites de logement" ,3),
	(79,   1, 200, 65351000, "indeminites de fin de carriere" ,3),
	(80,   1, 200, 70011000, "ventes medicaments" ,4),
	(81,   1, 200, 70011200, "perfusion" ,4),
	(82,   1, 200, 70031400, "ventes lunettes" ,4),
	(83,   1, 200, 70211000, "fiches" ,4),
	(84,   1, 200, 70471100, "carents de demande de consulta" ,4),
	(85,   1, 200, 71011004, "certificats et autres frais ad" ,4),
	(86,   1, 200, 71011005, "consultation" ,4), -- [ORIGINAL NUMBER - 71011100] 
	(87,   1, 200, 71011031, "platres" ,4),
	(88,   1, 200, 71011100, "actes chirurgicaux" ,4),
	(89,   1, 200, 71011200, "soins specifiques" ,4),
	(90,   1, 200, 71011300, "soins medicaux" ,4),
	(91,   1, 200, 71011600, "examens labo" ,4),
	(92,   1, 200, 71011700, "readiographies" ,4),
	(93,   1, 200, 71011800, "accouchement" ,4),
	(94,   1, 200, 71014100, "rapport medical" ,4),
	(95,   1, 200, 71015000, "fournitures nursing" ,4),
	(96,   1, 200, 71019000, "echo obstertrique" ,4),
	(97,   1, 200, 71019000, "autres echo" ,4),
	(98,   1, 200, 71051000, "bequilles et platres" ,4),
	(99,   1, 200, 71101100, "urgences" ,4),
	(100,  1, 200, 71161000, "recettes administratives" ,4),
	(101,  1, 200, 71161100, "jours lit" ,4),
	(102,  1, 200, 74031000, "loyer - tshitudilu" ,4),
	(103,  1, 200, 74611000, "produit de change" ,4),
	(104,  1, 200, 74611100, "prod. et prof. div. he/gh" ,4),
	(105,  1, 200, 74611350, "prod. et prof. div. /c.e." ,4),
	(106,  1, 200, 74611300, "produits frs recherches" ,4),
	(107,  1, 200, 74611400, "produits frs de stage" ,4),
	(108,  1, 200, 74611450, "produits frs perfectionnement" ,4),
	(109,  1, 200, 74611500, "produits morgue" ,4),
	(110,  1, 200, 74621000, "produits divers" ,4),
	(111,  1, 200, 76301000, "subvention d'exploitation mbf" ,5),
	(112,  1, 200, 76201000, "subvention d'exploitation pcusa" ,5),
	(113,  1, 200, 76401000, "subvention d'exploitation cbm" ,5),
	(114,  1, 200, 76101000, "subvention d'exploitation" ,5),
	(115,  1, 200, 76100129, "eco fistula project" ,5),
	(116,  1, 200, 76111130, "eco cervical cancer" ,5),
	(117,  1, 200, 76221450, "eco charity funds" ,5),
	(118,  1, 200, 76221126, "eco tshikaji health center" ,5),
	(119,  1, 200, 76501000, "subvention de l'etat (assp)" ,5),
	(120,  1, 200, 76601000, "subentions fondation amis de l'imck" ,5),
	(121,  1, 200, 76111270, "dr sabua scholarship" ,5),
	(122,  1, 200, 76121490, "bourse kajibdi/ voyage retour" ,5),
	(123,  1, 200, 76121600, "dons divers en nature (usa+ amis)" ,5),
	(124,  1, 200, 76151000, "eco 320802 mibility in mission" ,5),
	(125,  1, 200, 76121510, "eco general non designe" ,5),
	(126,  1, 200, 76111127, "orphan scholarship educat" ,5),
	(127,  1, 200, 76221128, "eco healthy mother healthy children (HMHC)" ,5),
	(128,  1, 200, 76261121, "eco moringa" ,5),
	(129,  1, 200, 76701000, "sub mppc" ,5),
	(130,  1, 200, 76801000, "subvention row" ,5),
	(131,  1, 200, 76151000, "fonds epn" ,5);


-- These values are already in the database and not linked to an enterprise
-- insert into `country` values
-- 	(52,180,'The Democratic Republic Of The Congo','République Démocratique du Congo');
-- 
-- insert into `location` (`id`, `city`, `region`, `country_id`, `zone`, `village`) values 
--   (1,'Kinshasa','Kinshasa',52,NULL,NULL);
-- 
-- insert into `debitor_group_type` (`id`, `type`) values
--   (1, 'Employees'),
--   (2, 'Conventionees'),
--   (3, 'Malades Ambulatoire'),
--   (4, 'Malades Interne');

insert into `debitor_group` (`enterprise_id`, `id`, `name`, `account_id`, `location_id`, `payment_id`, `contact_id`, `tax_id`, `type_id`) values 
  (200, 1, "Employees", 65, 1, 1, 1, 1, 1),
  (200, 2, "Fr. Reinhart Conventionees", 63, 1, 1, 1, 1, 2),
  (200, 3, "Normal Debitors", 59, 1, 1, 1, 1, 3),
  (200, 4, "Central Pharmacy", 56, 1, 1, 1, 1, 3),
  (200, 5, "Other Clients", 66, 1, 1, 1, 1, 4);

insert into `debitor` (`id`, `group_id`, `text`) values 
  (1, 3, "Debitor account for patient 1");
--   (2, 1, "Debitor 2"),
--   (3, 3, "Debitor 3"),
--   (4, 3, "Debitor 4"),
--   (5, 3, "Debitor 5"),
--   (6, 3, "Debitor 6"),
--   (7, 3, "Debitor 7");

insert into `patient` (`id`, `debitor_id`, `sex`, `first_name`, `last_name`, `dob`, `location_id`) values
  (1, 1, "M","Jon", "Niles", "1992-06-07", 1);

insert into `inv_group` values 
  (0,'Services','S', 90, NULL, NULL, NULL), -- 164
	(1,'Medicines','M', 80, NULL, NULL, NULL), -- 164, 167
	(2,'Surgery','C',88,NULL,NULL, NULL); -- 171
	-- (3,'Office Supplies','O', 41, 48, NULL,NULL); --41


insert into `inventory` values 
  (101,1,'CHCRAN','Craniotomie',20000.00,2,1,0,0,0,0,0,2,0),
 	(101,2,'CHGLOB','Goitre Lobectomie/Hemithyroidect',20000.00,2,1,0,0,0,0,0,2,0),
 	(101,3,'CHGTHY','Goitre Thyroidectomie Sobtotale',20000.00,2,1,0,0,0,0,0,2,0),
 	(101,4,'CHEXKY','Excision De Kyste Thyroiglosse',20000.00,2,1,0,0,0,0,0,2,0),
 	(101,5,'CHPASU','Parotidectomie Superficielle',20000.00,2,1,0,0,0,0,0,2,0),
 	(101,6,'CHTRAC','Trachectome',20000.00,2,1,0,0,0,0,0,2,0),
 	(101,7,'EXKYSB','Kyste Sublingual',20000.00,2,1,0,0,0,0,0,2,0),
 	(101,8,'EXKYPB','Petite Kyste De La Bouche',20000.00,2,1,0,0,0,0,0,2,0);
 	-- (101,9,'BICNOI','Bic Noire',1.00,3,4,0,0,0,0,0,0,1);
