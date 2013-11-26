DROP DATABASE IF EXISTS`kpk`;
CREATE DATABASE `kpk`;
USE `kpk`;
UNLOCK TABLES;

GRANT ALL ON `kpk`.* TO 'kpk'@'%' IDENTIFIED BY 'HISCongo2013';
FLUSH PRIVILEGES;

--
-- Table structure for table `kpk`.`tax`
--
DROP TABLE IF EXISTS `tax`;
CREATE TABLE `tax` (
  `id`            smallint unsigned NOT NULL AUTO_INCREMENT,
  `registration`  mediumint unsigned NOT NULL,
  `note`          text,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB;

--
-- Dumping data for table `kpk`.`tax`
--
LOCK TABLES `tax` WRITE;
INSERT INTO `tax` VALUES
  (1, 1,'first registration'),
  (2, 2,'second metadata');
UNLOCK TABLES;

--
-- Table structure for table `kpk`.`currency`
--
DROP TABLE IF EXISTS `currency`;
CREATE TABLE `currency` (
  `id`            tinyint unsigned NOT NULL,
  `name`          text NOT NULL,
  `symbol`        varchar(15) NOT NULL,
  `note`          text,
  `current_rate`  mediumint unsigned,
  `last_rate`     mediumint unsigned,
  `updated`       date NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB;

--
-- Dumping data for table `kpk`.`currency`
--
LOCK TABLES `currency` WRITE;
INSERT INTO `currency` VALUES
  (1,'Congolese Francs','FC',NULL,900,910,'2013-01-03'),
	(2,'United State Dollars','USD',NULL,1,1,'2013-01-03');
UNLOCK TABLES;

--
-- Table structure for table `kpk`.`user`
--
DROP TABLE IF EXISTS `user`;
CREATE TABLE `user` (
  `id`        smallint unsigned NOT NULL AUTO_INCREMENT,
  `username`  varchar(80) NOT NULL,
  `password`  varchar(100) NOT NULL,
  `first`     text NOT NULL,
  `last`      text NOT NULL,
  `email`     varchar(100),
  `logged_in` boolean NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB;

--
-- Dumping data for table `kpk`.`user`
--
LOCK TABLES `user` WRITE;
INSERT INTO `user` VALUES
  (1,'jniles','malamumoke','Jonathan','Niles','jonathanwniles@gmail.com',0),
	(2,'delva','1','Dedrick','kitamuka','kitamuka@gmail.com',0),
	(13,'sfount','1','Steven','Fountain','StevenFountain@live.co.uk',1);
UNLOCK TABLES;

--
-- Table structure for table `kpk`.`unit`
--
DROP TABLE IF EXISTS `unit`;
CREATE TABLE `unit` (
  `id`            smallint unsigned NOT NULL,
  `name`          varchar(30) NOT NULL,
  `description`   text NOT NULL,
  `parent`        smallint default 0,
  `has_children`  boolean NOT NULL default 0,
  `url`           tinytext,
  `p_url`         tinytext,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB;

--
-- Dumping data for table `kpk`.`unit`
--
LOCK TABLES `unit` WRITE;
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
	(41,'Purchase Order Records','',5,0,'partials/purchase_records/','purchase_records/');
UNLOCK TABLES;

--
-- Table structure for table `kpk`.`permission`
--
DROP TABLE IF EXISTS `permission`;
CREATE TABLE `permission` (
  `id`        mediumint unsigned NOT NULL AUTO_INCREMENT,
  `id_unit`   smallint unsigned NOT NULL,
  `id_user`   smallint unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `id_unit` (`id_unit`),
  KEY `id_user` (`id_user`),
  CONSTRAINT FOREIGN KEY (`id_unit`) REFERENCES `unit` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT FOREIGN KEY (`id_user`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

--
-- Dumping data for table `kpk`.`permission`
--
LOCK TABLES `permission` WRITE;
INSERT INTO `permission` VALUES
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
	(45,41,2);
UNLOCK TABLES;


--
-- Table structure for table `kpk`.`enterprise`
--
DROP TABLE IF EXISTS `enterprise`;
CREATE TABLE `enterprise` (
  `id`                  smallint unsigned NOT NULL AUTO_INCREMENT,
  `region`              varchar(70) NOT NULL,
  `country`             varchar(70) NOT NULL,
  `city`                varchar(70) NOT NULL,
  `name`                varchar(70) NOT NULL,
  `phone`               varchar(20) NOT NULL,
  `email`               varchar(70) NOT NULL,
  `type`                varchar(70) NOT NULL,
  `cash_account`        int unsigned,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB;

--
-- Dumping data for table `kpk`.`enterprise`
--
LOCK TABLES `enterprise` WRITE;
INSERT INTO `enterprise` VALUES
  (1,'Kinshasa','RDC','Kinshasa','DEFAULT','18002324576','default@default.org','1',570000),
	(101,'Kinshasa','RDC','Kinshasa','IMA','18004743201','jniles@example.com','1',570000),
	(102,'Bandundu','RDC','Kikwit','IMAKik','--','jniles@example.com','1',570000);
UNLOCK TABLES;


--
-- Table structure for table `kpk`.`price_group`
--
DROP TABLE IF EXISTS `price_group`;
CREATE TABLE `price_group` (
  `id`    smallint unsigned NOT NULL,
  `text`  varchar(100) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB;

--
-- Dumping data for table `kpk`.`price_group`
--
LOCK TABLES `price_group` WRITE;
INSERT INTO `price_group` VALUES 
  (1,'Imports'),
  (2,'Locals');
UNLOCK TABLES;

--
-- Table structure for table `kpk`.`fiscal_year`
--
DROP TABLE IF EXISTS `fiscal_year`;
CREATE TABLE `fiscal_year` (
  `enterprise_id`             smallint unsigned NOT NULL,
  `id`                        mediumint unsigned NOT NULL AUTO_INCREMENT,
  `number_of_months`          mediumint unsigned NOT NULL,
  `fiscal_year_txt`           text NOT NULL,
  `transaction_start_number`  int unsigned,
  `transaction_stop_number`   int unsigned,
  `fiscal_year_number`        mediumint(9),
  `start_month`               int unsigned NOT NULL,
  `start_year`                int unsigned NOT NULL,
  `previous_fiscal_year`      mediumint unsigned,
  PRIMARY KEY (`id`),
  KEY `enterprise_id` (`enterprise_id`),
  CONSTRAINT FOREIGN KEY (`enterprise_id`) REFERENCES `enterprise` (`id`)
) ENGINE=InnoDB;


--
-- Table structure for table `kpk`.`budget`
--
DROP TABLE IF EXISTS `budget`;
CREATE TABLE `budget` (
  `id` int NOT NULL AUTO_INCREMENT,
  `account_id` int unsigned NOT NULL DEFAULT '0',
  `period_id` mediumint unsigned NOT NULL,
  `budget` decimal(10,2) unsigned,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB;

--
-- Table structure for table `kpk`.`account_type`
--
DROP TABLE IF EXISTS `account_type`;
CREATE TABLE `account_type` (
  `id` mediumint unsigned NOT NULL,
  `type` varchar(35) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB;

--
-- Dumping data for table `kpk`.`account_type`
--
LOCK TABLES `account_type` WRITE;
INSERT INTO `account_type` VALUES 
  (1,'income/expense'),
  (2,'balance'),
  (3,'title');
UNLOCK TABLES;

--
-- Table structure for table `kpk`.`country`
--
DROP TABLE IF EXISTS `country`;
CREATE TABLE `country` (
  `id`          smallint unsigned NOT NULL AUTO_INCREMENT,
  `code`        smallint unsigned NOT NULL,
  `country_en`  varchar(45) NOT NULL,
  `country_fr`  varchar(45) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code_unique` (`code`)
) ENGINE=InnoDB;

--
-- Dumping data for table `kpk`.`country`
--
LOCK TABLES `country` WRITE;
INSERT INTO `country` VALUES
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
UNLOCK TABLES;

--
-- Table structure for table `kpk`.`location`
--
DROP TABLE IF EXISTS `location`;
CREATE TABLE `location` (
  `id`          smallint unsigned NOT NULL AUTO_INCREMENT,
  `city`        varchar(45),
  `region`      varchar(45),
  `country_id`  smallint unsigned NOT NULL,
  `zone`        varchar(45),
  `village`     varchar(45),
  PRIMARY KEY (`id`),
  KEY `country_id` (`country_id`),
  CONSTRAINT FOREIGN KEY (`country_id`) REFERENCES `country` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB; 

--
-- Dumping data for table `kpk`.`location`
--
LOCK TABLES `location` WRITE;
INSERT INTO `location` VALUES
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
UNLOCK TABLES;

--
-- Table structure for table `kpk`.`account`
--
DROP TABLE IF EXISTS `account`;
CREATE TABLE `account` (
  `id`                  int unsigned not null AUTO_INCREMENT, -- id is now primary key
  `enterprise_id`       smallint unsigned NOT NULL,
  `account_number`      mediumint unsigned NOT NULL,
  `account_txt`         text,
  `account_type_id`     mediumint unsigned NOT NULL,
  `account_category`    text NOT NULL,
  `fixed`               boolean DEFAULT '0',
  `locked`              boolean NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `enterprise_id` (`enterprise_id`),
  KEY `account_type_id` (`account_type_id`),
  CONSTRAINT FOREIGN KEY (`enterprise_id`) REFERENCES `enterprise` (`id`),
  CONSTRAINT FOREIGN KEY (`account_type_id`) REFERENCES `account_type` (`id`)
) ENGINE=InnoDB;

--
-- Dumping data for table `kpk`.`account`
--
LOCK TABLES `account` WRITE;
INSERT INTO `account` (`enterprise_id`, `account_number`, `fixed`, `account_txt`, `account_type_id`, `account_category`, `locked`) VALUES
  (101,100000,0,'capital social',1,'300',0),
	(101,110000,0,'reserves',1,'300',0),
	(101,120000,0,'report',1,'300',0),
	(101,130000,0,'resultat',1,'300',0),
	(101,130100,0,'benefice',1,'300',0),
	(101,130200,0,'perte',1,'300',0),
	(101,150000,0,'subventions d\'equipement',1,'300',0),
	(101,150100,0,'etat',1,'300',0),
	(101,150200,0,'organismes prives outre-mer',1,'300',0),
	(101,160000,0,'emprunts et dettes a long terme',1,'300',0),
	(101,170000,0,'emprunts et dettes a moyen terme',1,'300',0),
	(101,180000,0,'provisions pour charges et pertes',1,'300',0),
	(101,210000,1,'terrains',1,'300',0),
	(101,220000,1,'immobilisations corporelles',1,'300',0),
	(101,220100,1,'batiments et constructions (d\'exploitation)',1,'300',0),
	(101,220200,1,'batiments residentiels',1,'300',0),
	(101,220300,1,'installations d\'utilisation generale',1,'300',0),
	(101,220400,1,'ambulances',1,'300',0),
	(101,220500,1,'autres vehicules',1,'300',0),
	(101,220600,1,'motos',1,'300',0),
	(101,220700,1,'grands materiels hospitaliers',1,'300',0),
	(101,220800,1,'centrales electriques',1,'300',0),
	(101,220900,1,'autres materiels hospitaliers (radios,autoclaves)',1,'300',0),
	(101,221000,1,'mobiliers de services',1,'300',0),
	(101,221100,1,'mobiliers residentiels',1,'300',0),
	(101,230000,1,'immobilisations corporelles en cours',1,'300',0),
	(101,230100,1,'batiment en construction',1,'300',0),
	(101,230200,1,'batiment residentiels en construction',1,'300',0),
	(101,240000,1,'avances et acomptes sur immobilisations en commande',1,'300',0),
	(101,240100,1,'batiments (tous)',1,'300',0),
	(101,240200,1,'materiels (tous)',1,'300',0),
	(101,240300,1,'mobiliers (tous)',1,'300',0),
	(101,280000,1,'amortissemnts et provisions pour depreciation de la classe 2',1,'300',0),
	(101,280100,1,'provision pour depreciation',1,'300',0),
	(101,300000,1,'stocks medicaments et fiches',1,'300',0),
	(101,300100,1,'pharmacie des stocks',1,'300',0),
	(101,300200,1,'pharmacie d\'usage',1,'300',0),
	(101,300300,1,'stock des fiches des malades',1,'300',0),
	(101,300400,1,'fardes chemises pour des malades',1,'300',0),
	(101,300500,1,'materiels',1,'300',0),
	(101,310000,1,'autres matieres et fournitures',1,'300',0),
	(101,310100,1,'planches',1,'300',0),
	(101,310200,1,'toles',1,'300',0),
	(101,310300,1,'ciments',1,'300',0),
	(101,310400,1,'linges (literie)',1,'300',0),
	(101,310500,1,'petrole',1,'300',0),
	(101,310600,1,'carburants et huiles',1,'300',0),
	(101,310700,1,'fournitures de bureau',1,'300',0),
	(101,310800,1,'denrees alimentaires (a distribuer aux malades)',1,'300',0),
	(101,310900,1,'divers stock',1,'300',0),
	(101,311000,1,'pieces des rechanges',1,'300',0),
	(101,311100,1,'cantine HEV',1,'300',0),
	(101,360000,1,'socks a l\'exterieur',1,'300',0),
	(101,380000,1,'provision pour depreciation de la classe 3',1,'300',0),
	(101,400000,1,'fournisseur',1,'300',0),
	(101,400100,1,'pharmacie centrale',1,'300',0),
	(101,400200,1,'VEE',1,'300',0),
	(101,400300,1,'autres fournisseurs',1,'300',0),
	(101,410000,1,'clents',1,'300',0),
	(101,410100,1,'bureau centrale de zone',1,'300',0),
	(101,410200,1,'ITM Vanga',1,'300',0),
	(101,410300,1,'pharmacie centrale',1,'300',0),
	(101,410400,1,'frere CT',1,'300',0),
	(101,410600,1,NULL,1,'300',0),
	(101,410700,1,'personnel de l\'HE',1,'300',0),
	(101,410800,1,'autres clents',1,'300',0),
	(101,410900,1,'construction vanga',1,'300',0),
	(101,411000,1,'PAEV/Vanga',1,'300',0),
	(101,411100,1,'ACDI/Lusekele',1,'300',0),
	(101,411200,1,'MAF/Vanga',1,'300',0),
	(101,420000,1,'personnel',1,'300',0),
	(101,420100,1,'avances sur salaires au personnel',1,'300',0),
	(101,420200,1,'remunerations dues',1,'300',0),
	(101,420300,1,'toles pour agents',1,'300',0),
	(101,430000,1,'Etat',1,'300',0),
	(101,430100,1,'CPR',1,'300',0),
	(101,430200,1,'autres taxes',1,'300',0),
	(101,460000,0,'debiteurs et crediteurs divers',1,'300',0),
	(101,460100,0,'INSS',1,'300',0),
	(101,460200,0,'syndicat',1,'300',0),
	(101,460300,0,'debiteurs divers',1,'300',0),
	(101,460400,0,'crediteurs divers',1,'300',0),
	(101,460500,0,'location des livres',1,'300',0),
	(101,460600,0,'salaire agents clemmer',1,'300',0),
	(101,470000,0,'regularisations et charges a etaler',1,'300',0),
	(101,470100,0,'regularisations actives',1,'300',0),
	(101,470200,0,'regularisations passives',1,'300',0),
	(101,470300,0,'compte d\'attente a regulariser',1,'300',0),
	(101,480000,0,'provision pour depreciation de la classe 3',1,'300',0),
	(101,490000,0,'compte d\'attente a regulariser',1,'300',0),
	(101,510000,0,'pret social du personnel',1,'300',0),
	(101,550000,0,'cheque a encaisser (remise cheque)',1,'300',0),
	(101,560000,0,'banque et coopec',1,'300',0),
	(101,560100,0,'BCZ Kikwit',1,'300',0),
	(101,560200,0,'Tresorerie generale',1,'300',0),
	(101,560300,0,'COOPEC',1,'300',0),
	(101,560400,0,'Pharmacie centrale compte epargne',1,'300',0),
	(101,570000,0,'caisse',1,'300',0),
	(101,590000,0,'virement interne',1,'300',0),
	(101,600000,0,'stocks vendus',1,'300',0),
	(101,600100,0,'Medicaments vendus aux malades',1,'300',0),
	(101,600200,0,'Medicaments transferes aux services hospitaliers',1,'300',0),
	(101,600300,0,'fiches vendues(fiches malades et fardes)',1,'300',0),
	(101,600400,0,'Materiels(Rx,...)',1,'300',0),
	(101,610000,0,'Matieres et fournitures consommees',1,'300',0),
	(101,610100,0,'planches consommees',1,'300',0),
	(101,610200,0,'toles consommees',1,'300',0),
	(101,610300,0,'ciments consommes',1,'300',0),
	(101,610400,0,'linges consommees',1,'300',0),
	(101,610500,0,'petrole consomme',1,'300',0),
	(101,610600,0,'carburants et huiles consommes',1,'300',0),
	(101,610700,0,'fourniture de bureau consommees',1,'300',0),
	(101,610800,0,'denrhees alimentaires aux malades',1,'300',0),
	(101,610900,0,'divers consommes',1,'300',0),
	(101,611000,0,'pieces de rechange consommes',1,'300',0),
	(101,611100,0,'Electricite',1,'300',0),
	(101,611200,0,'white cross',1,'300',0),
	(101,620000,0,'transport consomme',1,'300',0),
	(101,620100,0,'transport routier',1,'300',0),
	(101,620200,0,'transport aerien',1,'300',0),
	(101,620300,0,'Transport fluvial',1,'300',0),
	(101,630000,0,'autres services consommes',1,'300',0),
	(101,630100,0,'Honraires des medecins',1,'300',0),
	(101,630200,0,'Entretien des batiments',1,'300',0),
	(101,630300,0,'salaires des journaliers',1,'300',0),
	(101,630400,0,'autres services consommes',1,'300',0),
	(101,630500,0,'frais de mission',1,'300',0),
	(101,630600,0,'Frais bancaires',1,'300',0),
	(101,630700,0,'Frais de reparation',1,'300',0),
	(101,630800,0,'loyers payes',1,'300',0),
	(101,630900,0,'Publicite et annoces',1,'300',0),
	(101,631000,0,'PTT',1,'300',0),
	(101,640000,0,'charges et pertes diverses',1,'300',0),
	(101,640100,0,'soins medicaux aux pensionnes',1,'300',0),
	(101,640200,0,'Assurances de vehicules',1,'300',0),
	(101,640300,0,'Assurances de motos',1,'300',0),
	(101,640400,0,'Dons et liberalites(charges et pertes diverses)',1,'300',0),
	(101,640500,0,'Perte de change',1,'300',0),
	(101,640600,0,'Autres charges et pertes',1,'300',0),
	(101,640800,0,'Contributions',1,'300',0),
	(101,640900,0,'Receptions',1,'300',0),
	(101,641000,0,'Soins aux pauvres',1,'300',0),
	(101,650000,0,'Charge du personnel',1,'300',0),
	(101,650100,0,'Salaires bruts',1,'300',0),
	(101,650200,0,'Decompte final',1,'300',0),
	(101,650300,0,'Soins medicaux aux personnels',1,'300',0),
	(101,650400,0,'Complement slaires aux medecins',1,'300',0),
	(101,650500,1,'Autres personnels missionnaires',1,'300',0),
	(101,650600,0,'INSS(Quote part natiional)',1,'300',0),
	(101,650700,0,'Autres charges du personnel',1,'300',0),
	(101,650800,0,'Conges payes',1,'300',0),
	(101,650900,0,'Pecules de conge',1,'300',0),
	(101,651000,0,'Salaires agents Directeur Clemmer',1,'300',0),
	(101,651100,0,'Subvention CS',1,'300',0),
	(101,660000,0,'Taxes divers',1,'300',0),
	(101,660100,0,'TAxes sur vehicules',1,'300',0),
	(101,660200,0,'Taxes sur motos',1,'300',0),
	(101,660300,0,'Taxes diverses',1,'300',0),
	(101,670000,0,'Interets payes',1,'300',0),
	(101,680000,0,'Dotations aux amortissements et provisions',1,'300',0),
	(101,680100,0,'Batiments et constructions',1,'300',0),
	(101,680200,0,'Batiments residentiels',1,'300',0),
	(101,681200,0,'Autrea dotations et provisions',1,'300',0),
	(101,700000,0,'Vente des medicaments et fiches',1,'300',0),
	(101,700100,0,'Pharmacie d\'usage',1,'300',0),
	(101,700200,0,'Ventes fiches',1,'300',0),
	(101,710000,0,'Recettes d\'activites',1,'300',0),
	(101,710100,0,'Pavillion(medical et chirurgical)',1,'300',0),
	(101,710200,0,'Laboratoire',1,'300',0),
	(101,710300,0,'Radiologie',1,'300',0),
	(101,710400,0,'Chirurgie',1,'300',0),
	(101,710500,0,'Pediatrie',1,'300',0),
	(101,710600,0,'Maternite',1,'300',0),
	(101,710700,0,'consultation polyclinique',1,'300',0),
	(101,710800,0,'Clinique privee',1,'300',0),
	(101,710900,0,'Dentisterie',1,'300',0),
	(101,711000,0,'Ophtalmologie',1,'300',0),
	(101,711100,0,'Administration',1,'300',0),
	(101,711200,0,'Kinesitherapie',1,'300',0),
	(101,711300,0,'Sanatorium',1,'300',0),
	(101,711400,0,'Centre nutritionnel',1,'300',0),
	(101,711500,0,'Sions intensifs',1,'300',0),
	(101,711619,0,'Echographie',1,'300',0),
	(101,711720,0,'ECG',1,'300',0),
	(101,730000,0,'Travail propre et charge a etaler',1,'300',0),
	(101,730100,0,'Travail propre',1,'300',0),
	(101,730200,0,'Charges a etaler',1,'300',0),
	(101,740000,0,'Produits et profits divers',1,'300',0),
	(101,740100,0,'produits divers',1,'300',0),
	(101,740200,0,'Profits divers',1,'300',0),
	(101,740300,0,'Frais de formation',1,'300',0),
	(101,760000,0,'Subvention d\'exploitation',1,'300',0),
	(101,760100,0,'Salaire de d\'etat',1,'300',0),
	(101,760200,0,'Autres subventions de l\'etat',1,'300',0),
	(101,760300,0,'Subventions organismes prives',1,'300',0),
	(102,760400,0,'Subventions locales',1,'300',0),
	(102,760500,0,'Autres subventions',1,'300',0);
UNLOCK TABLES;


--
-- Table structure for table `kpk`.`creditor_group`
--
DROP TABLE IF EXISTS `creditor_group`;
CREATE TABLE `creditor_group` (
  `id`          smallint NOT NULL AUTO_INCREMENT,
  `group_txt`   varchar(45),
  `account_id`  int unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `account_id` (`account_id`),
  CONSTRAINT FOREIGN KEY (`account_id`) REFERENCES `account` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;


--
-- Table structure for table `kpk`.`creditor`
--
DROP TABLE IF EXISTS `creditor`;
CREATE TABLE `creditor` (
  `id`                int unsigned NOT NULL AUTO_INCREMENT,
  `creditor_group_id` smallint NOT NULL,
  `creditor_txt`      varchar(45),
  PRIMARY KEY (`id`),
  KEY `creditor_group_id` (`creditor_group_id`),
  CONSTRAINT FOREIGN KEY (`creditor_group_id`) REFERENCES `creditor_group` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

--
-- Table structure for table `kpk`.`payment`
--

DROP TABLE IF EXISTS `payment`;
CREATE TABLE `payment` (
  `id`      tinyint unsigned NOT NULL,
  `days`    smallint unsigned DEFAULT '0',
  `months`  mediumint unsigned DEFAULT '0',
  `text`    varchar(50) NOT NULL,
  `note`    text,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB;

--
-- Dumping data for table `kpk`.`payment`
--
LOCK TABLES `payment` WRITE;
INSERT INTO `payment` VALUES
  (1,14,0,'Two Weeks',''),
	(2,0,1,'One Month',''),
	(3,0,0,'Immediately','');
UNLOCK TABLES;

--
-- Table structure for table `kpk`.`debitor_group_type`
--
DROP TABLE IF EXISTS `debitor_group_type`;
CREATE TABLE `debitor_group_type` (
  `id` smallint unsigned NOT NULL,
  `type` varchar(80) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB;

--
-- Dumping data for table `kpk`.`debitor_group_type`
--
LOCK TABLES `debitor_group_type` WRITE;
INSERT INTO `debitor_group_type` VALUES
  (1,'Employees'),
	(2,'Conventionnees'),
	(3,'Malades Ambulatoire'),
	(4,'Malades Interne');
UNLOCK TABLES;

--
-- Table structure for table `kpk`.`debitor_group`
--
DROP TABLE IF EXISTS `debitor_group`;
CREATE TABLE `debitor_group` (
  `enterprise_id`       smallint unsigned NOT NULL,
  `id`                  smallint unsigned AUTO_INCREMENT NOT NULL,
  `name`                varchar(100) NOT NULL,
  `account_number`          int unsigned NOT NULL,
  `location_id`         smallint unsigned NOT NULL,
  `payment_id`          tinyint unsigned NOT NULL DEFAULT '3',
  `phone`               varchar(10) DEFAULT '',
  `email`               varchar(30) DEFAULT '',
  `note`                text,
  `locked`              boolean NOT NULL DEFAULT 0,
  `contact_id`          smallint unsigned,
  `tax_id`              smallint unsigned NULL,
  `max_credit`          mediumint unsigned DEFAULT '0',
  `type_id`             smallint unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `enterprise_id` (`enterprise_id`),
  --KEY `account_id` (`account_id`),
  KEY `location_id` (`location_id`),
  KEY `payment_id` (`payment_id`),
  KEY `contact_id` (`contact_id`),
  KEY `tax_id` (`tax_id`),
  KEY `type_id` (`type_id`),
  CONSTRAINT FOREIGN KEY (`enterprise_id`) REFERENCES `enterprise` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  --CONSTRAINT FOREIGN KEY (`account_id`) REFERENCES `account` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT FOREIGN KEY (`location_id`) REFERENCES `location` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT FOREIGN KEY (`payment_id`) REFERENCES `payment` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT FOREIGN KEY (`tax_id`) REFERENCES `tax` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT FOREIGN KEY (`type_id`) REFERENCES `debitor_group_type` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

--
-- Table structure for table `kpk`.`debitor`
--
DROP TABLE IF EXISTS `debitor`;
CREATE TABLE `debitor` (
  `id`        int unsigned NOT NULL,
  `group_id`  smallint unsigned NOT NULL,
  `text`      text,
  PRIMARY KEY (`id`),
  KEY `group_id` (`group_id`),
  CONSTRAINT FOREIGN KEY (`group_id`) REFERENCES `debitor_group` (`id`)
) ENGINE=InnoDB;

--
-- Table structure for table `kpk`.`supplier`
--
DROP TABLE IF EXISTS `supplier`;
CREATE TABLE `supplier` (
  `id`            int unsigned NOT NULL AUTO_INCREMENT,
  `creditor_id`   int unsigned NOT NULL,
  `name`          varchar(45) NOT NULL,
  `address_1`     text,
  `address_2`     text,
  `location_id`   smallint unsigned NOT NULL,
  `email`         varchar(45),
  `fax`           varchar(45),
  `note`          varchar(50),
  `phone`         varchar(15),
  `international` boolean NOT NULL DEFAULT 0,
  `locked`        boolean NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `creditor_id` (`creditor_id`),
  KEY `location_id` (`location_id`),
  CONSTRAINT FOREIGN KEY (`location_id`) REFERENCES `location` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT FOREIGN KEY (`creditor_id`) REFERENCES `creditor` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

--
-- Table structure for table `kpk`.`patient`
--
DROP TABLE IF EXISTS `patient`;
CREATE TABLE `patient` (
  `id`              int unsigned NOT NULL AUTO_INCREMENT,
  `debitor_id`      int unsigned NOT NULL,
  `creditor_id`     int unsigned,
  `first_name`      varchar(150) NOT NULL,
  `last_name`       varchar(150) NOT NULL,
  `dob`             date,
  `parent_name`     varchar(150),
  `sex`             char(1) NOT NULL,
  `religion`        varchar(50),
  `marital_status`  varchar(50),
  `phone`           varchar(12),
  `email`           varchar(20),
  `addr_1`          varchar(100),
  `addr_2`          varchar(100),
  `location_id`     smallint unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `first_name` (`first_name`),
  KEY `debitor_id` (`debitor_id`),
  KEY `location_id` (`location_id`),
  UNIQUE KEY `creditor_id` (`creditor_id`),
  CONSTRAINT FOREIGN KEY (`debitor_id`) REFERENCES `debitor` (`id`) ON UPDATE CASCADE,
  CONSTRAINT FOREIGN KEY (`location_id`) REFERENCES `location` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB;


--
-- Table structure for table `kpk`.`inv_unit`
--
DROP TABLE IF EXISTS `inv_unit`;
CREATE TABLE `inv_unit` (
  `id`    smallint unsigned NOT NULL AUTO_INCREMENT,
  `text`  varchar(100) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB;

--
-- Dumping data for table `kpk`.`inv_unit`
--
LOCK TABLES `inv_unit` WRITE;
INSERT INTO `inv_unit` VALUES 
  (1,'Act'),
	(2,'Pallet'),
	(3,'Pill'),
	(4,'Box'),
	(5,'Lot');
UNLOCK TABLES;

--
-- Table structure for table `kpk`.`period`
--
DROP TABLE IF EXISTS `period`;
CREATE TABLE `period` (
  `id`              mediumint unsigned NOT NULL AUTO_INCREMENT,
  `fiscal_year_id`  mediumint unsigned NOT NULL,
  `period_start`    date NOT NULL,
  `period_stop`     date NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fiscal_year_id` (`fiscal_year_id`),
  CONSTRAINT FOREIGN KEY (`fiscal_year_id`) REFERENCES `fiscal_year` (`id`)
) ENGINE=InnoDB;

--
-- Table structure for table `kpk`.`department`
--
DROP TABLE IF EXISTS `department`;
CREATE TABLE `department` (
  `enterprise_id` smallint unsigned NOT NULL,
  `id`            smallint unsigned NOT NULL,
  `name`          varchar(100) NOT NULL,
  `note`          text,
  PRIMARY KEY (`id`),
  KEY `enterprise_id` (`enterprise_id`),
  CONSTRAINT FOREIGN KEY (`enterprise_id`) REFERENCES `enterprise` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

--
-- Dumping data for table `kpk`.`department`
--
LOCK TABLES `department` WRITE;
INSERT INTO `department` VALUES
  (101,1,'Vanga Admin',NULL),
	(101,2,'Vanga Atelier','The workforce at Vanga'),
	(101,3,'Vanga Pharamacy',NULL),
	(101,4,'Vanga Accounting','Keeping track of accounts');
UNLOCK TABLES;

--
-- Table structure for table `kpk`.`employee`
--
DROP TABLE IF EXISTS `employee`;
CREATE TABLE `employee` (
  `id`            smallint unsigned NOT NULL,
  `name`          varchar(50) NOT NULL,
  `title`         varchar(50),
  `debitor_id`    int unsigned NOT NULL,
  `creditor_id`   int unsigned NOT NULL,
  `location_id`   smallint unsigned NOT NULL,
  `department_id` smallint unsigned NOT NULL,
  `initials`      varchar(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `debitor_id` (`debitor_id`),
  KEY `location_id` (`location_id`),
  KEY `department_id` (`department_id`),
  KEY `creditor_id` (`creditor_id`),
  CONSTRAINT FOREIGN KEY (`debitor_id`) REFERENCES `debitor` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT FOREIGN KEY (`location_id`) REFERENCES `location` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT FOREIGN KEY (`creditor_id`) REFERENCES `creditor` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT FOREIGN KEY (`department_id`) REFERENCES `department` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

--
-- Table structure for table `kpk`.`inv_type`
--
DROP TABLE IF EXISTS `inv_type`;
CREATE TABLE `inv_type` (
  `id`    tinyint unsigned NOT NULL,
  `text`  varchar(150) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB;

--
-- Dumping data for table `kpk`.`inv_type`
--
LOCK TABLES `inv_type` WRITE;
INSERT INTO `inv_type` VALUES
  (0,'Article'),
  (1,'Assembly'),
  (2,'Service');
UNLOCK TABLES;

--
-- Table structure for table `kpk`.`inv_group`
--
DROP TABLE IF EXISTS `inv_group`;
CREATE TABLE `inv_group` (
  `id`              smallint unsigned NOT NULL,
  `name`            varchar(100) NOT NULL,
  `symbol`          char(1) NOT NULL,
  `sales_account`   int unsigned NOT NULL,
  `cogs_account`    int unsigned,
  `stock_account`   int unsigned,
  `tax_account`     int unsigned,
  PRIMARY KEY (`id`)
  --,
  --KEY `sales_account` (`sales_account`),
  --KEY `cogs_account` (`cogs_account`),
  --KEY `stock_account` (`stock_account`),
  --KEY `tax_account` (`tax_account`),
  --CONSTRAINT FOREIGN KEY (`sales_account`) REFERENCES `account` (`id`),
  --CONSTRAINT FOREIGN KEY (`cogs_account`) REFERENCES `account` (`id`),
  --CONSTRAINT FOREIGN KEY (`stock_account`) REFERENCES `account` (`id`),
  --CONSTRAINT FOREIGN KEY (`tax_account`) REFERENCES `account` (`id`)
) ENGINE=InnoDB;

--
-- Table structure for table `kpk`.`inventory`
--
DROP TABLE IF EXISTS `inventory`;
CREATE TABLE `inventory` (
  `enterprise_id` smallint unsigned NOT NULL,
  `id`            int unsigned NOT NULL,
  `code`          varchar(10) NOT NULL,
  `text`          text,
  `price`         decimal(10,2) unsigned NOT NULL DEFAULT '0.00',
  `group_id`      smallint unsigned NOT NULL,
  `unit_id`       smallint unsigned,
  `unit_weight`   mediumint DEFAULT '0',
  `unit_volume`   mediumint DEFAULT '0',
  `stock`         int unsigned NOT NULL DEFAULT '0',
  `stock_max`     int unsigned NOT NULL DEFAULT '0',
  `stock_min`     int unsigned NOT NULL DEFAULT '0',
  `type_id`       tinyint unsigned NOT NULL DEFAULT '0',
  `consumable`    boolean NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  KEY `enterprise_id` (`enterprise_id`),
  KEY `group_id` (`group_id`),
  KEY `unit_id` (`unit_id`),
  KEY `type_id` (`type_id`),
  CONSTRAINT FOREIGN KEY (`enterprise_id`) REFERENCES `enterprise` (`id`),
  CONSTRAINT FOREIGN KEY (`group_id`) REFERENCES `inv_group` (`id`),
  CONSTRAINT FOREIGN KEY (`unit_id`) REFERENCES `inv_unit` (`id`),
  CONSTRAINT FOREIGN KEY (`type_id`) REFERENCES `inv_type` (`id`)
) ENGINE=InnoDB;

--
-- Table structure for table `kpk`.`sale`
--
DROP TABLE IF EXISTS `sale`;
CREATE TABLE `sale` (
  `enterprise_id` smallint unsigned NOT NULL,
  `id`            int unsigned NOT NULL AUTO_INCREMENT,
  `cost`          decimal(19, 2) unsigned NOT NULL,
  `currency_id`   tinyint unsigned NOT NULL,
  `debitor_id`    int unsigned NOT NULL,
  `seller_id`     smallint unsigned NOT NULL,
  `discount`      mediumint unsigned DEFAULT '0',
  `invoice_date`  date NOT NULL, -- is this the date of the sale?
  `note`          text,
  `posted`        boolean NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `enterprise_id` (`enterprise_id`),
  KEY `debitor_id` (`debitor_id`),
  KEY `currency_id` (`currency_id`),
  CONSTRAINT FOREIGN KEY (`enterprise_id`) REFERENCES `enterprise` (`id`),
  CONSTRAINT FOREIGN KEY (`debitor_id`) REFERENCES `debitor` (`id`),
  CONSTRAINT FOREIGN KEY (`currency_id`) REFERENCES `currency` (`id`)
) ENGINE=InnoDB;

--
-- Table structure for table `kpk`.`sale_item`
--
DROP TABLE IF EXISTS `sale_item`;
CREATE TABLE `sale_item` (
  `sale_id`       int unsigned NOT NULL,
  `id`            int unsigned NOT NULL AUTO_INCREMENT,
  `inventory_id`  int unsigned NOT NULL,
  `quantity`      int unsigned DEFAULT '0',
  `unit_price`    int unsigned NOT NULL,
  `total`         int unsigned,
  PRIMARY KEY (`id`),
  KEY `sale_id` (`sale_id`),
  KEY `inventory_id` (`inventory_id`),
  CONSTRAINT FOREIGN KEY (`sale_id`) REFERENCES `sale` (`id`) ON DELETE CASCADE,
  CONSTRAINT FOREIGN KEY (`inventory_id`) REFERENCES `inventory` (`id`)
) ENGINE=InnoDB;

--
-- Table structure for table `kpk`.`purchase`
--
DROP TABLE IF EXISTS `purchase`;
CREATE TABLE `purchase` (
  `id`                int unsigned NOT NULL,
  `enterprise_id`     smallint unsigned NOT NULL,
  `cost`              int unsigned NOT NULL DEFAULT '0',
  `currency_id`       tinyint unsigned NOT NULL,
  `creditor_id`       int unsigned NOT NULL,
  `purchaser_id`      smallint unsigned NOT NULL,
  `discount`          mediumint unsigned DEFAULT '0',
  `invoice_date`      date NOT NULL,
  `note`              text default null,
  `posted`            boolean NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `enterprise_id` (`enterprise_id`),
  KEY `creditor_id` (`creditor_id`),
  KEY `purchaser_id` (`purchaser_id`),
  CONSTRAINT FOREIGN KEY (`enterprise_id`) REFERENCES `enterprise` (`id`),
  CONSTRAINT FOREIGN KEY (`creditor_id`) REFERENCES `creditor` (`id`),
  CONSTRAINT FOREIGN KEY (`purchaser_id`) REFERENCES `user` (`id`)
) ENGINE=InnoDB;

--
-- Table structure for table `kpk`.`inv_detail`
--
DROP TABLE IF EXISTS `inv_detail`;
CREATE TABLE `inv_detail` (
  `id`              int unsigned NOT NULL,
  `inv_id`          int unsigned NOT NULL,
  `serial_number`   text,
  `lot_number`      text,
  `delivery_date`   date,
  `po_id`           int unsigned not null,
  `expiration_date` date,
  PRIMARY KEY (`id`),
  KEY `inv_id` (`inv_id`),
  KEY `po_id` (`po_id`),
  constraint foreign key (`inv_id`) references `inventory` (`id`),
  constraint foreign key (`po_id`) references `purchase` (`id`)
) ENGINE=InnoDB;

--
-- Table structure for table `kpk`.`purchase_item`
--
DROP TABLE IF EXISTS `purchase_item`;
CREATE TABLE `purchase_item` (
  `purchase_id`   int unsigned NOT NULL,
  `id`            int unsigned NOT NULL AUTO_INCREMENT,
  `inventory_id`  int unsigned NOT NULL,
  `quantity`      int unsigned DEFAULT '0',
  `unit_price`    decimal(10,2) unsigned NOT NULL,
  `total`         decimal(10,2) unsigned,
  PRIMARY KEY (`id`),
  KEY `purchase_id` (`purchase_id`),
  KEY `inventory_id` (`inventory_id`),
  CONSTRAINT FOREIGN KEY (`purchase_id`) REFERENCES `purchase` (`id`) ON DELETE CASCADE,
  CONSTRAINT FOREIGN KEY (`inventory_id`) REFERENCES `inventory` (`id`)
) ENGINE=InnoDB;

--
-- Table structure for table `kpk`.`transaction_type`
--
DROP TABLE IF EXISTS `transaction_type`;
CREATE TABLE `transaction_type` (
  `id`            tinyint unsigned NOT NULL AUTO_INCREMENT,
  `service_txt`   varchar(45) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB;

--
-- Dumping data for table `kpk`.`transaction_type`
--
LOCK TABLES `transaction_type` WRITE;
INSERT INTO `transaction_type` VALUES 
  (1,'cash'),
	(2,'sale'),
	(3,'purchase');
UNLOCK TABLES;

--
-- table `kpk`.`account_group`
--
-- TODO: when we can discuss this as a group
-- drop table if exists `account_group`;
-- create table `account_group` (
--   `id`              int not null auto_increment,
--   `account_id`      int not null,
--   `enterprise_id`   smallint not null,
--   primary key (`id`),
--   key (`account_id`),
--   key (`enterprise_id`),
--   constraint foreign key (`account_id`) references `account` (`id`),
--   constraint foreign key (`enterprise_id`) references `enterprise` (`id`)
-- ) engine=innodb;

--
-- Table structure for table `kpk`.`cash`
--
DROP TABLE IF EXISTS `cash`;
CREATE TABLE `cash` (
  `id`              int unsigned NOT NULL,
  `enterprise_id`   smallint null,
  `bon`             char(1) NOT NULL,
  `bon_num`         int unsigned NOT NULL,
  `invoice_id`      int unsigned NOT NULL,
  `date`            date NOT NULL,
  `debit_account`   int unsigned NOT NULL,
  `credit_account`  int unsigned NOT NULL,
  `currency_id`     tinyint unsigned NOT NULL,
  `cashier_id`      smallint unsigned NOT NULL,
  `cashbox_id`      smallint unsigned NOT NULL,
  `text`            text,
  PRIMARY KEY (`id`),
  KEY `currency_id` (`currency_id`),
  KEY `cashier_id` (`cashier_id`),
  KEY `debit_account` (`debit_account`),
  KEY `credit_account` (`credit_account`),
  KEY `invoice_id` (`invoice_id`),
  CONSTRAINT FOREIGN KEY (`currency_id`) REFERENCES `currency` (`id`),
  CONSTRAINT FOREIGN KEY (`cashier_id`) REFERENCES `user` (`id`),
  CONSTRAINT FOREIGN KEY (`debit_account`) REFERENCES `account` (`id`),
  CONSTRAINT FOREIGN KEY (`credit_account`) REFERENCES `account` (`id`),
  CONSTRAINT FOREIGN KEY (`invoice_id`) REFERENCES `sale` (`id`)
) ENGINE=InnoDB;

--
-- table `kpk`.`cash_item`
--
DROP TABLE IF EXISTS `cash_item`;
CREATE TABLE `cash_item` (
  `id`              int unsigned not null,
  `cash_id`         int unsigned not null,
  `cost`            decimal(19,2) unsigned not null default 0.00,
  `invoice_id`      int unsigned not null,
  primary key (`id`),
  key `cash_id` (`cash_id`),
  constraint foreign key (`cash_id`) references `cash` (`id`)
) ENGINE=InnoDB;

--
-- Table structure for table `kpk`.`posting_journal`
--
DROP TABLE IF EXISTS `posting_journal`;
CREATE TABLE `posting_journal` (
  `id`                mediumint unsigned NOT NULL AUTO_INCREMENT,
  `enterprise_id`     smallint unsigned NOT NULL,
  `fiscal_year_id`    mediumint unsigned, -- not null,
  `period_id`         mediumint unsigned, -- not null,
  `trans_id`          int unsigned NOT NULL,
  `trans_date`        date NOT NULL,
  `doc_num`           int unsigned, -- what does this do? -- why would this be NOT NULL if we don't know what it does?
  `description`       text,
  `account_id`        int unsigned not null,
  `debit`             int unsigned,
  `credit`            int unsigned,
  `debit_equiv`       int unsigned,
  `credit_equiv`      int unsigned,
  `currency_id`       tinyint unsigned NOT NULL,
  `deb_cred_id`       varchar(45), -- debitor or creditor id 
  `deb_cred_type`     char(1), -- 'D' or 'C' if debcred_id references a debitor or creditor, respectively
  `inv_po_id`         varchar(45),
  `comment`           text,
  `cost_ctrl_id`      varchar(10),
  `origin_id`         tinyint unsigned NOT NULL,
  `user_id`           smallint unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `enterprise_id` (`enterprise_id`),
  KEY `fiscal_year_id` (`fiscal_year_id`),
  KEY `period_id` (`period_id`),
  KEY `origin_id` (`origin_id`),
  KEY `currency_id` (`currency_id`),
  KEY `user_id` (`user_id`),
  constraint foreign key (`fiscal_year_id`) references `fiscal_year` (`id`),
  constraint foreign key (`period_id`) references `period` (`id`),
  CONSTRAINT FOREIGN KEY (`origin_id`) REFERENCES `transaction_type` (`id`) ON UPDATE CASCADE,
  CONSTRAINT FOREIGN KEY (`enterprise_id`) REFERENCES `enterprise` (`id`) ON UPDATE CASCADE,
  CONSTRAINT FOREIGN KEY (`currency_id`) REFERENCES `currency` (`id`) ON UPDATE CASCADE,
  CONSTRAINT FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB;

--
-- table `kpk`.`general_ledger`
--
drop table if exists `kpk`.`general_ledger`;
create table `kpk`.`general_ledger` (
  `id`                mediumint unsigned NOT NULL AUTO_INCREMENT,
  `enterprise_id`     smallint unsigned NOT NULL,
  `fiscal_year_id`    mediumint unsigned not null,
  `period_id`         mediumint unsigned not null,
  `trans_id`          int unsigned NOT NULL,
  `trans_date`        date NOT NULL,
  `doc_num`           int unsigned NOT NULL, -- what does this do?
  `description`       text,
  `account_id`        int unsigned not null,
  `debit`             int unsigned,
  `credit`            int unsigned,
  `debit_equiv`       int unsigned,
  `credit_equiv`      int unsigned,
  `currency_id`       tinyint unsigned NOT NULL,
  `deb_cred_id`       varchar(45), -- debitor or creditor id 
  `deb_cred_type`     char(1), -- 'D' or 'C' if debcred_id references a debitor or creditor, respectively
  `inv_po_id`         varchar(45),
  `comment`           text,
  `cost_ctrl_id`      varchar(10),
  `origin_id`         tinyint unsigned NOT NULL,
  `user_id`           smallint unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `enterprise_id` (`enterprise_id`),
  KEY `fiscal_year_id` (`fiscal_year_id`),
  KEY `period_id` (`period_id`),
  KEY `origin_id` (`origin_id`),
  KEY `currency_id` (`currency_id`),
  KEY `user_id` (`user_id`),
  constraint foreign key (`fiscal_year_id`) references `fiscal_year` (`id`),
  constraint foreign key (`period_id`) references `period` (`id`),
  CONSTRAINT FOREIGN KEY (`origin_id`) REFERENCES `transaction_type` (`id`) ON UPDATE CASCADE,
  CONSTRAINT FOREIGN KEY (`enterprise_id`) REFERENCES `enterprise` (`id`) ON UPDATE CASCADE,
  CONSTRAINT FOREIGN KEY (`currency_id`) REFERENCES `currency` (`id`) ON UPDATE CASCADE,
  CONSTRAINT FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB;

--
-- table `kpk`.`period_total`
--
drop table if exists `kpk`.`period_total`;
create table `kpk`.`period_total` (
  `enterprise_id`     smallint unsigned not null,
  `id`                mediumint unsigned not null,
  `fiscal_year_id`    mediumint unsigned not null,
  `period_id`         mediumint unsigned not null,
  `account_id`        int unsigned not null,
  `credit`            decimal(19, 2) unsigned,
  `debit`             decimal(19, 2) unsigned,
  `difference`        decimal(19, 2) unsigned, 
  `locked`            boolean not null default 0,
  primary key (`id`),
  key `fiscal_year_id` (`fiscal_year_id`),
  key `account_id` (`account_id`),
  key `enterprise_id` (`enterprise_id`),
  key `period_id` (`period_id`),
  constraint foreign key (`fiscal_year_id`) references `fiscal_year` (`id`),
  constraint foreign key (`account_id`) references `account` (`id`),
  constraint foreign key (`enterprise_id`) references `enterprise` (`id`),
  constraint foreign key (`period_id`) references `period` (`id`)
) engine=innodb;

--
-- table `kpk`.`price_list_name`
--
drop table if exists `kpk`.`price_list_name`;
create table `kpk`.`price_list_name` (
  enterprise_id   smallint unsigned not null,
  id              smallint  unsigned not null,
  name            varchar(100) not null,
  primary key (`id`),
  key `enterprise_id` (`enterprise_id`),
  constraint foreign key (`enterprise_id`) references `enterprise` (`id`)
) engine=innodb;

--
-- table `kpk`.`price_list`
--
drop table if exists `kpk`.`price_list`;
create table `kpk`.`price_list` (
  id              int unsigned not null,
  list_id         smallint unsigned not null,
  inventory_id    int unsigned not null,
  price           decimal(19, 2) unsigned not null default 0,
  discount        decimal(3, 2) unsigned not null default 0,
  note            text, 
  primary key (`id`),
  key `inventory_id` (`inventory_id`),
  key `list_id` (`list_id`),
  constraint foreign key (`inventory_id`) references `inventory` (`id`),
  constraint foreign key (`list_id`) references `price_list_name` (`id`)
) engine=innodb;

-- Jon's dump @ 12:45.
