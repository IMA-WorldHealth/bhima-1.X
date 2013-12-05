--
-- This contains all the data for the TSHIKAJI database.
-- It still uses the same `kpk` base database, but has
-- no DDL, only DML.
--

use `kpk`;

delete from `posting_journal`;
delete from `general_ledger`;
delete from `transaction_type`;
delete from `patient`;
delete from `debitor`;
delete from `debitor_group`;
delete from `debitor_group_type`;
delete from `permission`;
delete from `unit`;
delete from `tax`;
delete from `account`;
delete from `account_type`;
delete from `account_collection`;
delete from `account_category`;
delete from `price_group`;
delete from `payment`;
delete from `currency`;
delete from `inventory`;
delete from `inv_unit`;
delete from `inv_group`;
delete from `inv_type`;
delete from `cash_item`;
delete from `cash`;
delete from `sale`;
delete from `purchase`;
delete from `user`;
delete from `period`;
delete from `fiscal_year`;
delete from `enterprise`;
delete from `location`;
delete from `country`;

-- configure application details
insert into `user` values
  (1,'jniles','malamumoke','Jonathan','Niles','jonathanwniles@gmail.com',0),
	(2,'delva','1','Dedrick','kitamuka','kitamuka@gmail.com',0),
	(13,'sfount','1','Steven','Fountain','StevenFountain@live.co.uk',1);

INSERT INTO `unit` VALUES
  (0,'Root','The unseen root node',NULL,1,'',''),
	(1,'Admin','The Administration Super-Category',0,1,'',''),
	(2,'Enterprises','Manage the registered enterprises from here',1,0,'/units/enterprise/',''),
	(3,'Form Manager','Manage your forms',1,0,'/units/formmanager/',''),
	(4,'Users & Permissions','Manage user privileges and permissions',1,0,'/partials/permission','/permission'),
	(5,'Finance','The Finance Super-Category',0,1,'',''),
	(6,'Accounts','The chart of accounts',5,0,'/partials/chart','/accounts'),
	(7,'Charts','Analyze how your company is doing',5,0,'/units/charts/',''),
	(8,'Budgeting','Plan your next move',0,10,'/partials/budgeting','budgeting'),
	(9,'Posting Journal','Daily Log',5,0,'/partials/postingjournal/','/posting_journal'),
	(10,'Reports','Do stuff and tell people about it',0,1,'/units/reports/',''),
	(11,'Inventory','The Inventory Super-Category',0,1,'',''),
	(12,'Orders','Manage your purchase orders',11,0,'/units/orders/',''),
	(13,'Stock','What is in stock?',0,1,'',''),
	(14,'Achats','Achats de stock',13,0,'/partials/achat','/achat'),
	(15,'Livraison','Livraison du stock',13,0,'/partials/livraison',''),
	(16,'Pertes','Perte en stock',13,0,'/partials/perte',''),
	(17,'Ventes','Ventes des biens et services',0,1,'',''),
	(18,'Malades','services rendus aux malades',17,0,'/partials/malade',''),
	(19,'Pharmacie','vente des medicaments',17,0,'/partials/pharmacie',''),
	(20,'Autre service','Autre service vendus',17,0,'/partials/autre',''),
	(21,'Hospital','The Hospital Super-Category',0,1,'',''),
	(22,'Pharmacy','What\'s in your pharmacy?',21,0,'/units/pharmacy/',''),
	(23,'Laboratory','Analyze lab results',21,0,'/units/laboratory/',''),
	(24,'Surgery','Best cuttlery here!',21,0,'/units/surgery',''),
	(25,'Radiology','X-rays, anyone?',21,0,'/units/radiology/',''),
	(26,'Creditors','Tous les creanciers',5,0,'/partials/creditor','/creditors'),
	(27,'Balance','The Balance Sheet',5,0,'/units/balance/',''),
	(28,'Transaction','The Transaction Page',5,0,'/partials/transaction',''),
	(29,'Debitors','The debitors configuraiton page',5,0,'debitors',''),
	(30,'Fiscal Year','Fiscal year configuration page',1,0,'/partials/fiscal','fiscal'),
	(31,'Patient Registration','Register patients',21,0,'/partials/patient','patient'),
	(32,'Essaie journal','essaie journal',17,0,'/partials/vente','/essaie'),
	(33,'Patient Records','Search for patient',21,0,'/partials/patient_records/','patient_records/'),
	(34,'Sales','Create an invoice for a sale',5,0,'/partials/sales','sales'),
	(35,'Sale Records','Search for a sale',5,0,'/partials/sale_records/','sale_records/'),
	(36,'Purchase Order','Create a new Purchase Order',11,0,'partials/inventory_purchase_order','inventory/purchase'),
	(37,'Budget by Account','Budgeting by account',8,0,'partials/budgeting','budgeting'),
	(38,'Cash Box','Pay invoices',5,0,'/partials/cash','cash'),
	(39,'Register Stock','',11,0,'partials/inventory/register','inventory/register'),
	(40,'Register Supplier','',11,0,'partials/inventory/creditors','creditors'),
	(41,'Purchase Order Records','',5,0,'partials/purchase_records/','purchase_records/'),
  (42,'Income/Expense', '', 10, 0, 'partials/reports/income_expense', 'reports/income_expense'),
  (43,'Financial Report', '', 10, 0, 'partials/reports/finance_report', 'reports/finance'),
  (44,'Balance vs. Budget', '',10, 0, 'partials/reports/balance_budget', 'reports/balance_budget')
  (45, 'Transaction Report', '', 10, 0, 'partials/reports/transaction_report', 'reports/transaction_report');

insert into `permission` values
  (1,1,13),
	(2,4,13),
	(3,6,13),
	(4,30,13),
	(5,31,13),
	(6,34,13),
	(7,35,13),
	(8,33,13),
	(9,36,13),
	(10,37,13),
	(11,38,13),
	(12,39,13),
	(13,40,13),
	(14,9,13),
	(15,41,13),
  (16,1,1),
	(17,4,1),
	(18,6,1),
	(19,30,1),
	(20,31,1),
	(21,34,1),
	(22,35,1),
	(23,33,1),
	(24,36,1),
	(25,37,1),
	(26,38,1),
	(27,39,1),
	(28,40,1),
	(29,9,1),
	(30,41,1),
  (31,1,2),
	(32,4,2),
	(33,6,2),
	(34,30,2),
	(35,31,2),
	(36,34,2),
	(37,35,2),
	(38,33,2),
	(39,36,2),
	(40,37,2),
	(41,38,2),
	(42,39,2),
	(43,40,2),
	(44,9,2),
	(45,41,2),
  (46, 43, 13),
  (47, 43, 1);


-- configure location details
insert into `country` values
  (1,4,'Afghanistan','Afghanistan'),
	(2,8,'Albania','Albanie'),
	(3,10,'Antarctica','Antarctique'),
	(4,12,'Algeria','Algérie'),
	(5,16,'American Samoa','Samoa Américaines'),
	(6,20,'Andorra','Andorre'),
	(7,24,'Angola','Angola'),
	(8,28,'Antigua and Barbuda','Antigua-et-Barbuda'),
	(9,31,'Azerbaijan','Azerbaïdjan'),
	(10,32,'Argentina','Argentine'),
	(11,36,'Australia','Australie'),
	(12,40,'Austria','Autriche'),
	(13,44,'Bahamas','Bahamas'),
	(14,48,'Bahrain','Bahreïn'),
	(15,50,'Bangladesh','Bangladesh'),
	(16,51,'Armenia','Arménie'),
	(17,52,'Barbados','Barbade'),
	(18,56,'Belgium','Belgique'),
	(19,60,'Bermuda','Bermudes'),
	(20,64,'Bhutan','Bhoutan'),
	(21,68,'Bolivia','Bolivie'),
	(22,70,'Bosnia and Herzegovina','Bosnie-Herzégovine'),
	(23,72,'Botswana','Botswana'),
	(24,74,'Bouvet Island','Île Bouvet'),
	(25,76,'Brazil','Brésil'),
	(26,84,'Belize','Belize'),
	(27,86,'British Indian Ocean Territory','Territoire Britannique de l\'Océan Indien'),
	(28,90,'Solomon Islands','Îles Salomon'),
	(29,92,'British Virgin Islands','Îles Vierges Britanniques'),
	(30,96,'Brunei Darussalam','Brunéi Darussalam'),
	(31,100,'Bulgaria','Bulgarie'),
	(32,104,'Myanmar','Myanmar'),
	(33,108,'Burundi','Burundi'),
	(34,112,'Belarus','Bélarus'),
	(35,116,'Cambodia','Cambodge'),
	(36,120,'Cameroon','Cameroun'),
	(37,124,'Canada','Canada'),
	(38,132,'Cape Verde','Cap-vert'),
	(39,136,'Cayman Islands','Îles Caïmanes'),
	(40,140,'Central African','République Centrafricaine'),
	(41,144,'Sri Lanka','Sri Lanka'),
	(42,148,'Chad','Tchad'),
	(43,152,'Chile','Chili'),
	(44,156,'China','Chine'),
	(45,158,'Taiwan','Taïwan'),
	(46,162,'Christmas Island','Île Christmas'),
	(47,166,'Cocos (Keeling) Islands','Îles Cocos (Keeling)'),
	(48,170,'Colombia','Colombie'),
	(49,174,'Comoros','Comores'),
	(50,175,'Mayotte','Mayotte'),
	(51,178,'Republic of the Congo','République du Congo'),
	(52,180,'The Democratic Republic Of The Congo','République Démocratique du Congo'),
	(53,184,'Cook Islands','Îles Cook'),
	(54,188,'Costa Rica','Costa Rica'),
	(55,191,'Croatia','Croatie'),
	(56,192,'Cuba','Cuba'),
	(57,196,'Cyprus','Chypre'),
	(58,203,'Czech Republic','République Tchèque'),
	(59,204,'Benin','Bénin'),
	(60,208,'Denmark','Danemark'),
	(61,212,'Dominica','Dominique'),
	(62,214,'Dominican Republic','République Dominicaine'),
	(63,218,'Ecuador','Équateur'),
	(64,222,'El Salvador','El Salvador'),
	(65,226,'Equatorial Guinea','Guinée Équatoriale'),
	(66,231,'Ethiopia','Éthiopie'),
	(67,232,'Eritrea','Érythrée'),
	(68,233,'Estonia','Estonie'),
	(69,234,'Faroe Islands','Îles Féroé'),
	(70,238,'Falkland Islands','Îles (malvinas) Falkland'),
	(71,239,'South Georgia and the South Sandwich Islands','Géorgie du Sud et les Îles Sandwich du Sud'),
	(72,242,'Fiji','Fidji'),
	(73,246,'Finland','Finlande'),
	(74,248,'Åland Islands','Îles Åland'),
	(75,250,'France','France'),
	(76,254,'French Guiana','Guyane Française'),
	(77,258,'French Polynesia','Polynésie Française'),
	(78,260,'French Southern Territories','Terres Australes Françaises'),
	(79,262,'Djibouti','Djibouti'),
	(80,266,'Gabon','Gabon'),
	(81,268,'Georgia','Géorgie'),
	(82,270,'Gambia','Gambie'),
	(83,275,'Occupied Palestinian Territory','Territoire Palestinien Occupé'),
	(84,276,'Germany','Allemagne'),
	(85,288,'Ghana','Ghana'),
	(86,292,'Gibraltar','Gibraltar'),
	(87,296,'Kiribati','Kiribati'),
	(88,300,'Greece','Grèce'),
	(89,304,'Greenland','Groenland'),
	(90,308,'Grenada','Grenade'),
	(91,312,'Guadeloupe','Guadeloupe'),
	(92,316,'Guam','Guam'),
	(93,320,'Guatemala','Guatemala'),
	(94,324,'Guinea','Guinée'),
	(95,328,'Guyana','Guyana'),
	(96,332,'Haiti','Haïti'),
	(97,334,'Heard Island and McDonald Islands','Îles Heard et Mcdonald'),
	(98,336,'Vatican City State','Saint-Siège (état de la Cité du Vatican)'),
	(99,340,'Honduras','Honduras'),
	(100,344,'Hong Kong','Hong-Kong'),
	(101,348,'Hungary','Hongrie'),
	(102,352,'Iceland','Islande'),
	(103,356,'India','Inde'),
	(104,360,'Indonesia','Indonésie'),
	(105,364,'Islamic Republic of Iran','République Islamique d\'Iran'),
	(106,368,'Iraq','Iraq'),
	(107,372,'Ireland','Irlande'),
	(108,376,'Israel','Israël'),
	(109,380,'Italy','Italie'),
	(110,384,'Côte d\'Ivoire','Côte d\'Ivoire'),
	(111,388,'Jamaica','Jamaïque'),
	(112,392,'Japan','Japon'),
	(113,398,'Kazakhstan','Kazakhstan'),
	(114,400,'Jordan','Jordanie'),
	(115,404,'Kenya','Kenya'),
	(116,408,'Democratic People\'s Republic of Korea','République Populaire Démocratique de Corée'),
	(117,410,'Republic of Korea','République de Corée'),
	(118,414,'Kuwait','Koweït'),
	(119,417,'Kyrgyzstan','Kirghizistan'),
	(120,418,'Lao People\'s Democratic Republic','République Démocratique Populaire Lao'),
	(121,422,'Lebanon','Liban'),
	(122,426,'Lesotho','Lesotho'),
	(123,428,'Latvia','Lettonie'),
	(124,430,'Liberia','Libéria'),
	(125,434,'Libyan Arab Jamahiriya','Jamahiriya Arabe Libyenne'),
	(126,438,'Liechtenstein','Liechtenstein'),
	(127,440,'Lithuania','Lituanie'),
	(128,442,'Luxembourg','Luxembourg'),
	(129,446,'Macao','Macao'),
	(130,450,'Madagascar','Madagascar'),
	(131,454,'Malawi','Malawi'),
	(132,458,'Malaysia','Malaisie'),
	(133,462,'Maldives','Maldives'),
	(134,466,'Mali','Mali'),
	(135,470,'Malta','Malte'),
	(136,474,'Martinique','Martinique'),
	(137,478,'Mauritania','Mauritanie'),
	(138,480,'Mauritius','Maurice'),
	(139,484,'Mexico','Mexique'),
	(140,492,'Monaco','Monaco'),
	(141,496,'Mongolia','Mongolie'),
	(142,498,'Republic of Moldova','République de Moldova'),
	(143,500,'Montserrat','Montserrat'),
	(144,504,'Morocco','Maroc'),
	(145,508,'Mozambique','Mozambique'),
	(146,512,'Oman','Oman'),
	(147,516,'Namibia','Namibie'),
	(148,520,'Nauru','Nauru'),
	(149,524,'Nepal','Népal'),
	(150,528,'Netherlands','country-Bas'),
	(151,530,'Netherlands Antilles','Antilles Néerlandaises'),
	(152,533,'Aruba','Aruba'),
	(153,540,'New Caledonia','Nouvelle-Calédonie'),
	(154,548,'Vanuatu','Vanuatu'),
	(155,554,'New Zealand','Nouvelle-Zélande'),
	(156,558,'Nicaragua','Nicaragua'),
	(157,562,'Niger','Niger'),
	(158,566,'Nigeria','Nigéria'),
	(159,570,'Niue','Niué'),
	(160,574,'Norfolk Island','Île Norfolk'),
	(161,578,'Norway','Norvège'),
	(162,580,'Northern Mariana Islands','Îles Mariannes du Nord'),
	(163,581,'United States Minor Outlying Islands','Îles Mineures Éloignées des États-Unis'),
	(164,583,'Federated States of Micronesia','États Fédérés de Micronésie'),
	(165,584,'Marshall Islands','Îles Marshall'),
	(166,585,'Palau','Palaos'),
	(167,586,'Pakistan','Pakistan'),
	(168,591,'Panama','Panama'),
	(169,598,'Papua New Guinea','Papouasie-Nouvelle-Guinée'),
	(170,600,'Paraguay','Paraguay'),
	(171,604,'Peru','Pérou'),
	(172,608,'Philippines','Philippines'),
	(173,612,'Pitcairn','Pitcairn'),
	(174,616,'Poland','Pologne'),
	(175,620,'Portugal','Portugal'),
	(176,624,'Guinea-Bissau','Guinée-Bissau'),
	(177,626,'Timor-Leste','Timor-Leste'),
	(178,630,'Puerto Rico','Porto Rico'),
	(179,634,'Qatar','Qatar'),
	(180,638,'Réunion','Réunion'),
	(181,642,'Romania','Roumanie'),
	(182,643,'Russian Federation','Fédération de Russie'),
	(183,646,'Rwanda','Rwanda'),
	(184,654,'Saint Helena','Sainte-Hélène'),
	(185,659,'Saint Kitts and Nevis','Saint-Kitts-et-Nevis'),
	(186,660,'Anguilla','Anguilla'),
	(187,662,'Saint Lucia','Sainte-Lucie'),
	(188,666,'Saint-Pierre and Miquelon','Saint-Pierre-et-Miquelon'),
	(189,670,'Saint Vincent and the Grenadines','Saint-Vincent-et-les Grenadines'),
	(190,674,'San Marino','Saint-Marin'),
	(191,678,'Sao Tome and Principe','Sao Tomé-et-Principe'),
	(192,682,'Saudi Arabia','Arabie Saoudite'),
	(193,686,'Senegal','Sénégal'),
	(194,690,'Seychelles','Seychelles'),
	(195,694,'Sierra Leone','Sierra Leone'),
	(196,702,'Singapore','Singapour'),
	(197,703,'Slovakia','Slovaquie'),
	(198,704,'Vietnam','Viet Nam'),
	(199,705,'Slovenia','Slovénie'),
	(200,706,'Somalia','Somalie'),
	(201,710,'South Africa','Afrique du Sud'),
	(202,716,'Zimbabwe','Zimbabwe'),
	(203,724,'Spain','Espagne'),
	(204,732,'Western Sahara','Sahara Occidental'),
	(205,736,'Sudan','Soudan'),
	(206,740,'Suriname','Suriname'),
	(207,744,'Svalbard and Jan Mayen','Svalbard etÎle Jan Mayen'),
	(208,748,'Swaziland','Swaziland'),
	(209,752,'Sweden','Suède'),
	(210,756,'Switzerland','Suisse'),
	(211,760,'Syrian Arab Republic','République Arabe Syrienne'),
	(212,762,'Tajikistan','Tadjikistan'),
	(213,764,'Thailand','Thaïlande'),
	(214,768,'Togo','Togo'),
	(215,772,'Tokelau','Tokelau'),
	(216,776,'Tonga','Tonga'),
	(217,780,'Trinidad and Tobago','Trinité-et-Tobago'),
	(218,784,'United Arab Emirates','Émirats Arabes Unis'),
	(219,788,'Tunisia','Tunisie'),
	(220,792,'Turkey','Turquie'),
	(221,795,'Turkmenistan','Turkménistan'),
	(222,796,'Turks and Caicos Islands','Îles Turks et Caïques'),
	(223,798,'Tuvalu','Tuvalu'),
	(224,800,'Uganda','Ouganda'),
	(225,804,'Ukraine','Ukraine'),
	(226,807,'The Former Yugoslav Republic of Macedonia','L\'ex-République Yougoslave de Macédoine'),
	(227,818,'Egypt','Égypte'),
	(228,826,'United Kingdom','Royaume-Uni'),
	(229,833,'Isle of Man','Île de Man'),
	(230,834,'United Republic Of Tanzania','République-Unie de Tanzanie'),
	(231,840,'United States','États-Unis'),
	(232,850,'U.S. Virgin Islands','Îles Vierges des États-Unis'),
	(233,854,'Burkina Faso','Burkina Faso'),
	(234,858,'Uruguay','Uruguay'),
	(235,860,'Uzbekistan','Ouzbékistan'),
	(236,862,'Venezuela','Venezuela'),
	(237,876,'Wallis and Futuna','Wallis et Futuna'),
	(238,882,'Samoa','Samoa'),
	(239,887,'Yemen','Yémen'),
	(240,891,'Serbia and Montenegro','Serbie-et-Monténégro'),
	(241,894,'Zambia','Zambie');

insert into `location` values
  (1,'Kinshasa','Kinshasa',52,NULL,NULL),
	(2,'Lubumbashi','Katanga',52,NULL,NULL),
	(3,'Mbuji-Mayi','Kasaï-Oriental',52,NULL,NULL),
	(4,'Kananga','Kasaï-Occidental',52,NULL,NULL),
	(5,'Kisangani','Orientale',52,NULL,NULL),
	(6,'Bukavu','Sud-Kivu',52,NULL,NULL),
	(7,'Tshikapa','Kasaï-Occidental',52,NULL,NULL),
	(8,'Kolwezi','Katanga',52,NULL,NULL),
	(9,'Likasi','Katanga',52,NULL,NULL),
	(10,'Goma','Nord-Kivu',52,NULL,NULL),
	(11,'Kikwit','Bandundu',52,NULL,NULL),
	(12,'Uvira','Sud-Kivu',52,NULL,NULL),
	(13,'Bunia','Orientale',52,NULL,NULL),
	(14,'Mbandaka','Équateur',52,NULL,NULL),
	(15,'Matadi','Bas-Congo',52,NULL,NULL),
	(16,'Kabinda','Kasaï-Oriental',52,NULL,NULL),
	(17,'Butembo','Nord-Kivu',52,NULL,NULL),
	(18,'Mwene-Ditu','Kasaï-Oriental',52,NULL,NULL),
	(19,'Isiro','Orientale',52,NULL,NULL),
	(20,'Kindu','Maniema',52,NULL,NULL),
	(21,'Boma','Bas-Congo',52,NULL,NULL),
	(22,'Kamina','Katanga',52,NULL,NULL),
	(23,'Gandajika','Kasaï-Oriental',52,NULL,NULL),
	(24,'Bandundu','Bandundu',52,NULL,NULL),
	(25,'Gemena','Équateur',52,NULL,NULL),
	(26,'Kipushi','Katanga',52,NULL,NULL),
	(27,'Bumba','Équateur',52,NULL,NULL),
	(28,'Mbanza-Ngungu','Bas-Congo',52,NULL,NULL);

-- configure enterprise

insert into `enterprise` (`id`, `name`, `abbr`, `phone`, `email`, `location_id`, `cash_account`, `logo`) values 
  (200, 'Hopital Bon Berger', 'GSH', '0825924377', 'cmk@tshikaji.cd', 1, 570000, '/assets/logos/tsh.jpg');

-- configure fiscal year/period

insert into `fiscal_year` (`enterprise_id`, `id`, `number_of_months`, `fiscal_year_txt`, `transaction_start_number`, `transaction_stop_number`, `fiscal_year_number`, `start_month`, `start_year`, `previous_fiscal_year`) values 
  (200, 1, 12, 'Tshikaji 2013', null, null, 1, 07, 2013, null);

insert into `period` (`id`, `fiscal_year_id`, `period_start`, `period_stop`, `locked`) values
	('1', '1', '2013-09-01', '2013-09-30', '0'),
	('2', '1', '2013-10-01', '2013-10-31', '0'),
	('3', '1', '2013-11-01', '2013-11-30', '0'),
	('4', '1', '2013-12-01', '2013-12-31', '0'),
	('5', '1', '2014-01-01', '2014-01-31', '0'),
	('6', '1', '2014-02-01', '2014-02-28', '0'),
	('7', '1', '2014-03-01', '2014-03-31', '0'),
	('8', '1', '2014-04-01', '2014-04-30', '0'),
	('9', '1', '2014-05-01', '2014-05-31', '0'),
	('10', '1', '2014-06-01', '2014-06-30', '0'),
	('11', '1', '2014-07-01', '2014-07-31', '0'),
	('12', '1', '2014-08-01', '2014-08-31', '0');

-- configure accounts
insert into `account_type` values
  (1,'income/expense'),
  (2,'balance'),
  (3,'title');

insert into `account_category` (`id`, `title`, `collection_id`) values 
  (0, "Misc.", 1),
  (1, 'Biens et Materiels', 2),
  (2, 'Depenses de prestations', 2),
  (3, 'Salaires', 2),
  (4, 'Production Local', 3),
  (5, 'Subvention', 3);

insert into `account_collection` (`id`, `leading_number`, `title`) values
  (1, 4, 'Fournisseurs'),
  (2, 6, 'Income/Debit Accounts'),
  (3, 7, 'Expense/Credit Accounts');

insert into `account` (`id`, `fixed`,  `locked`, `enterprise_id`, `account_number`, `account_txt`, `account_type_id`, `account_category_id`) values 
  (0  , 1, 0, 200, 60111000, "Medicaments"                               , 1, 1),
  (1  , 1, 0, 200, 60111200, "Perfusion"                                 , 1, 1),
  (2  , 1, 0, 200, 60211000, "Achat sang"                                , 1, 1),
  (3  , 1, 0, 200, 61111000, "Cons. Fournitures Medicales"               , 1, 1),
  (4  , 1, 0, 200, 61111400, "Fournitures Optique"                       , 1, 1),
  (5  , 1, 0, 200, 61111129, "Repase Malades Fistuleuse"                 , 1, 1),
  (6  , 1, 0, 200, 61111144, "Cons Laboratoire"                          , 1, 1),
  (7  , 1, 0, 200, 61112180, "Produits Alimentaires GH"                  , 1, 1),
  (8  , 1, 0, 200, 61121700, "Cons. Rx"                                  , 1, 1),
  (9  , 1, 0, 200, 61311150, "Materiel et equipement admin"              , 1, 1),
  (10 , 1, 0, 200, 61311151, "Autres consommables admin"                 , 1, 1),
  (11 , 1, 0, 200, 61311152, "Fiches"                                    , 1, 1),
  (12 , 1, 0, 200, 61411000, "Carburant et lubrificant"                  , 1, 1),
  (13 , 1, 0, 200, 61401000, "gasoil"                                    , 1, 1),
  (14 , 1, 0, 200, 61431350, "LC ophtalmologie go"                       , 1, 1),
  (15 , 1, 0, 200, 51461350, "Mobility in Mission"                       , 1, 1),
  (16 , 1, 0, 200, 61111152, "vetements professionnels"                  , 1, 1),
  (17 , 1, 0, 200, 61601000, "fournitures de service"                    , 1, 1),
  (18 , 1, 0, 200, 61601010, "fournitures d'entretien"                   , 1, 1),
  (19 , 1, 0, 200, 61831350, "LC ophtalmologie /pces"                    , 1, 1),
  (20 , 1, 0, 200, 61861350, "mobility in mission/pces"                  , 1, 1),
  (21 , 1, 0, 200, 61871000, "pieces de rechange"                        , 1, 1),
  (22 , 1, 0, 200, 61900100, "autres fournitures"                        , 1, 1),
  (23 , 1, 0, 200, 61901000, "petit materiel"                            , 1, 1),
  (24 , 1, 0, 200, 61421110, "Bois et braises"                           , 1, 2),
  (25 , 1, 0, 200, 61561000, "eau"                                       , 1, 2),
  (26 , 1, 0, 200, 61561100, "electricite"                               , 1, 2),
  (27 , 1, 0, 200, 62101000, "transport du personnel"                    , 1, 2),
  (28 , 1, 0, 200, 62111129, "transport malades fistuleuses"             , 1, 2),
  (29 , 1, 0, 200, 62301000, "deplacement et voyages"                    , 1, 2),
  (30 , 1, 0, 200, 62801000, "autres fraise de transport"                , 1, 2),
  (31 , 1, 0, 200, 63121000, "entretienm terrain"                        , 1, 2),
  (32 , 1, 0, 200, 63151000, "entretien mat. de transport"               , 1, 2),
  (33 , 1, 0, 200, 63161000, "entretien machines & autres EQ"            , 1, 2),
  (34 , 1, 0, 200, 63161350, "entretien lc mobility"                     , 1, 2),
  (35 , 1, 0, 200, 63201010, "honoraires avocat"                         , 1, 2),
  (36 , 1, 0, 200, 63201030, "honoraires auditeurs"                      , 1, 2),
  (37 , 1, 0, 200, 63211100, "consultants externes"                      , 1, 2),
  (38 , 1, 0, 200, 63211129, "honoraires s/operations fistu"             , 1, 2),
  (39 , 1, 0, 200, 63301000, "frais bancaires"                           , 1, 2),
  (40 , 1, 0, 200, 63311000, "frais postes et communications"            , 1, 2),
  (41 , 1, 0, 200, 63321600, "dr sabua scholarship"                      , 1, 2),
  (42 , 1, 0, 200, 63331122, "mbf women development"                     , 1, 2),
  (43 , 1, 0, 200, 63331350, "entretien imck lc"                         , 1, 2),
  (44 , 1, 0, 200, 63331540, "hydro entretien"                           , 1, 2),
  (45 , 1, 0, 200, 63341000, "frs formation du personnel"                , 1, 2),
  (46 , 1, 0, 200, 63351000, "autres services exterieurs"                , 1, 2),
  (47 , 1, 0, 200, 63411000, "loyers & charges locatives"                , 1, 2),
  (48 , 1, 0, 200, 63601000, "annonces et publicite"                     , 1, 2),
  (49 , 1, 0, 200, 64071000, "assurance vehicules"                       , 1, 2),
  (50 , 1, 0, 200, 64511000, "assistance au personnel"                   , 1, 2),
  (51 , 1, 0, 200, 64511100, "supplement bourses residents"              , 1, 2),
  (52 , 1, 0, 200, 64521000, "dons & cotisations"                        , 1, 2),
  (53 , 1, 0, 200, 64521120, "representation a l'epn"                    , 1, 2),
  (54 , 1, 0, 200, 64601000, "differences de change"                     , 1, 2),
  (55 , 1, 0, 200, 64701000, "soins gratuites (charite)"                 , 1, 2),
  (56 , 1, 0, 200, 64701100, "soins gratuits cpc/cmco"                   , 1, 2),
  (57 , 1, 0, 200, 64711000, "maladies decedes"                          , 1, 2),
  (58 , 1, 0, 200, 64751100, "soins gratuits eleves"                     , 1, 2),
  (59 , 1, 0, 200, 64801000, "frs judiciaires"                           , 1, 2),
  (60 , 1, 0, 200, 64901000, "conseil d'administration et autres"        , 1, 2),
  (61 , 1, 0, 200, 64921000, "comite des finances"                       , 1, 2),
  (62 , 1, 0, 200, 64951000, "documentation"                             , 1, 2),
  (63 , 1, 0, 200, 64961000, "autres charges & pertes diverses"          , 1, 2),
  (64 , 1, 0, 200, 64971000, "aumonerie"                                 , 1, 2),
  (65 , 1, 0, 200, 66141000, "amendes et penalites fscales"              , 1, 2),
  (66 , 1, 0, 200, 66201000, "controle technique"                        , 1, 2),
  (67 , 1, 0, 200, 66301000, "taxes diverses"                            , 1, 2),
  (68 , 1, 0, 200, 65111000, "salaires bruts et primes"                  , 1, 3),
  (69 , 1, 0, 200, 65111129, "prime s/operations fistules"               , 1, 3),
  (70 , 1, 0, 200, 65141000, "allocation familiales legales"             , 1, 3),
  (71 , 1, 0, 200, 65211000, "charge sociales diverses inss"             , 1, 3),
  (72 , 1, 0, 200, 65221000, "decleration i.n.p.p"                       , 1, 3),
  (73 , 1, 0, 200, 65301000, "indeminites diverses"                      , 1, 3),
  (74 , 1, 0, 200, 65321000, "frs pharmaceutiqeus cash travail"          , 1, 3),
  (75 , 1, 0, 200, 65321100, "frais funeraires"                          , 1, 3),
  (76 , 1, 0, 200, 65321200, "soins medicaux en nature"                  , 1, 3),
  (77 , 1, 0, 200, 65331000, "indemnites de transport"                   , 1, 3),
  (78 , 1, 0, 200, 65341000, "indeminites de logement"                   , 1, 3),
  (79 , 1, 0, 200, 65351000, "indeminites de fin de carriere"            , 1, 3),
  (80 , 1, 0, 200, 70011000, "ventes medicaments"                        , 1, 4),
  (81 , 1, 0, 200, 70011200, "perfusion"                                 , 1, 4),
  (82 , 1, 0, 200, 70031400, "ventes lunettes"                           , 1, 4),
  (83 , 1, 0, 200, 70211000, "fiches"                                    , 1, 4),
  (84 , 1, 0, 200, 70471100, "carents de demande de consulta"            , 1, 4),
  (85 , 1, 0, 200, 71011004, "certificats et autres frais ad"            , 1, 4),
  (86 , 1, 0, 200, 71011005, "consultation"                              , 1, 4), -- [ORIGINAL NUMBER - 71011100]
  (87 , 1, 0, 200, 71011031, "platres"                                   , 1, 4),
  (88 , 1, 0, 200, 71011100, "actes chirurgicaux"                        , 1, 4),
  (89 , 1, 0, 200, 71011200, "soins specifiques"                         , 1, 4),
  (90 , 1, 0, 200, 71011300, "soins medicaux"                            , 1, 4),
  (91 , 1, 0, 200, 71011600, "examens labo"                              , 1, 4),
  (92 , 1, 0, 200, 71011700, "readiographies"                            , 1, 4),
  (93 , 1, 0, 200, 71011800, "accouchement"                              , 1, 4),
  (94 , 1, 0, 200, 71014100, "rapport medical"                           , 1, 4),
  (95 , 1, 0, 200, 71015000, "fournitures nursing"                       , 1, 4),
  (96 , 1, 0, 200, 71019000, "echo obstertrique"                         , 1, 4),
  (97 , 1, 0, 200, 71019000, "autres echo"                               , 1, 4),
  (98 , 1, 0, 200, 71051000, "bequilles et platres"                      , 1, 4),
  (99 , 1, 0, 200, 71101100, "urgences"                                  , 1, 4),
  (100, 1, 0, 200, 71161000, "recettes administratives"                  , 1, 4),
  (101, 1, 0, 200, 71161100, "jours lit"                                 , 1, 4),
  (102, 1, 0, 200, 74031000, "loyer - tshitudilu"                        , 1, 4),
  (103, 1, 0, 200, 74611000, "produit de change"                         , 1, 4),
  (104, 1, 0, 200, 74611100, "prod. et prof. div. he/gh"                 , 1, 4),
  (105, 1, 0, 200, 74611350, "prod. et prof. div. /c.e."                 , 1, 4),
  (106, 1, 0, 200, 74611300, "produits frs recherches"                   , 1, 4),
  (107, 1, 0, 200, 74611400, "produits frs de stage"                     , 1, 4),
  (108, 1, 0, 200, 74611450, "produits frs perfectionnement"             , 1, 4),
  (109, 1, 0, 200, 74611500, "produits morgue"                           , 1, 4),
  (110, 1, 0, 200, 74621000, "produits divers"                           , 1, 4),
  (111, 1, 0, 200, 76301000, "subvention d'exploitation mbf"             , 1, 5),
  (112, 1, 0, 200, 76201000, "subvention d'exploitation pcusa"           , 1, 5),
  (113, 1, 0, 200, 76401000, "subvention d'exploitation cbm"             , 1, 5),
  (114, 1, 0, 200, 76101000, "subvention d'exploitation"                 , 1, 5),
  (115, 1, 0, 200, 76100129, "eco fistula project"                       , 1, 5),
  (116, 1, 0, 200, 76111130, "eco cervical cancer"                       , 1, 5),
  (117, 1, 0, 200, 76221450, "eco charity funds"                         , 1, 5),
  (118, 1, 0, 200, 76221126, "eco tshikaji health center"                , 1, 5),
  (119, 1, 0, 200, 76501000, "subvention de l'etat (assp)"               , 1, 5),
  (120, 1, 0, 200, 76601000, "subentions fondation amis de l'imck"       , 1, 5),
  (121, 1, 0, 200, 76111270, "dr sabua scholarship"                      , 1, 5),
  (122, 1, 0, 200, 76121490, "bourse kajibdi/ voyage retour"             , 1, 5),
  (123, 1, 0, 200, 76121600, "dons divers en nature (usa+ amis)"         , 1, 5),
  (124, 1, 0, 200, 76151000, "eco 320802 mibility in mission"            , 1, 5),
  (125, 1, 0, 200, 76121510, "eco general non designe"                   , 1, 5),
  (126, 1, 0, 200, 76111127, "orphan scholarship educat"                 , 1, 5),
  (127, 1, 0, 200, 76221128, "eco healthy mother healthy children (HMHC)", 1, 5),
  (128, 1, 0, 200, 76261121, "eco moringa"                               , 1, 5),
  (129, 1, 0, 200, 76701000, "sub mppc"                                  , 1, 5),
  (130, 1, 0, 200, 76801000, "subvention row"                            , 1, 5),
  (131, 1, 0, 200, 76151000, "fonds epn"                                 , 1, 5),
  (132, 1, 0, 200, 41000000, "caisse"                                    , 1, 0); -- FIXME: This is temporary!

update `enterprise` set `cash_account`=132 where `id`=200;


-- configure price_group

insert into `price_group` values 
  (1,'Imports'),
  (2,'Locals');

-- configure payments

insert into `tax` values 
  (1, 1,'first registration'),
  (2, 2,'second metadata');

insert into `payment` values 
  (1, 14, 0, 'Two Weeks'  , ''),
	(2, 0 , 1, 'One Month'  , ''),
	(3, 0 , 0, 'Immediately', '');

insert into `currency` values
  (1,'Congolese Francs','FC',NULL,900,910,'2013-01-03'),
	(2,'United State Dollars','USD',NULL,1,1,'2013-01-03');

-- configure debitors

insert into `debitor_group_type` (`id`, `type`) values
  (1, 'Employees'),
  (2, 'Conventionees'),
  (3, 'Malades Ambulatoire'),
  (4, 'Malades Interne');


insert into `debitor_group` (`enterprise_id`, `id`, `name`, `account_id`, `location_id`, `payment_id`, `contact_id`, `tax_id`, `type_id`) values 

  (200, 1, "Employees"                 , 65, 1, 1, 1, 1, 1),
  (200, 2, "Fr. Reinhart Conventionees", 63, 1, 1, 1, 1, 2),
  (200, 3, "Normal Debitors"           , 59, 1, 1, 1, 1, 3),
  (200, 4, "Central Pharmacy"          , 56, 1, 1, 1, 1, 3),
  (200, 5, "Other Clients"             , 66, 1, 1, 1, 1, 4);

insert into `debitor` (`id`, `group_id`, `text`) values 
  (1, 3, "Debitor account for patient 1");

insert into `patient` (`id`, `debitor_id`, `sex`, `first_name`, `last_name`, `dob`, `location_id`) values
  (1, 1, "M","Jon", "Niles", "1992-06-07", 1);

-- configure inventory

insert into `inv_unit` values
  (1, 'Act'),
	(2, 'Pallet'),
	(3, 'Pill'),
	(4, 'Box'),
	(5, 'Lot');

insert into `inv_type` values
  (0,'Article'),
  (1,'Assembly'),
  (2,'Service');

insert into `inv_group` values 
  (0, 'Services' , 'S', 90, NULL, NULL, NULL), -- 164
	(1, 'Medicines', 'M', 80, NULL, NULL, NULL), -- 164, 167
	(2, 'Surgery'  , 'C', 88, NULL, NULL, NULL); -- 171

insert into `inventory` values 
  (200, 1, 'CHCRAN', 'Craniotomie'                     , 20000.00, 2, 1, 0, 0, 0, 0, 0, 2, 0),
 	(200, 2, 'CHGLOB', 'Goitre Lobectomie/Hemithyroidect', 20000.00, 2, 1, 0, 0, 0, 0, 0, 2, 0),
 	(200, 3, 'CHGTHY', 'Goitre Thyroidectomie Sobtotale' , 20000.00, 2, 1, 0, 0, 0, 0, 0, 2, 0),
 	(200, 4, 'CHEXKY', 'Excision De Kyste Thyroiglosse'  , 20000.00, 2, 1, 0, 0, 0, 0, 0, 2, 0),
 	(200, 5, 'CHPASU', 'Parotidectomie Superficielle'    , 20000.00, 2, 1, 0, 0, 0, 0, 0, 2, 0),
 	(200, 6, 'CHTRAC', 'Trachectome'                     , 20000.00, 2, 1, 0, 0, 0, 0, 0, 2, 0),
 	(200, 7, 'EXKYSB', 'Kyste Sublingual'                , 20000.00, 2, 1, 0, 0, 0, 0, 0, 2, 0),
 	(200, 8, 'EXKYPB', 'Petite Kyste De La Bouche'       , 20000.00, 2, 1, 0, 0, 0, 0, 0, 2, 0);

-- configure department

insert into `department` values
  (200, 1, 'Vanga Admin'     , NULL),
	(200, 2, 'Vanga Atelier'   , 'The workforce at Vanga'),
	(200, 3, 'Vanga Pharamacy' , NULL),
	(200, 4, 'Vanga Accounting', 'Keeping track of accounts');

-- configure journal/transaction/general ledger

insert into `transaction_type` values 
  (1, 'cash'),
	(2, 'sale'),
	(3, 'purchase');
