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

-- System admin 
INSERT INTO `user` values
  (1,'admin','1','System','Administrato','kpkdeveloper@gmail.com',0);

-- Subscribed units
INSERT INTO `unit` VALUES
  (0 , 'Root'                       , 'TREE.ROOT', 'The unseen root node'                       , NULL, 1 , '/partials/index.html'                    , '/root'),
	(1 , 'Admin'                      , 'TREE.ADMIN', 'The Administration Super-Category'          , 0   , 1 , '/partials/admin/index.html'              , '/admin'),
	(2 , 'Enterprise'                 , 'TREE.ENTERPRISE', 'Manage the registered enterprises from here', 1   , 0 , '/partials/enterprise/'                   , '/enterprise'),
	(4 , 'Users & Permissions'        , 'TREE.PERMISSION', 'Manage user privileges and permissions'     , 1   , 0 , '/partials/user_permission/'                   , '/permission'),
	(5 , 'Finance'                    , 'TREE.FINANCE', 'The Finance Super-Category'                 , 0   , 1 , '/partials/finance/'                      , '/finance'),
	(6 , 'Account'                    , 'TREE.ACCOUNT', 'Chart of Accounts management'               , 1   , 0 , '/partials/accounts/create_account/'      , '/create_account'),
	(8 , 'Budgeting'                  , 'TREE.BUDGETING', 'Plan your next move'                        , 0   , 10, '/partials/budget/index.html'             , '/budget'),
	(9 , 'Posting Journal'            , 'TREE.POSTING_JOURNAL', 'Daily Log'                                  , 5   , 0 , '/partials/journal/'                      , '/posting_journal'),
	(10, 'Reports'                    , 'TREE.REPORTS', 'Do stuff and tell people about it'          , 0   , 1 , '/partials/reports/summary/'              , 'reports/summary'),
	(11, 'Inventory'                  , 'TREE.INVENTORY', 'The Inventory Super-Category'               , 0   , 1 , '/partials/inventory/index.html'          , '/inventory'),
	(21, 'Hospital'                   , 'TREE.HOSPITAL', 'The Hospital Super-Category'                , 0   , 1 , '/partials/hospital/index.html'           , '/hospital'),
	(30, 'Fiscal Year'                , 'TREE.FISCAL_YEAR', 'Fiscal year configuration page'             , 1   , 0 , '/partials/fiscal/'                       , '/fiscal'),
	(31, 'Patient Registration'       , 'TREE.PATIENT_REG', 'Register patients'                          , 21  , 0 , '/partials/patient_registration/'         , '/patient'),
	(33, 'Patient Records'            , 'TREE.PATIENT_RECORDS', 'Search for patient'                         , 21  , 0 , '/partials/records/patient_records/'              , '/patient_records/'),
	(34, 'Sales'                      , 'TREE.SALES', 'Create an invoice for a sale'               , 5   , 0 , '/partials/sales/'                        , '/sales/'),
	(35, 'Sale Records'               , 'TREE.SALE_RECORDS', 'Search for a sale'                          , 5   , 0 , '/partials/records/sales_records/'        , '/sale_records/'),
	(36, 'Purchase Order'             , 'TREE.PURCHASE_ORDER', 'Create a new Purchase Order'                , 11  , 0 , '/partials/purchase_order/'               , '/inventory/purchase'),
	(37, 'Budget by Account'          , 'TREE.BUDGET_BY_ACCOUNT', 'Budgeting by account'                       , 8   , 0 , '/partials/budget/'                       , '/budgeting/')   ,
	(38, 'Cash Box'                   , 'TREE.CASH', 'Pay invoices'                               , 5   , 0 , '/partials/cash/'                         , '/cash'),
	(39, 'Register Stock'             , 'TREE.REGISTER_STOCK', ''                                           , 11  , 0 , '/partials/inventory/register/'           , '/inventory/register'),
	(40, 'Register Supplier'          , 'TREE.REGISTER_SUPPLIER', ''                                           , 11  , 0 , '/partials/inventory/creditor/'          , '/creditor'),
	(41, 'Purchase Order Records'     , 'TREE.PURCHASE_ORDER_RECORDS', ''                                           , 5   , 0 , '/partials/records/purchase_order_records', '/purchase_records/'),
  (43, 'Finance'                    , 'TREE.REPORT_FINANCE', ''                                           , 10  , 0 , '/partials/reports/finance/'              , '/reports/finance'),
  (45, 'Price List'                 , 'TREE.PRICE_LIST', 'Configure price lists!'                     , 1  , 0 , '/partials/price_list/'                   , '/inventory/price_list'),
  (46, 'Exchange Rate'              , 'TREE.EXCHANGE', 'Set todays exchange rate!'                  , 1   , 0 , '/partials/exchange_rate/'                , '/exchange_rate'),
  (47, 'Transaction Report'         , 'TREE.REPORT_TRANSACTION', ''                                           , 10  , 0 , '/partials/reports/transaction_report/'   , '/reports/transaction_report'),
  (48, 'Creditor Groups'            , 'TREE.CREDITOR_GRP', ''                                           , 1   , 0 , '/partials/creditor/group/'               , '/creditors/creditor_group'),
  (49, 'Debitor Groups'             , 'TREE.DEBTOR_GRP', ''                                           , 1   , 0 , '/partials/debitor/'                      , '/debitor/debitor_group'),
  (50, 'Inventory View'             , 'TREE.INVENTORY_VIEW', ''                                           , 11  , 0 , '/partials/inventory/view/'               , '/inventory/view'),
  (51, 'General Ledger'             , 'TREE.GENERAL_LEDGER', ''                                           , 10  , 0 , '/partials/reports/ledger/'               , '/reports/ledger/general_ledger'),
  (52, 'Location Manager'           , 'TREE.LOCATION', ''                                           , 1   , 0 , '/partials/location/location.html'        , '/location'),
  (54, 'Chart of Accounts'          , 'TREE.CHART_OF_ACCOUNTS', ''                                           , 10  , 0 , '/partials/reports/chart_of_accounts/'      , '/reports/chart_of_accounts/'),
  (55, 'Debitor Aging'              , 'TREE.DEBTOR_AGING', ''                                           , 10  , 0 , '/partials/reports/debitor_aging/'        , '/reports/debitor_aging/'),
  (56, 'Account Statement By Period', 'TREE.ACCOUNT_STATEMENT', ''                                           , 10  , 0 , '/partials/reports/account_statement/'    , '/reports/account_statement/'),
  (57, 'Income Expensive Balance'   , 'TREE.INCOME_EXPENSE', ''                                           , 10  , 0 , '/partials/reports/income_expensive/'     , '/reports/income_expensive/'),
  (58, 'Credit Note'                , 'TREE.CREDIT_NOTE', ''                                           , 5   , 0 , '/partials/credit_note/'                  , '/credit_note/'),
  (60, 'Patient Group Assignment'    , 'TREE.PATIENT_GRP_ASSIGNMENT', ''                                           , 21  , 0 , '/partials/patient_group_assignment/'     , '/patient_group_assignment/'),
  (61, 'Patient Group'              , 'TREE.PATIENT_GRP', ''                                           , 1   , 0 , '/partials/patient_group/'                , '/patient_group/'),
  (62, 'Accounting'                 , 'TREE.ACCOUNTING', ''                                           , 0   , 1 , '/partials/accounting/index.html'         , '/accounting/'),
  (63, 'Cost Center Management'     , 'TREE.COST_CENTER_MGMT', ''                                           , 62  , 0 , '/partials/cost_center/'                  , '/cost_center/'),
  (64, 'Group Invoicing'            , 'TREE.GRP_INVOICING', ''                                           , 5   , 0 , '/partials/group_invoice/'                , '/group_invoice/'),
  (65, 'Currency'                   , 'TREE.CURRENCY', ''                                           , 1   , 0 , '/partials/currency/'                     , '/currency'),
  (66, 'Patient Renewal'            , 'TREE.RENEWAL', ''                                            , 21, 0, '/partials/patient_renewal/', '/renewal'),
  (67, 'Patient Registrations'      , 'TREE.PATIENT_REGISTRATION', '',                                 10, 0, '/partials/reports/patient_registrations/', '/reports/patient_registrations'),
  (68, 'Update Stock'               , 'TREE.UPDATE_STOCK', '',                                      11, 0, '/partials/update_stock/', '/update_stock/'),
  (69, 'Change Patient Group'       , 'TREE.SWAP_DEBITOR', '',                                      21, 0, '/partials/swap_debitor/', '/swap_debitor/'),
  (70, 'Cash Payments'              , 'TREE.CASH_PAYMENTS', '',                                     10, 0, '/partials/reports/cash_payments/', '/reports/cash_payments');

-- Expose Users and Permissions
INSERT INTO `permission` (`id_user`, `id_unit`) values
  (1, 0),
  (1, 1),
  (1, 4);

-- Configure locations
INSERT INTO `country` values
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

INSERT INTO `province` (`id`,`name`, `country_id`) VALUES
  (1, 'Bas Congo', 52),
  (2, 'Bandundu', 52),
  (3, 'Kasai Oriental', 52),
  (4, 'Katanga', 52),
  (5, 'Equateur', 52),
  (6, 'Kasai Occidental', 52),
  (7, 'Kinshasa', 52),
  (8, 'Nord Kivu', 52),
  (9, 'Sud Kivu', 52),
  (10, 'Province Oriental', 52),
  (11, 'Maniema', 52);

-- System transactions (TODO seperate from Tshikaji?)
INSERT INTO `transaction_type` values 
  (1, 'cash'),
	(2, 'sale'),
	(3, 'purchase'),
  (4, 'journal'),
  (5, 'group_invoice'),
  (6, 'credit_note');

  -- Configure base currencies
INSERT INTO `currency` (`id`, `name`, `symbol`, `separator`, `decimal`, `min_monentary_unit`) values
  (1,'Congolese Francs','Fc', '.', ',', 50),
	(2,'United States Dollars','$', ',', '.', 0.01);


INSERT INTO `sector` VALUES 
(1,'Aketi',1),(2,'Ango',1),(3,'Aru',1),(4,'Bafwasende',1),(5,'Bagata',1),(6,'Bagira',1),(7,'Bambesa',1),(8,'Banalia',1),(9,'Bandalungwa',1),(11,'Barumbu',1),(12,'Basankusu',1),(13,'Basoko',1),(14,'Befale',1),(15,'Beni',1),(16,'Bikoro',1),(17,'Bipemba',1),(18,'Boende',1),(19,'Bokungu',1),(20,'Bolobo',1),(21,'Bolomba',1),(22,'Bomongo',1),(23,'Bongandanga',1),(24,'Bondo',1),(25,'Boso-Bolo',1),(26,'Budjala',1),(27,'Bukama',1),(28,'Bukavu',1),(29,'Bulungu',1),(30,'Bumba',1),(31,'Bumbu',1),(32,'Businga',1),(33,'Buta',1),(34,'Dekese',1),(35,'Demba',1),(36,'Dibaya',1),(37,'Dibindi',1),(38,'Dilolo',1),(39,'Dimbelenge',1),(40,'Disasi',1),(41,'Diulu',1),(42,'Djolu',1),(43,'Djugu',1),(44,'Dungu',1),(45,'Feshi',1),(46,'Fizi',1),(47,'Gbadolite',1),(48,'Gemena',1),(49,'Goma',1),(50,'Gombe',1),(51,'Gungu',1),(52,'Ibanda',1),(53,'Idiofa',1),(54,'Idjwi',1),(55,'Ikela',1),(56,'Ilebo',1),(57,'Ingende',1),(58,'Inongo',1),(59,'Irumu',1),(60,'Isangi-Yanonge',1),(61,'Kabalo',1),(62,'Kabambare',1),(63,'Kabare',1),(64,'Kabeya-Kamwanga',1),(65,'Kabinda',1),(66,'Kabondo',1),(67,'Kabongo',1),(68,'Kadutu',1),(69,'Kahemba',1),(70,'Kalamu',1),(71,'Kalehe',1),(72,'Kalemie',1),(73,'Kamboye',1),(74,'Kamiji',1),(75,'Kamina',1),(76,'Kananga',6),(77,'Kaniama',1),(78,'Kanshi',1),(79,'Kasa-Vubu',1),(80,'Kasangulu',1),(81,'Kasenga',1),(82,'Kasongo',1),(83,'Kasongo Lunda',1),(84,'Katako-Kombe',1),(85,'Katanda',1),(86,'Katoka',1),(87,'Kazamba',1),(88,'Kazumba',1),(89,'Kenge',1),(90,'Kimbaseke',1),(91,'Kimvula',1),(92,'Kindu',1),(93,'Kindu.Kailo',1),(94,'Kinshasa',1),(95,'Kipushi',1),(96,'Kiri',1),(97,'Kisangani',1),(98,'Kisenso',1),(99,'Kitambo',1),(100,'Kole',1),(101,'Kongolo',1),(102,'Kungu',1),(103,'Kutu',1),(104,'Kwamouth',1),(105,'Lemba',1),(106,'Libao',1),(107,'Libenge',1),(108,'Likasi',1),(109,'Limete',1),(110,'Lingwala',1),(111,'Lisala',1),(112,'Lodja',1),(113,'Lomela',1),(114,'Lubefu',1),(115,'Lubero',1),(116,'Lubudi',1),(117,'Lubumbashi',1),(118,'Luebo',1),(119,'Luiza',1),(120,'Lukemi',1),(121,'Lukolela',1),(122,'Lukonga',1),(123,'Lukula',1),(124,'Luozi',1),(125,'Lupatapata',1),(126,'Lusambo',1),(127,'Madimba',1),(128,'Mahagi',1),(129,'Makala',1),(130,'Malemba-Nkulu',1),(131,'Maluku',1),(132,'Mambasa',1),(133,'Mankanza',1),(134,'Manono',1),(135,'Masi-Manimba',1),(136,'Masina',1),(137,'Masisi',1),(138,'Matadi',1),(139,'Matete',1),(140,'Mayoyo',1),(141,'Mbadaka',1),(142,'Mbanza-Ngungu',1),(143,'Miabi',1),(144,'Mitwaba',1),(145,'Moanda',1),(146,'Moba',1),(147,'Mobayi-Mbongo',1),(148,'Monkoto',1),(149,'Mont-Ngafula',1),(150,'Musadi',1),(151,'Mushie',1),(152,'Mutshatsha',1),(153,'Muya',1),(154,'Mvuzi',1),(155,'Mweka',1),(156,'Mwene-Ditu',1),(157,'Mwenga',1),(158,'Ndesha',1),(159,'Ndjili',1),(160,'Ngaba',1),(161,'Ngaliema',1),(162,'Ngandajika',1),(163,'Nganza',1),(164,'Ngiri-Ngiri',1),(165,'Niangara',1),(166,'Nsele',1),(167,'Nyunzu',1),(168,'Nzadi',1),(169,'Nzanza',1),(170,'Nzinda',1),(171,'Opala',1),(172,'Oshwe',1),(173,'Pangi',1),(174,'Poko',1),(175,'Popokabaka',1),(176,'Punia',1),(177,'Pweto',1),(178,'Rungu',1),(179,'Rutshuru',1),(180,'Sakania',1),(181,'Sandoa',1),(182,'Seke-Banza',1),(183,'Selembao',1),(184,'Shabunda',1),(185,'Songololo',1),(186,'Tshela',1),(187,'Tshikapa',1),(188,'Tshilenge',1),(189,'Ubundu',1),(190,'Uvira',1),(191,'Walikale',1),(192,'Walungu',1),(193,'Wamba',1),(194,'Wangata',1),(195,'Watsa',1),(196,'Yahuma',1),(197,'Yakoma',1),(198,'Yumbi',1),(199,'Zongo',1),(200,'Nkoko',6),(201,'Nganza',6),(202,'Dibaya',6),(203,'NDESHA',6),(204,'LUKONGA',6),(205,'KATOKA',6),(206,'KAZUMBA',6);
INSERT INTO `village` VALUES 
(1,'Vanga',2),(2,'Bulungu',2),(3,'Songo',1),(4,'Lusekele',1),(5,'Tshikaji',76),(6,'Kananga',76),(7,'Tshikapa',187),(8,'kamenga',158),(9,'kasangidi',76),(10,'nganza',200),(11,'kabundi',163),(12,'kabanza',76),(13,'quartie  hopital',76),(14,'biancky',76),(15,'mutanda',163),(16,'LUEBOCITE',118),(17,'TSHIBANDABANDA',158),(18,'NSELE',163),(19,'DIBANDISHA',202),(20,'NKONKO TSHIELA',201),(21,'MPOKOLO',76),(22,'NTAMBUE SAINT B',201),(23,'CAMP BOBOZO',201),(24,'DEMBA',76),(25,'AZDA TSHINSAMBI',76),(26,'epro',205),(27,'Appolo',76),(28,'Appolo',76),(29,'telecom',201),(30,'kalumentumba',201),(31,'MALANDI',76),(32,'BIANCKY',76),(33,'BIANCKY',76),(34,'MATAMBA',206),(35,'LUIZA',206),(36,'BIANCKY',76),(37,'BIANCKY',76),(38,'route kanyuka',76),(39,'LUBI AMPATA',201),(40,'CAMP  SNCC',76),(41,'TSHITUNTA',201),(42,'KOLE',206),(43,'KAMAYI',76),(44,'BINCKY',76),(45,'KELE KELE',205),(46,'DIBANDA',202),(47,'PLATEAU',76),(48,'NGANZA NORD',201),(49,'LUBUWA',203),(50,'BUMBA',201),(51,'KELEKELE',205),(52,'NGANZA  SUD',201),(53,'katoka epro',205),(54,'BUNKONDE',76),(55,'NKONKO',201),(56,'CAMP  BOBOZO',201),(57,'SNELi',76),(58,'DIBAYA',76);


-- Configure enterprise
INSERT INTO `enterprise` (`id`, `name`, `abbr`, `phone`, `email`, `location_id`, `logo`, `currency_id`) values 
  (200, 'Hopital Bon Berger', 'GSH', '0825924377', 'cmk@tshikaji.cd', 5, '/assets/logos/tsh.jpg', 2);

INSERT INTO `fiscal_year` VALUES 
(200,1,11,'Tshikaji 2014',NULL,NULL,NULL,1,2014,NULL,0);
INSERT INTO `period` VALUES
(1,1,0,'2014-01-01','2014-01-01',0),(2,1,1,'2014-01-01','2014-01-31',0),(3,1,11,'2014-02-01','2014-02-28',0),(4,1,21,'2014-03-01','2014-03-31',0),(5,1,31,'2014-04-01','2014-04-30',0),(6,1,41,'2014-05-01','2014-05-31',0),(7,1,51,'2014-06-01','2014-06-30',0),(8,1,61,'2014-07-01','2014-07-31',0),(9,1,71,'2014-08-01','2014-08-31',0),(10,1,81,'2014-09-01','2014-09-30',0),(11,1,91,'2014-10-01','2014-10-31',0),(12,1,101,'2014-11-01','2014-11-30',0),(13,1,111,'2014-12-01','2014-12-31',0);

-- Configure base chart of accounts
INSERT INTO `account_type` values
  (1,'income/expense'),
  (2,'balance'),
  (3,'title');

-- Configure base inventory
INSERT INTO `inventory_unit` (`text`) values
  ('Act'), 
  ('Pallet'), 
  ('Pill'), 
  ('Box'), 
  ('Lot');

INSERT INTO `inventory_type` values
  (0,'Article'),
  (1,'Assembly'),
  (2,'Service'),
  (3,'Discount');
