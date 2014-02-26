Warning: Using a password on the command line interface can be insecure.
-- MySQL dump 10.13  Distrib 5.6.13, for Win32 (x86)
--
-- Host: localhost    Database: kpk
-- ------------------------------------------------------
-- Server version	5.6.12

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `account`
--

DROP TABLE IF EXISTS `account`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `account` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `account_type_id` mediumint(8) unsigned NOT NULL,
  `enterprise_id` smallint(5) unsigned NOT NULL,
  `account_number` int(11) NOT NULL,
  `account_txt` text,
  `parent` int(10) unsigned NOT NULL,
  `fixed` tinyint(1) DEFAULT '0',
  `locked` tinyint(3) unsigned DEFAULT '0',
  `cc_id` smallint(6) DEFAULT '-1',
  PRIMARY KEY (`id`),
  KEY `account_type_id` (`account_type_id`),
  KEY `enterprise_id` (`enterprise_id`),
  CONSTRAINT `account_ibfk_1` FOREIGN KEY (`account_type_id`) REFERENCES `account_type` (`id`),
  CONSTRAINT `account_ibfk_2` FOREIGN KEY (`enterprise_id`) REFERENCES `enterprise` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=354 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `account`
--

LOCK TABLES `account` WRITE;
/*!40000 ALTER TABLE `account` DISABLE KEYS */;
INSERT INTO `account` VALUES (1,3,200,10,'CAPITAL',0,1,0,-1),(2,2,200,100,'Fonds social',10,1,0,-1),(3,3,200,101,'Fonds de dotation',10,1,0,-1),(4,2,200,1010,'Dotation de base',101,1,0,-1),(5,2,200,1013,'Affectations',101,1,0,-1),(6,2,200,1015,'Dons et legs',101,1,0,-1),(7,2,200,1016,'Autres dotations',101,1,0,-1),(8,3,200,11,'RESERVES',0,1,0,-1),(9,2,200,110,'Réserves légales',11,1,0,-1),(10,2,200,111,'Réserves statutaires',11,1,0,-1),(11,2,200,112,'Réserves réglementaires',11,1,0,-1),(12,3,200,12,'REPORT A NOUVEAU',0,1,0,-1),(13,2,200,120,'Bénéfices reportés',12,1,0,-1),(14,2,200,121,'Pertes non compensées',12,1,0,-1),(15,3,200,13,'RESULTAT NET',0,1,0,-1),(16,2,200,130,'Bénéfice net de l’exercice',13,1,0,-1),(17,2,200,131,'Bénéfice à conserver',13,1,0,-1),(18,2,200,133,'Perte nette de l’exercice',13,1,0,-1),(19,3,200,14,'PLUS-VALUES ET PROVISIONS REGLEMENTEES',0,1,0,-1),(20,2,200,140,'Plus-values de réévaluation',14,1,0,-1),(21,2,200,146,'Provisions réglementées',14,1,0,-1),(22,3,200,15,'SUBVENTIONS D’EQUIPEMENT',0,1,0,-1),(23,2,200,150,'Subventions d’Etat',15,1,0,-1),(24,2,200,152,'Subventions d’entreprises publiques',15,1,0,-1),(25,2,200,153,'Subventions d’entreprises et organismes privés',15,1,0,-1),(26,2,200,158,'Subventions d’équipements amortis',15,1,0,-1),(27,3,200,16,'EMPRUNTS ET DETTES A LONG TERME',0,1,0,-1),(28,2,200,160,'Emprunts garantis à long terme',16,1,0,-1),(29,2,200,161,'Emprunts et dettes à long terme émis par des Organismes collectifs',16,1,0,-1),(30,2,200,162,'Emprunts et dettes à long terme auprès des entreprises apparentées',16,1,0,-1),(31,2,200,165,'Avances reçues et comptes bloqués à long terme',16,1,0,-1),(32,3,200,17,'EMPRUNTS ET DETTES A MOYEN TERME',0,1,0,-1),(33,2,200,170,'Emprunts garantis à moyen terme',17,1,0,-1),(34,2,200,171,'Emprunts et dettes à moyen terme émis par des organismes collectifs',17,1,0,-1),(35,2,200,174,'Fournisseurs à moyen terme',17,1,0,-1),(36,2,200,175,'Avances reçues et comptes bloqués à moyen terme',17,1,0,-1),(37,3,200,18,'PROVISIONS POUR CHARGES ET PERTES',0,1,0,-1),(38,3,200,180,'Provisions pour risques',18,1,0,-1),(39,2,200,1800,'Provisions pour litiges en cours',180,1,0,-1),(40,2,200,1806,'Provisions pour risques divers',180,1,0,-1),(41,2,200,182,'Provisions pour renouvellement des immobilisations',18,1,0,-1),(42,3,200,19,'19. COMPTES DE LIAISONS DES ETABLISSEMENTS',0,1,0,-1),(43,2,200,190,'Comptes de liaison avec l’Administration centrale',19,1,0,-1),(44,2,200,191,'Comptes de liaison entre Etablissements',19,1,0,-1),(45,2,200,192,'Comptes de liaison entre Succursales (BCZS)',19,1,0,-1),(46,3,200,20,'20. IMMOBILISATIONS INCORPORELLES',0,1,0,-1),(47,2,200,200,'Concessions sur terrains',20,1,0,-1),(48,2,200,204,'Brevets, Licences, Marques, Procédés, Modèles, Dessins',20,1,0,-1),(49,3,200,21,'21. TERRAINS',0,1,0,-1),(50,2,200,210,'Terrains de construction et chantiers',21,1,0,-1),(51,2,200,216,'Autres terrains',21,1,0,-1),(52,3,200,22,'22. AUTRES IMMOBILISATIONS CORPORELLES',0,1,0,-1),(53,3,200,221,'Immeubles non résidentiels',22,1,0,-1),(54,2,200,2212,'Bâtiments administratifs',221,1,0,-1),(55,2,200,2214,'Bâtiments sociaux',221,1,0,-1),(56,2,200,2216,'Ouvrages d’infrastructure',221,1,0,-1),(57,3,200,223,'Autres constructions',22,1,0,-1),(58,2,200,2231,'Logements des Directeurs',223,1,0,-1),(59,2,200,2232,'Logements des Cadres',223,1,0,-1),(60,2,200,2233,'Logements des Ouvriers',223,1,0,-1),(61,3,200,225,'Matériel de transport',22,1,0,-1),(62,3,200,2251,'Matériel routier',225,1,0,-1),(63,2,200,22511,'Matériel automobile et assimilé',2251,1,0,-1),(64,2,200,22512,'Autres matériels',2251,1,0,-1),(65,2,200,2253,'Matériel naval et fluvial',225,1,0,-1),(66,2,200,2254,'Matériel aéronautique',225,1,0,-1),(67,3,200,226,'Machines et autres biens d’équipement',22,1,0,-1),(68,2,200,2263,'Matériel et mobilier de bureau',226,1,0,-1),(69,3,200,23,'23. AUTRES IMMOBILISATIONS CORPORELLES EN COURS',0,1,0,-1),(70,2,200,231,'Immeubles non résidentiels en cours',23,1,0,-1),(71,2,200,233,'Autres constructions en cours',23,1,0,-1),(72,3,200,25,'25. TITRES ET VALEURS ENGAGES A PLUS D’UN AN',0,1,0,-1),(73,2,200,255,'Parts dans des associations, syndicats et organismes divers',25,1,0,-1),(74,3,200,256,'Parts dans des sociétés de personnes',25,1,0,-1),(75,2,200,2563,'Parts dans des sociétés privées à responsabilité limitée',256,1,0,-1),(76,3,200,26,'26. PRETS ET AUTRES CREANCES A LONG TERME',0,1,0,-1),(77,2,200,260,'Prêts à long terme',26,1,0,-1),(78,2,200,265,'Comptes bancaires bloqués à long terme',26,1,0,-1),(79,3,200,27,'27. PRETS ET AUTRES CREANCES A MOYEN TERME',0,1,0,-1),(80,2,200,270,'Prêts à moyen terme',27,1,0,-1),(81,2,200,273,'Prêts à des entreprises apparentées à moyen terme',27,1,0,-1),(82,3,200,28,'28. AMORTISSEMENT ET PROVISIONS POUR DEPRECIATION DES COMPTES DE LA CLASSE II',0,1,0,-1),(83,2,200,280,'Amortissements des valeurs incorporelles immobilisées',28,1,0,-1),(84,2,200,281,'Amortissements des immobilisations incorporelles',28,1,0,-1),(85,2,200,282,'Provisions pour dépréciation des immobilisations incorporelles',28,1,0,-1),(86,2,200,283,'Provisions pour dépréciation des terrains',28,1,0,-1),(87,2,200,284,'Provisions pour dépréciation des autres immobilisations corporelles',28,1,0,-1),(88,2,200,285,'Provisions pour dépréciation des titres et valeurs engagés à plus d’un an',28,1,0,-1),(89,2,200,286,'Provisions pour dépréciation des prêts et autres créances à plus d’un an',28,1,0,-1),(90,3,200,29,'29. COMPTES D’ATTENTE ET REGULARISER',0,1,0,-1),(91,3,200,30,'30. MEDICAMENT, MATERIEL MEDICAL ET IMPRIMES',0,1,0,-1),(92,2,200,301,'Médicament',30,1,0,-1),(93,2,200,302,'Imprimés',30,1,0,-1),(94,2,200,303,'Autre stock médical',30,1,0,-1),(95,2,200,304,'Autre stocks non médical',30,1,0,-1),(96,3,200,31,'31. MATIERES ET FOURNITURES',0,1,0,-1),(97,3,200,312,'Combustible',31,1,0,-1),(98,2,200,3120,'Carburant et lubrifiant',312,1,0,-1),(99,2,200,3121,'Pétrole',312,1,0,-1),(100,2,200,3122,'Autres combustibles',312,1,0,-1),(101,3,200,311,'Fournitures',31,1,0,-1),(102,2,200,3110,'Produits d’entretien',311,1,0,-1),(103,3,200,3111,'Fournitures d’atelier et d’usine',311,1,0,-1),(104,2,200,31111,'Pièces de rechange',3111,1,0,-1),(105,2,200,3113,'Fournitures de bureau',311,1,0,-1),(106,2,200,3114,'Fournitures et produits pour services sociaux',311,1,0,-1),(107,2,200,3115,'Autres Fournitures spécifiques aux services',311,1,0,-1),(108,3,200,32,'32. EMBALLAGES COMMERCIAX',0,1,0,-1),(109,3,200,321,'Emballages à vendre',32,1,0,-1),(110,2,200,3210,'Emballages en stocks',321,1,0,-1),(111,2,200,3211,'Emballages sortis',321,1,0,-1),(112,3,200,33,'33. PRODUITS SEMI-OUVRES',0,1,0,-1),(113,3,200,34,'34. PRODUITS FINIS',0,1,0,-1),(114,3,200,35,'35. PRODUITS ET TRAVAUX EN COURS',0,1,0,-1),(115,3,200,36,'36. STOCKS A L’EXTERIEUR',0,1,0,-1),(116,2,200,360,'Stocks en cours de route',36,1,0,-1),(117,2,200,361,'Stocks en consignation',36,1,0,-1),(118,3,200,37,'37. FRAIS ACCESSOIRES D’ACHAT',0,1,0,-1),(119,2,200,370,'Frais de transports sur achats',37,1,0,-1),(120,2,200,371,'Droits de douane à l’importation',37,1,0,-1),(121,2,200,372,'Assurances transports sur achats',37,1,0,-1),(122,2,200,373,'Commissions sur achats',37,1,0,-1),(123,2,200,374,'Frais de transit sur achats',37,1,0,-1),(124,2,200,378,'Autres frais accessoires d’achats',37,1,0,-1),(125,3,200,38,'38. PROVISIONS POUR DEPRECIATION DES COMPTES DE LA CLASSE III',0,1,0,-1),(126,2,200,380,'Provisions pour dépréciation des médicament',38,1,0,-1),(127,2,200,381,'Provisions pour dépréciation des matières et fournitures',38,1,0,-1),(128,2,200,382,'Provisions pour dépréciation des emballages',38,1,0,-1),(129,2,200,384,'Provisions pour dépréciation des produits finis',38,1,0,-1),(130,2,200,386,'Provisions pour dépréciation des stocks détenus à l’extérieur',38,1,0,-1),(131,3,200,39,'39. ACHATS',0,1,0,-1),(132,2,200,390,'Médicament, matériel',39,1,0,-1),(133,2,200,391,'Matériel médical',39,1,0,-1),(134,2,200,392,'Imprimés',39,1,0,-1),(135,2,200,393,'Achat de matière et fournitures spécifiques',39,1,0,-1),(136,2,200,394,'Achat d’emballages commerciaux.',39,1,0,-1),(137,3,200,40,'40. FOURNISSEURS',0,1,0,-1),(138,2,200,400,'Fournisseurs, institutions sanitaires',40,1,0,-1),(139,2,200,401,'Fournisseurs ordinaires',40,1,0,-1),(140,2,200,403,'Fournisseurs, avances et acomptes versés sur valeurs d’exploitation (ou sous-traitance)',40,1,0,-1),(141,2,200,404,'Fournisseurs, emballages et matériels à rendre',40,1,0,-1),(142,2,200,405,'Fournisseurs, factures à recevoir',40,1,0,-1),(143,2,200,406,'Fournisseurs, Etat.',40,1,0,-1),(144,3,200,41,'41. CLIENTS',0,1,0,-1),(145,3,200,410,'Clients, sociétés conventionnées',41,1,0,-1),(146,2,200,4100,'Société x',410,1,0,-1),(147,2,200,4101,'Société y',410,1,0,-1),(148,2,200,415,'Clients, factures à établir',41,1,0,-1),(149,2,200,416,'Ayant droit',41,1,0,-1),(150,2,200,417,'Clients douteux',41,1,0,-1),(151,3,200,42,'42. PERSONNEL',0,1,0,-1),(152,3,200,420,'Avances, acomptes et prêts au personnel',42,1,0,-1),(153,2,200,4200,'debitor et personnel de direction',420,1,0,-1),(154,2,200,4201,'Infirmiers',420,1,0,-1),(155,2,200,4202,'Para médicaux',420,1,0,-1),(156,3,200,422,'Rémunérations dues au personnel',42,1,0,-1),(157,2,200,4220,'Cadres et personnel de direction',422,1,0,-1),(158,2,200,4221,'Infirmiers',422,1,0,-1),(159,2,200,4222,'Para médicaux',422,1,0,-1),(160,3,200,43,'43. ETAT-PUISSANCE PUBLIQUE',0,1,0,-1),(161,2,200,432,'CPR',43,1,0,-1),(162,3,200,45,'45.INSTITUTIONS APPARENTEES',0,1,0,-1),(163,3,200,46,'46. CREDITEURS ET DEBITEURS DIVERS',0,1,0,-1),(164,2,200,460,'Débiteurs divers',46,1,0,-1),(165,3,200,461,'Créditeurs',46,1,0,-1),(166,3,200,4610,'Divers',461,1,0,-1),(167,2,200,46102,'INSS',4610,1,0,-1),(168,2,200,462,'Projets spécifiques',46,1,0,-1),(169,2,200,465,'Organismes internationaux',46,1,0,-1),(170,2,200,466,'466 Autres projets spécifiques',46,1,0,-1),(171,3,200,47,'47. COMPTES DE REGULARISATIONS',0,1,0,-1),(172,2,200,470,'Régularisations passives',47,1,0,-1),(173,2,200,471,'Régularisations actives',47,1,0,-1),(174,2,200,473,'Charges à étaler',47,1,0,-1),(175,3,200,48,'48. PROVISIONS POUR DEPRECIATION DES COMPTES DE LA CLASSE IV',0,1,0,-1),(176,2,200,480,'Provisions pour dépréciation des comptes des fournisseurs débiteurs',48,1,0,-1),(177,2,200,481,'Provisions pour dépréciation des comptes clients',48,1,0,-1),(178,3,200,49,'49. COMPTES D’ATTENTE ET A REGULARISER',0,1,0,-1),(179,3,200,50,'50. EMPRUNTS A MOINS D’UN AN',0,1,0,-1),(180,2,200,500,'Emprunts auprès de l’Etat ou des organismes publics',50,1,0,-1),(181,2,200,501,'Emprunts auprès des organismes',50,1,0,-1),(182,2,200,503,'Emprunts bancaires',50,1,0,-1),(183,3,200,51,'51. PRETS A MOINS D’UN AN',0,1,0,-1),(184,2,200,510,'Prêts auprès de l’Etat ou organismes publics',51,1,0,-1),(185,2,200,511,'Prêts auprès des entreprises',51,1,0,-1),(186,2,200,513,'Prêts bancaires',51,1,0,-1),(187,3,200,56,'56. BANQUES ET INSTITUTIONS FINANCIERES',0,1,0,-1),(188,3,200,562,'Banques de dépôt',56,1,0,-1),(189,2,200,5620,'Banque FC',562,1,0,-1),(190,2,200,5621,'Banque $',562,1,0,-1),(191,2,200,5622,'Banque EU',562,1,0,-1),(192,2,200,563,'Institutions et autres établissements financiers',56,1,0,-1),(193,3,200,57,'57. CAISSES',0,1,0,-1),(194,2,200,5701,'Caisses Fc',57,1,0,-1),(195,2,200,5702,'Caisses $',57,1,0,-1),(196,2,200,5703,'Caisses €',57,1,0,-1),(197,3,200,58,'58. PROVISIONS POUR DEPRECIATION DES COMPTES DE LA CLASSE V',0,1,0,-1),(198,3,200,59,'59. VIREMENTS INTERNES',0,1,0,-1),(199,2,200,590,'Caisse Fc à Banque Fc',59,1,0,-1),(200,2,200,591,'Caisse $ à Banque $',59,1,0,-1),(201,2,200,592,'Banque $ à Caisse Fc',59,1,0,-1),(202,2,200,593,'Banque € à Caisse Fc',59,1,0,-1),(203,3,200,60,'60. STOCKS VENDUS',0,1,0,-1),(204,1,200,600,'Médicaments vendus',60,1,0,-1),(205,1,200,607,'Imprimés vendus',60,1,0,-1),(206,3,200,608,'Matériel médical et nonmédical vendu',60,1,0,-1),(207,1,200,6080,'Matériel médical vendu',608,1,0,-1),(208,1,200,6085,'Matériel non médical vendu',608,1,0,-1),(209,3,200,61,'61. MATIERES ET FOURNITURES CONSOMMEES',0,1,0,-1),(210,3,200,611,'Fournitures consommées',61,1,0,-1),(211,1,200,6110,'Produits d’entretien',611,1,0,-1),(212,1,200,6111,'Fournitures spécifiques',611,1,0,-1),(213,1,200,6113,'Fournitures de bureau',611,1,0,-1),(214,1,200,6114,'Fournitures et produits médicaux',611,1,0,-1),(215,1,200,6119,'Divers consommés',611,1,0,-1),(216,3,200,612,'Matières consommées',61,1,0,-1),(217,1,200,6120,'Carburant et lubrifiant',612,1,0,-1),(218,1,200,6125,'Autres Combustibles consommés',612,1,0,-1),(219,1,200,6126,'Electricité',612,1,0,-1),(220,1,200,6127,'Eau',612,1,0,-1),(221,1,200,613,'Pièces de rechange',61,1,0,-1),(222,1,200,614,'Emballages consommés',61,1,0,-1),(223,3,200,62,'62. TRANSPORTS CONSOMMES',0,1,0,-1),(224,3,200,620,'Transports sur ventes',62,1,0,-1),(225,1,200,6200,'Transports par fer',620,1,0,-1),(226,1,200,6201,'Transports par route',620,1,0,-1),(227,1,200,6202,'Transports maritimes',620,1,0,-1),(228,1,200,6203,'Transport aériens',620,1,0,-1),(229,1,200,6204,'Transports fluviaux',620,1,0,-1),(230,1,200,621,'Transports du personnel',62,1,0,-1),(231,1,200,623,'Déplacements et voyages',62,1,0,-1),(232,1,200,627,'Transports pour comptes de tiers',62,1,0,-1),(233,1,200,628,'Autres frais de transports',62,1,0,-1),(234,3,200,63,'63. AUTRES SERVICES CONSOMMES',0,1,0,-1),(235,1,200,630,'Loyers et charges locatives',63,1,0,-1),(236,3,200,631,'Entretien et réparations',63,1,0,-1),(237,1,200,6310,'Entretien des bâtiments',631,1,0,-1),(238,1,200,6311,'Entretien des véhicules et motos',631,1,0,-1),(239,1,200,6312,'Entretien des machines',631,1,0,-1),(240,1,200,6313,'Entretien de la cour',631,1,0,-1),(241,1,200,6314,'Entretien divers',631,1,0,-1),(242,3,200,632,'Rémunérations d’intermédiaires et honoraires',63,1,0,-1),(243,1,200,6320,'Honoraires',632,1,0,-1),(244,1,200,6321,'Frais d’acte',632,1,0,-1),(245,3,200,633,'Achat de services extérieurs',63,1,0,-1),(246,1,200,6330,'Service bancaires',633,1,0,-1),(247,1,200,6331,'Frais de postes et télécommunications',633,1,0,-1),(248,1,200,6333,'Frais de mission',633,1,0,-1),(249,1,200,6334,'Organismes d’études, d’assistance technique et de formation',633,1,0,-1),(250,1,200,634,'Commissions et courtages sur ventes',63,1,0,-1),(251,1,200,635,'Quote-part des frais de siège à l’étranger',63,1,0,-1),(252,1,200,636,'Publicité',63,1,0,-1),(253,3,200,64,'64. CHARGES ET PERTES DIVERSES',0,1,0,-1),(254,3,200,640,'Primes d’assurance',64,1,0,-1),(255,1,200,6401,'Assurance véhicule',640,1,0,-1),(256,1,200,6402,'Assurance moto',640,1,0,-1),(257,1,200,6403,'Assurance autres biens',640,1,0,-1),(258,1,200,6407,'Autres primes d’assurance',640,1,0,-1),(259,3,200,642,'Rémunérations des dirigeants non salariés',64,1,0,-1),(260,1,200,6420,'Jetons de présence',642,1,0,-1),(261,1,200,6425,'Autres',642,1,0,-1),(262,3,200,645,'Subventions accordées, dons et cotisations',64,1,0,-1),(263,1,200,6450,'Subventions accordées',645,1,0,-1),(264,1,200,6451,'Dons',645,1,0,-1),(265,1,200,6452,'Cotisations',645,1,0,-1),(266,1,200,646,'Différences de change',64,1,0,-1),(267,1,200,647,'Créances irrécouvrables',64,1,0,-1),(268,1,200,648,'Amendes pénales',64,1,0,-1),(269,3,200,649,'Autres',64,1,0,-1),(270,1,200,6490,'Soins médicaux aux pensionnés',649,1,0,-1),(271,1,200,6491,'Soin médicaux aux indigents',649,1,0,-1),(272,1,200,6492,'Assistances sociales',649,1,0,-1),(273,3,200,65,'65. CHARGES DU PERSONNEL',0,1,0,-1),(274,3,200,651,'Rémunérations',65,1,0,-1),(275,1,200,6510,'Salaires de base',651,1,0,-1),(276,1,200,6511,'Primes et gratifications',651,1,0,-1),(277,1,200,6512,'Commissions',651,1,0,-1),(278,1,200,6513,'Allocations familiales légales',651,1,0,-1),(279,3,200,652,'Charges sociales diverses',65,1,0,-1),(280,1,200,6520,'I.N.S.S.',652,1,0,-1),(281,1,200,6521,'Autres charges sociales (I.N.P.P., assurances diverses)',652,1,0,-1),(282,3,200,653,'Indemnités et divers',65,1,0,-1),(283,1,200,6530,'Indemnités diverses',653,1,0,-1),(284,1,200,6531,'Frais médicaux, pharmaceutiques, d’hospitalisation et funéraires',653,1,0,-1),(285,1,200,6532,'Frais de transport du personnel',653,1,0,-1),(286,3,200,66,'66. CONTRIBUTIONS ET TAXES',0,1,0,-1),(287,3,200,661,'Contributions directes',66,1,0,-1),(288,1,200,6611,'Taxe sur véhicule',661,1,0,-1),(289,1,200,612,'Taxe sur moto',66,1,0,-1),(290,3,200,67,'67. INTERETS',0,1,0,-1),(291,1,200,670,'Intérêts des emprunts',67,1,0,-1),(292,1,200,672,'Intérêts des comptes courants et des dépôts créditeurs',67,1,0,-1),(293,1,200,673,'Intérêts bancaires',67,1,0,-1),(294,1,200,674,'Autres intérêts',67,1,0,-1),(295,1,200,675,'Escomptes financiers accordés',67,1,0,-1),(296,3,200,68,'68. DOTATION AUX AMORTISSEMENTS ET PROVISIONS',0,1,0,-1),(297,1,200,680,'Dotation aux amortissements',68,1,0,-1),(298,1,200,681,'Dotation aux provisions non exigibles',68,1,0,-1),(299,1,200,682,'Dotation aux provisions exigibles',68,1,0,-1),(300,3,200,70,'70. VENTES EN L’ETAT',0,1,0,-1),(301,1,200,700,'Ventes de médicaments',70,1,0,-1),(302,1,200,701,'Ventes de matériels médicaux',70,1,0,-1),(303,1,200,702,'Ventes des matériels non médicaux',70,1,0,-1),(304,1,200,703,'Ventes des imprimés',70,1,0,-1),(305,1,200,706,'Réductions sur ventes',70,1,0,-1),(306,1,200,707,'Ventes d’emballage récupérables',70,1,0,-1),(307,3,200,71,'71. PRODUCTION VENDUE',0,1,0,-1),(308,3,200,710,'Médicaments vendus (transformés sur place)',71,1,0,-1),(309,1,200,7110,'Recettes Actes infirmiers',710,1,0,-1),(310,3,200,711,'Prestations de services',71,1,0,-1),(311,1,200,7111,'Prestations Consultations',711,1,0,-1),(312,1,200,7112,'Prestations Orthopédie',711,1,0,-1),(313,1,200,7113,'Prestations Ophtalmologie',711,1,0,-1),(314,1,200,7114,'Prestations Médecine interne',711,1,0,-1),(315,1,200,7115,'Prestations Chirurgie',711,1,0,-1),(316,1,200,7116,'Prestations Dentisterie',711,1,0,-1),(317,1,200,7117,'Prestations Maternité',711,1,0,-1),(318,1,200,7118,'Prestations Laboratoire',711,1,0,-1),(319,1,200,7119,'Prestations Radiologie',711,1,0,-1),(320,1,200,7120,'Prestations Echographie',711,1,0,-1),(321,1,200,7121,'Prestations Kinésithérapie',711,1,0,-1),(322,1,200,7122,'Prestations Hospitalisation',711,1,0,-1),(323,1,200,7123,'Prestations CPN',711,1,0,-1),(324,1,200,7124,'Prestations CPS',711,1,0,-1),(325,1,200,7125,'Prestations CND',711,1,0,-1),(326,1,200,7126,'Autres Prestations',711,1,0,-1),(327,1,200,716,'Réductions sur ventes des production',71,1,0,-1),(328,1,200,717,'Ventes d’emballages récupérables',71,1,0,-1),(329,1,200,718,'Autres production vendue',71,1,0,-1),(330,3,200,72,'72. PRODUCTION STOCKEE',0,1,0,-1),(331,1,200,722,'Emballages commerciaux fabriqués par l’agent économique',72,1,0,-1),(332,1,200,723,'Produits Pharmaceutiques semi-ouvrés',72,1,0,-1),(333,1,200,724,'Produits finis',72,1,0,-1),(334,1,200,725,'Produits et travaux en cours',72,1,0,-1),(335,3,200,74,'74. PRODUITS ET PROFITS DIVERS',0,1,0,-1),(336,1,200,740,'Ristournes, rabais et remises obtenus hors factures',74,1,0,-1),(337,1,200,741,'Bonifications obtenues de fournisseurs',74,1,0,-1),(338,1,200,742,'Réquisition médecin',74,1,0,-1),(339,1,200,745,'Cotisations et dons reçus',74,1,0,-1),(340,1,200,746,'Bonis sur reprise d’emballages consignés',74,1,0,-1),(341,1,200,747,'Subventions d’équipement reprises pour quote-part',74,1,0,-1),(342,1,200,749,'Atres produits et profits divers',74,1,0,-1),(343,3,200,76,'76. SUBVENTIONS D’EXPLOITATION ET HORS EXPLOITATION',0,1,0,-1),(344,1,200,760,'Subventions accordées par l’Etat',76,1,0,-1),(345,1,200,761,'Subventions des Centres de santé',76,1,0,-1),(346,1,200,762,'Subvention organismes privés Etrangers',76,1,0,-1),(347,1,200,763,'Subventions organismes privés étrangers .',76,1,0,-1),(348,1,200,764,'Subventions d’autres institutions',76,1,0,-1),(349,1,200,765,'Don en médicament',76,1,0,-1),(350,3,200,78,'78. REPRISE SUR AMORTISSEMENTS ET PROVISIONS',0,1,0,-1),(351,1,200,780,'Reprises sur amortissements',78,1,0,-1),(352,1,200,781,'Reprises sur provisions non exigibles',78,1,0,-1),(353,1,200,782,'Reprises sur provisions exigibles',78,1,0,-1);
/*!40000 ALTER TABLE `account` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `account_type`
--

DROP TABLE IF EXISTS `account_type`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `account_type` (
  `id` mediumint(8) unsigned NOT NULL,
  `type` varchar(35) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `account_type`
--

LOCK TABLES `account_type` WRITE;
/*!40000 ALTER TABLE `account_type` DISABLE KEYS */;
INSERT INTO `account_type` VALUES (1,'income/expense'),(2,'balance'),(3,'title');
/*!40000 ALTER TABLE `account_type` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `assignation_patient`
--

DROP TABLE IF EXISTS `assignation_patient`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `assignation_patient` (
  `id` smallint(5) unsigned NOT NULL AUTO_INCREMENT,
  `patient_group_id` mediumint(8) unsigned NOT NULL,
  `patient_id` int(10) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `patient_group_id` (`patient_group_id`),
  KEY `patient_id` (`patient_id`),
  CONSTRAINT `assignation_patient_ibfk_1` FOREIGN KEY (`patient_group_id`) REFERENCES `patient_group` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `assignation_patient_ibfk_2` FOREIGN KEY (`patient_id`) REFERENCES `patient` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `assignation_patient`
--

LOCK TABLES `assignation_patient` WRITE;
/*!40000 ALTER TABLE `assignation_patient` DISABLE KEYS */;
INSERT INTO `assignation_patient` VALUES (1,1,1);
/*!40000 ALTER TABLE `assignation_patient` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `budget`
--

DROP TABLE IF EXISTS `budget`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `budget` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `account_id` int(10) unsigned NOT NULL DEFAULT '0',
  `period_id` mediumint(8) unsigned NOT NULL,
  `budget` decimal(10,2) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `budget`
--

LOCK TABLES `budget` WRITE;
/*!40000 ALTER TABLE `budget` DISABLE KEYS */;
/*!40000 ALTER TABLE `budget` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cash`
--

DROP TABLE IF EXISTS `cash`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `cash` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `enterprise_id` smallint(6) DEFAULT NULL,
  `bon` char(1) NOT NULL,
  `bon_num` int(10) unsigned NOT NULL,
  `date` date NOT NULL,
  `debit_account` int(10) unsigned NOT NULL,
  `credit_account` int(10) unsigned NOT NULL,
  `deb_cred_id` int(10) unsigned NOT NULL,
  `deb_cred_type` varchar(1) NOT NULL,
  `currency_id` tinyint(3) unsigned NOT NULL,
  `cost` decimal(19,2) unsigned NOT NULL DEFAULT '0.00',
  `cashier_id` smallint(5) unsigned NOT NULL,
  `cashbox_id` smallint(5) unsigned NOT NULL,
  `description` text,
  PRIMARY KEY (`id`),
  KEY `currency_id` (`currency_id`),
  KEY `cashier_id` (`cashier_id`),
  KEY `debit_account` (`debit_account`),
  KEY `credit_account` (`credit_account`),
  CONSTRAINT `cash_ibfk_1` FOREIGN KEY (`currency_id`) REFERENCES `currency` (`id`),
  CONSTRAINT `cash_ibfk_2` FOREIGN KEY (`cashier_id`) REFERENCES `user` (`id`),
  CONSTRAINT `cash_ibfk_3` FOREIGN KEY (`debit_account`) REFERENCES `account` (`id`),
  CONSTRAINT `cash_ibfk_4` FOREIGN KEY (`credit_account`) REFERENCES `account` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cash`
--

LOCK TABLES `cash` WRITE;
/*!40000 ALTER TABLE `cash` DISABLE KEYS */;
/*!40000 ALTER TABLE `cash` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cash_item`
--

DROP TABLE IF EXISTS `cash_item`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `cash_item` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `cash_id` int(10) unsigned NOT NULL,
  `allocated_cost` decimal(19,2) unsigned NOT NULL DEFAULT '0.00',
  `invoice_id` int(10) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `cash_id` (`cash_id`),
  KEY `invoice_id` (`invoice_id`),
  CONSTRAINT `cash_item_ibfk_1` FOREIGN KEY (`cash_id`) REFERENCES `cash` (`id`),
  CONSTRAINT `cash_item_ibfk_2` FOREIGN KEY (`invoice_id`) REFERENCES `sale` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cash_item`
--

LOCK TABLES `cash_item` WRITE;
/*!40000 ALTER TABLE `cash_item` DISABLE KEYS */;
/*!40000 ALTER TABLE `cash_item` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cost_center`
--

DROP TABLE IF EXISTS `cost_center`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `cost_center` (
  `enterprise_id` smallint(5) unsigned NOT NULL,
  `id` smallint(6) NOT NULL AUTO_INCREMENT,
  `text` varchar(100) NOT NULL,
  `cost` float DEFAULT '0',
  `note` text,
  `pc` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `enterprise_id` (`enterprise_id`),
  CONSTRAINT `cost_center_ibfk_1` FOREIGN KEY (`enterprise_id`) REFERENCES `enterprise` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cost_center`
--

LOCK TABLES `cost_center` WRITE;
/*!40000 ALTER TABLE `cost_center` DISABLE KEYS */;
/*!40000 ALTER TABLE `cost_center` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `country`
--

DROP TABLE IF EXISTS `country`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `country` (
  `id` smallint(5) unsigned NOT NULL AUTO_INCREMENT,
  `code` smallint(5) unsigned NOT NULL,
  `country_en` varchar(45) NOT NULL,
  `country_fr` varchar(45) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code_unique` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=242 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `country`
--

LOCK TABLES `country` WRITE;
/*!40000 ALTER TABLE `country` DISABLE KEYS */;
INSERT INTO `country` VALUES (1,4,'Afghanistan','Afghanistan'),(2,8,'Albania','Albanie'),(3,10,'Antarctica','Antarctique'),(4,12,'Algeria','Algérie'),(5,16,'American Samoa','Samoa Américaines'),(6,20,'Andorra','Andorre'),(7,24,'Angola','Angola'),(8,28,'Antigua and Barbuda','Antigua-et-Barbuda'),(9,31,'Azerbaijan','Azerbaïdjan'),(10,32,'Argentina','Argentine'),(11,36,'Australia','Australie'),(12,40,'Austria','Autriche'),(13,44,'Bahamas','Bahamas'),(14,48,'Bahrain','Bahreïn'),(15,50,'Bangladesh','Bangladesh'),(16,51,'Armenia','Arménie'),(17,52,'Barbados','Barbade'),(18,56,'Belgium','Belgique'),(19,60,'Bermuda','Bermudes'),(20,64,'Bhutan','Bhoutan'),(21,68,'Bolivia','Bolivie'),(22,70,'Bosnia and Herzegovina','Bosnie-Herzégovine'),(23,72,'Botswana','Botswana'),(24,74,'Bouvet Island','Île Bouvet'),(25,76,'Brazil','Brésil'),(26,84,'Belize','Belize'),(27,86,'British Indian Ocean Territory','Territoire Britannique de l\'Océan Indien'),(28,90,'Solomon Islands','Îles Salomon'),(29,92,'British Virgin Islands','Îles Vierges Britanniques'),(30,96,'Brunei Darussalam','Brunéi Darussalam'),(31,100,'Bulgaria','Bulgarie'),(32,104,'Myanmar','Myanmar'),(33,108,'Burundi','Burundi'),(34,112,'Belarus','Bélarus'),(35,116,'Cambodia','Cambodge'),(36,120,'Cameroon','Cameroun'),(37,124,'Canada','Canada'),(38,132,'Cape Verde','Cap-vert'),(39,136,'Cayman Islands','Îles Caïmanes'),(40,140,'Central African','République Centrafricaine'),(41,144,'Sri Lanka','Sri Lanka'),(42,148,'Chad','Tchad'),(43,152,'Chile','Chili'),(44,156,'China','Chine'),(45,158,'Taiwan','Taïwan'),(46,162,'Christmas Island','Île Christmas'),(47,166,'Cocos (Keeling) Islands','Îles Cocos (Keeling)'),(48,170,'Colombia','Colombie'),(49,174,'Comoros','Comores'),(50,175,'Mayotte','Mayotte'),(51,178,'Republic of the Congo','République du Congo'),(52,180,'The Democratic Republic Of The Congo','République Démocratique du Congo'),(53,184,'Cook Islands','Îles Cook'),(54,188,'Costa Rica','Costa Rica'),(55,191,'Croatia','Croatie'),(56,192,'Cuba','Cuba'),(57,196,'Cyprus','Chypre'),(58,203,'Czech Republic','République Tchèque'),(59,204,'Benin','Bénin'),(60,208,'Denmark','Danemark'),(61,212,'Dominica','Dominique'),(62,214,'Dominican Republic','République Dominicaine'),(63,218,'Ecuador','Équateur'),(64,222,'El Salvador','El Salvador'),(65,226,'Equatorial Guinea','Guinée Équatoriale'),(66,231,'Ethiopia','Éthiopie'),(67,232,'Eritrea','Érythrée'),(68,233,'Estonia','Estonie'),(69,234,'Faroe Islands','Îles Féroé'),(70,238,'Falkland Islands','Îles (malvinas) Falkland'),(71,239,'South Georgia and the South Sandwich Islands','Géorgie du Sud et les Îles Sandwich du Sud'),(72,242,'Fiji','Fidji'),(73,246,'Finland','Finlande'),(74,248,'Åland Islands','Îles Åland'),(75,250,'France','France'),(76,254,'French Guiana','Guyane Française'),(77,258,'French Polynesia','Polynésie Française'),(78,260,'French Southern Territories','Terres Australes Françaises'),(79,262,'Djibouti','Djibouti'),(80,266,'Gabon','Gabon'),(81,268,'Georgia','Géorgie'),(82,270,'Gambia','Gambie'),(83,275,'Occupied Palestinian Territory','Territoire Palestinien Occupé'),(84,276,'Germany','Allemagne'),(85,288,'Ghana','Ghana'),(86,292,'Gibraltar','Gibraltar'),(87,296,'Kiribati','Kiribati'),(88,300,'Greece','Grèce'),(89,304,'Greenland','Groenland'),(90,308,'Grenada','Grenade'),(91,312,'Guadeloupe','Guadeloupe'),(92,316,'Guam','Guam'),(93,320,'Guatemala','Guatemala'),(94,324,'Guinea','Guinée'),(95,328,'Guyana','Guyana'),(96,332,'Haiti','Haïti'),(97,334,'Heard Island and McDonald Islands','Îles Heard et Mcdonald'),(98,336,'Vatican City State','Saint-Siège (état de la Cité du Vatican)'),(99,340,'Honduras','Honduras'),(100,344,'Hong Kong','Hong-Kong'),(101,348,'Hungary','Hongrie'),(102,352,'Iceland','Islande'),(103,356,'India','Inde'),(104,360,'Indonesia','Indonésie'),(105,364,'Islamic Republic of Iran','République Islamique d\'Iran'),(106,368,'Iraq','Iraq'),(107,372,'Ireland','Irlande'),(108,376,'Israel','Israël'),(109,380,'Italy','Italie'),(110,384,'Côte d\'Ivoire','Côte d\'Ivoire'),(111,388,'Jamaica','Jamaïque'),(112,392,'Japan','Japon'),(113,398,'Kazakhstan','Kazakhstan'),(114,400,'Jordan','Jordanie'),(115,404,'Kenya','Kenya'),(116,408,'Democratic People\'s Republic of Korea','République Populaire Démocratique de Corée'),(117,410,'Republic of Korea','République de Corée'),(118,414,'Kuwait','Koweït'),(119,417,'Kyrgyzstan','Kirghizistan'),(120,418,'Lao People\'s Democratic Republic','République Démocratique Populaire Lao'),(121,422,'Lebanon','Liban'),(122,426,'Lesotho','Lesotho'),(123,428,'Latvia','Lettonie'),(124,430,'Liberia','Libéria'),(125,434,'Libyan Arab Jamahiriya','Jamahiriya Arabe Libyenne'),(126,438,'Liechtenstein','Liechtenstein'),(127,440,'Lithuania','Lituanie'),(128,442,'Luxembourg','Luxembourg'),(129,446,'Macao','Macao'),(130,450,'Madagascar','Madagascar'),(131,454,'Malawi','Malawi'),(132,458,'Malaysia','Malaisie'),(133,462,'Maldives','Maldives'),(134,466,'Mali','Mali'),(135,470,'Malta','Malte'),(136,474,'Martinique','Martinique'),(137,478,'Mauritania','Mauritanie'),(138,480,'Mauritius','Maurice'),(139,484,'Mexico','Mexique'),(140,492,'Monaco','Monaco'),(141,496,'Mongolia','Mongolie'),(142,498,'Republic of Moldova','République de Moldova'),(143,500,'Montserrat','Montserrat'),(144,504,'Morocco','Maroc'),(145,508,'Mozambique','Mozambique'),(146,512,'Oman','Oman'),(147,516,'Namibia','Namibie'),(148,520,'Nauru','Nauru'),(149,524,'Nepal','Népal'),(150,528,'Netherlands','country-Bas'),(151,530,'Netherlands Antilles','Antilles Néerlandaises'),(152,533,'Aruba','Aruba'),(153,540,'New Caledonia','Nouvelle-Calédonie'),(154,548,'Vanuatu','Vanuatu'),(155,554,'New Zealand','Nouvelle-Zélande'),(156,558,'Nicaragua','Nicaragua'),(157,562,'Niger','Niger'),(158,566,'Nigeria','Nigéria'),(159,570,'Niue','Niué'),(160,574,'Norfolk Island','Île Norfolk'),(161,578,'Norway','Norvège'),(162,580,'Northern Mariana Islands','Îles Mariannes du Nord'),(163,581,'United States Minor Outlying Islands','Îles Mineures Éloignées des États-Unis'),(164,583,'Federated States of Micronesia','États Fédérés de Micronésie'),(165,584,'Marshall Islands','Îles Marshall'),(166,585,'Palau','Palaos'),(167,586,'Pakistan','Pakistan'),(168,591,'Panama','Panama'),(169,598,'Papua New Guinea','Papouasie-Nouvelle-Guinée'),(170,600,'Paraguay','Paraguay'),(171,604,'Peru','Pérou'),(172,608,'Philippines','Philippines'),(173,612,'Pitcairn','Pitcairn'),(174,616,'Poland','Pologne'),(175,620,'Portugal','Portugal'),(176,624,'Guinea-Bissau','Guinée-Bissau'),(177,626,'Timor-Leste','Timor-Leste'),(178,630,'Puerto Rico','Porto Rico'),(179,634,'Qatar','Qatar'),(180,638,'Réunion','Réunion'),(181,642,'Romania','Roumanie'),(182,643,'Russian Federation','Fédération de Russie'),(183,646,'Rwanda','Rwanda'),(184,654,'Saint Helena','Sainte-Hélène'),(185,659,'Saint Kitts and Nevis','Saint-Kitts-et-Nevis'),(186,660,'Anguilla','Anguilla'),(187,662,'Saint Lucia','Sainte-Lucie'),(188,666,'Saint-Pierre and Miquelon','Saint-Pierre-et-Miquelon'),(189,670,'Saint Vincent and the Grenadines','Saint-Vincent-et-les Grenadines'),(190,674,'San Marino','Saint-Marin'),(191,678,'Sao Tome and Principe','Sao Tomé-et-Principe'),(192,682,'Saudi Arabia','Arabie Saoudite'),(193,686,'Senegal','Sénégal'),(194,690,'Seychelles','Seychelles'),(195,694,'Sierra Leone','Sierra Leone'),(196,702,'Singapore','Singapour'),(197,703,'Slovakia','Slovaquie'),(198,704,'Vietnam','Viet Nam'),(199,705,'Slovenia','Slovénie'),(200,706,'Somalia','Somalie'),(201,710,'South Africa','Afrique du Sud'),(202,716,'Zimbabwe','Zimbabwe'),(203,724,'Spain','Espagne'),(204,732,'Western Sahara','Sahara Occidental'),(205,736,'Sudan','Soudan'),(206,740,'Suriname','Suriname'),(207,744,'Svalbard and Jan Mayen','Svalbard etÎle Jan Mayen'),(208,748,'Swaziland','Swaziland'),(209,752,'Sweden','Suède'),(210,756,'Switzerland','Suisse'),(211,760,'Syrian Arab Republic','République Arabe Syrienne'),(212,762,'Tajikistan','Tadjikistan'),(213,764,'Thailand','Thaïlande'),(214,768,'Togo','Togo'),(215,772,'Tokelau','Tokelau'),(216,776,'Tonga','Tonga'),(217,780,'Trinidad and Tobago','Trinité-et-Tobago'),(218,784,'United Arab Emirates','Émirats Arabes Unis'),(219,788,'Tunisia','Tunisie'),(220,792,'Turkey','Turquie'),(221,795,'Turkmenistan','Turkménistan'),(222,796,'Turks and Caicos Islands','Îles Turks et Caïques'),(223,798,'Tuvalu','Tuvalu'),(224,800,'Uganda','Ouganda'),(225,804,'Ukraine','Ukraine'),(226,807,'The Former Yugoslav Republic of Macedonia','L\'ex-République Yougoslave de Macédoine'),(227,818,'Egypt','Égypte'),(228,826,'United Kingdom','Royaume-Uni'),(229,833,'Isle of Man','Île de Man'),(230,834,'United Republic Of Tanzania','République-Unie de Tanzanie'),(231,840,'United States','États-Unis'),(232,850,'U.S. Virgin Islands','Îles Vierges des États-Unis'),(233,854,'Burkina Faso','Burkina Faso'),(234,858,'Uruguay','Uruguay'),(235,860,'Uzbekistan','Ouzbékistan'),(236,862,'Venezuela','Venezuela'),(237,876,'Wallis and Futuna','Wallis et Futuna'),(238,882,'Samoa','Samoa'),(239,887,'Yemen','Yémen'),(240,891,'Serbia and Montenegro','Serbie-et-Monténégro'),(241,894,'Zambia','Zambie');
/*!40000 ALTER TABLE `country` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `credit_note`
--

DROP TABLE IF EXISTS `credit_note`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `credit_note` (
  `enterprise_id` smallint(5) unsigned NOT NULL,
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `cost` decimal(19,2) unsigned NOT NULL,
  `debitor_id` int(10) unsigned NOT NULL,
  `seller_id` smallint(5) unsigned NOT NULL DEFAULT '0',
  `sale_id` int(10) unsigned NOT NULL,
  `note_date` date NOT NULL,
  `description` text,
  `posted` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `enterprise_id` (`enterprise_id`),
  KEY `debitor_id` (`debitor_id`),
  KEY `sale_id` (`sale_id`),
  CONSTRAINT `credit_note_ibfk_1` FOREIGN KEY (`enterprise_id`) REFERENCES `enterprise` (`id`),
  CONSTRAINT `credit_note_ibfk_2` FOREIGN KEY (`debitor_id`) REFERENCES `debitor` (`id`),
  CONSTRAINT `credit_note_ibfk_3` FOREIGN KEY (`sale_id`) REFERENCES `sale` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `credit_note`
--

LOCK TABLES `credit_note` WRITE;
/*!40000 ALTER TABLE `credit_note` DISABLE KEYS */;
/*!40000 ALTER TABLE `credit_note` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `creditor`
--

DROP TABLE IF EXISTS `creditor`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `creditor` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `group_id` smallint(5) unsigned NOT NULL,
  `text` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `group_id` (`group_id`),
  CONSTRAINT `creditor_ibfk_1` FOREIGN KEY (`group_id`) REFERENCES `creditor_group` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `creditor`
--

LOCK TABLES `creditor` WRITE;
/*!40000 ALTER TABLE `creditor` DISABLE KEYS */;
INSERT INTO `creditor` VALUES (1,1,'Pharmacy Centrale');
/*!40000 ALTER TABLE `creditor` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `creditor_group`
--

DROP TABLE IF EXISTS `creditor_group`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `creditor_group` (
  `enterprise_id` smallint(5) unsigned NOT NULL,
  `id` smallint(5) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(80) DEFAULT NULL,
  `account_id` int(10) unsigned NOT NULL,
  `locked` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `account_id` (`account_id`),
  KEY `enterprise_id` (`enterprise_id`),
  CONSTRAINT `creditor_group_ibfk_1` FOREIGN KEY (`enterprise_id`) REFERENCES `enterprise` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `creditor_group_ibfk_2` FOREIGN KEY (`account_id`) REFERENCES `account` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `creditor_group`
--

LOCK TABLES `creditor_group` WRITE;
/*!40000 ALTER TABLE `creditor_group` DISABLE KEYS */;
INSERT INTO `creditor_group` VALUES (200,1,'Medicine Suppliers',139,0);
/*!40000 ALTER TABLE `creditor_group` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `critere`
--

DROP TABLE IF EXISTS `critere`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `critere` (
  `id` smallint(5) unsigned NOT NULL AUTO_INCREMENT,
  `critere_txt` varchar(50) NOT NULL,
  `note` text,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `critere`
--

LOCK TABLES `critere` WRITE;
/*!40000 ALTER TABLE `critere` DISABLE KEYS */;
/*!40000 ALTER TABLE `critere` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `currency`
--

DROP TABLE IF EXISTS `currency`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `currency` (
  `id` tinyint(3) unsigned NOT NULL AUTO_INCREMENT,
  `name` text NOT NULL,
  `symbol` varchar(15) NOT NULL,
  `note` text,
  `separator` varchar(5) DEFAULT NULL,
  `decimal` varchar(5) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `currency`
--

LOCK TABLES `currency` WRITE;
/*!40000 ALTER TABLE `currency` DISABLE KEYS */;
INSERT INTO `currency` VALUES (1,'Congolese Francs','Fc',NULL,'.',','),(2,'United States Dollars','$',NULL,',','.'),(3,'Euro','€',NULL,' ','.');
/*!40000 ALTER TABLE `currency` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `currency_account`
--

DROP TABLE IF EXISTS `currency_account`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `currency_account` (
  `id` mediumint(8) unsigned NOT NULL AUTO_INCREMENT,
  `currency_id` tinyint(3) unsigned NOT NULL,
  `enterprise_id` smallint(5) unsigned NOT NULL,
  `cash_account` int(10) unsigned NOT NULL,
  `bank_account` int(10) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`,`currency_id`),
  KEY `currency_id` (`currency_id`),
  KEY `enterprise_id` (`enterprise_id`),
  KEY `cash_account` (`cash_account`),
  KEY `bank_account` (`bank_account`),
  CONSTRAINT `currency_account_ibfk_1` FOREIGN KEY (`currency_id`) REFERENCES `currency` (`id`),
  CONSTRAINT `currency_account_ibfk_2` FOREIGN KEY (`enterprise_id`) REFERENCES `enterprise` (`id`),
  CONSTRAINT `currency_account_ibfk_3` FOREIGN KEY (`cash_account`) REFERENCES `account` (`id`),
  CONSTRAINT `currency_account_ibfk_4` FOREIGN KEY (`bank_account`) REFERENCES `account` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `currency_account`
--

LOCK TABLES `currency_account` WRITE;
/*!40000 ALTER TABLE `currency_account` DISABLE KEYS */;
INSERT INTO `currency_account` VALUES (1,1,200,194,189),(2,2,200,195,190),(3,3,200,196,191);
/*!40000 ALTER TABLE `currency_account` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `debitor`
--

DROP TABLE IF EXISTS `debitor`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `debitor` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `group_id` smallint(5) unsigned NOT NULL,
  `text` text,
  PRIMARY KEY (`id`),
  KEY `group_id` (`group_id`),
  CONSTRAINT `debitor_ibfk_1` FOREIGN KEY (`group_id`) REFERENCES `debitor_group` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `debitor`
--

LOCK TABLES `debitor` WRITE;
/*!40000 ALTER TABLE `debitor` DISABLE KEYS */;
INSERT INTO `debitor` VALUES (1,1,'Jon Niles');
/*!40000 ALTER TABLE `debitor` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `debitor_group`
--

DROP TABLE IF EXISTS `debitor_group`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `debitor_group` (
  `enterprise_id` smallint(5) unsigned NOT NULL,
  `id` smallint(5) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `account_id` int(10) unsigned NOT NULL,
  `location_id` mediumint(8) unsigned NOT NULL,
  `payment_id` tinyint(3) unsigned NOT NULL DEFAULT '3',
  `phone` varchar(10) DEFAULT '',
  `email` varchar(30) DEFAULT '',
  `note` text,
  `locked` tinyint(1) NOT NULL DEFAULT '0',
  `tax_id` smallint(5) unsigned DEFAULT NULL,
  `max_credit` mediumint(8) unsigned DEFAULT '0',
  `type_id` smallint(5) unsigned NOT NULL,
  `is_convention` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `enterprise_id` (`enterprise_id`),
  KEY `account_id` (`account_id`),
  KEY `location_id` (`location_id`),
  KEY `type_id` (`type_id`),
  CONSTRAINT `debitor_group_ibfk_1` FOREIGN KEY (`enterprise_id`) REFERENCES `enterprise` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `debitor_group_ibfk_2` FOREIGN KEY (`account_id`) REFERENCES `account` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `debitor_group_ibfk_3` FOREIGN KEY (`location_id`) REFERENCES `village` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `debitor_group_ibfk_4` FOREIGN KEY (`type_id`) REFERENCES `debitor_group_type` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `debitor_group`
--

LOCK TABLES `debitor_group` WRITE;
/*!40000 ALTER TABLE `debitor_group` DISABLE KEYS */;
INSERT INTO `debitor_group` VALUES (200,1,'Internal',146,1,1,'','','note 1',0,1,0,1,0),(200,2,'Normal Patient',147,1,1,'','','note 2',0,1,0,3,0),(200,3,'External',148,1,1,'','','note 3',0,1,0,4,0),(200,4,'Fr. Rienhart',149,1,1,'','','Convention 1',0,1,0,4,1),(200,5,'Eglise',150,1,1,'','','Convention 2',0,1,0,4,1);
/*!40000 ALTER TABLE `debitor_group` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `debitor_group_type`
--

DROP TABLE IF EXISTS `debitor_group_type`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `debitor_group_type` (
  `id` smallint(5) unsigned NOT NULL AUTO_INCREMENT,
  `type` varchar(80) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `debitor_group_type`
--

LOCK TABLES `debitor_group_type` WRITE;
/*!40000 ALTER TABLE `debitor_group_type` DISABLE KEYS */;
INSERT INTO `debitor_group_type` VALUES (1,'Employees'),(3,'Malades Ambulatoire'),(4,'Malades Interne');
/*!40000 ALTER TABLE `debitor_group_type` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `enterprise`
--

DROP TABLE IF EXISTS `enterprise`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `enterprise` (
  `id` smallint(5) unsigned NOT NULL AUTO_INCREMENT,
  `name` text NOT NULL,
  `abbr` varchar(50) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `email` varchar(70) DEFAULT NULL,
  `location_id` mediumint(8) unsigned NOT NULL,
  `logo` varchar(70) DEFAULT NULL,
  `currency_id` tinyint(3) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `location_id` (`location_id`),
  KEY `currency_id` (`currency_id`),
  CONSTRAINT `enterprise_ibfk_1` FOREIGN KEY (`currency_id`) REFERENCES `currency` (`id`),
  CONSTRAINT `enterprise_ibfk_2` FOREIGN KEY (`location_id`) REFERENCES `village` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=201 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `enterprise`
--

LOCK TABLES `enterprise` WRITE;
/*!40000 ALTER TABLE `enterprise` DISABLE KEYS */;
INSERT INTO `enterprise` VALUES (200,'Hopital Bon Berger','GSH','0825924377','cmk@tshikaji.cd',1,'/assets/logos/tsh.jpg',2);
/*!40000 ALTER TABLE `enterprise` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `exchange_rate`
--

DROP TABLE IF EXISTS `exchange_rate`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `exchange_rate` (
  `id` mediumint(8) unsigned NOT NULL AUTO_INCREMENT,
  `enterprise_currency_id` tinyint(3) unsigned NOT NULL,
  `foreign_currency_id` tinyint(3) unsigned NOT NULL,
  `rate` decimal(19,2) unsigned NOT NULL,
  `date` date NOT NULL,
  PRIMARY KEY (`id`),
  KEY `enterprise_currency_id` (`enterprise_currency_id`),
  KEY `foreign_currency_id` (`foreign_currency_id`),
  CONSTRAINT `exchange_rate_ibfk_1` FOREIGN KEY (`enterprise_currency_id`) REFERENCES `currency` (`id`),
  CONSTRAINT `exchange_rate_ibfk_2` FOREIGN KEY (`foreign_currency_id`) REFERENCES `currency` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `exchange_rate`
--

LOCK TABLES `exchange_rate` WRITE;
/*!40000 ALTER TABLE `exchange_rate` DISABLE KEYS */;
/*!40000 ALTER TABLE `exchange_rate` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `fiscal_year`
--

DROP TABLE IF EXISTS `fiscal_year`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `fiscal_year` (
  `enterprise_id` smallint(5) unsigned NOT NULL,
  `id` mediumint(8) unsigned NOT NULL AUTO_INCREMENT,
  `number_of_months` mediumint(8) unsigned NOT NULL,
  `fiscal_year_txt` text NOT NULL,
  `transaction_start_number` int(10) unsigned DEFAULT NULL,
  `transaction_stop_number` int(10) unsigned DEFAULT NULL,
  `fiscal_year_number` mediumint(8) unsigned DEFAULT NULL,
  `start_month` int(10) unsigned NOT NULL,
  `start_year` int(10) unsigned NOT NULL,
  `previous_fiscal_year` mediumint(8) unsigned DEFAULT NULL,
  `locked` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `enterprise_id` (`enterprise_id`),
  CONSTRAINT `fiscal_year_ibfk_1` FOREIGN KEY (`enterprise_id`) REFERENCES `enterprise` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fiscal_year`
--

LOCK TABLES `fiscal_year` WRITE;
/*!40000 ALTER TABLE `fiscal_year` DISABLE KEYS */;
/*!40000 ALTER TABLE `fiscal_year` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `general_ledger`
--

DROP TABLE IF EXISTS `general_ledger`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `general_ledger` (
  `id` mediumint(8) unsigned NOT NULL AUTO_INCREMENT,
  `enterprise_id` smallint(5) unsigned NOT NULL,
  `fiscal_year_id` mediumint(8) unsigned NOT NULL,
  `period_id` mediumint(8) unsigned NOT NULL,
  `trans_id` int(10) unsigned NOT NULL,
  `trans_date` date NOT NULL,
  `doc_num` int(10) unsigned DEFAULT NULL,
  `description` text,
  `account_id` int(10) unsigned NOT NULL,
  `debit` decimal(19,4) unsigned NOT NULL DEFAULT '0.0000',
  `credit` decimal(19,4) unsigned NOT NULL DEFAULT '0.0000',
  `debit_equiv` decimal(19,4) unsigned NOT NULL DEFAULT '0.0000',
  `credit_equiv` decimal(19,4) unsigned NOT NULL DEFAULT '0.0000',
  `currency_id` tinyint(3) unsigned NOT NULL,
  `deb_cred_id` varchar(45) DEFAULT NULL,
  `deb_cred_type` char(1) DEFAULT NULL,
  `inv_po_id` varchar(45) DEFAULT NULL,
  `comment` text,
  `cost_ctrl_id` varchar(10) DEFAULT NULL,
  `origin_id` tinyint(3) unsigned NOT NULL,
  `user_id` smallint(5) unsigned NOT NULL,
  `session_id` int(10) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `enterprise_id` (`enterprise_id`),
  KEY `fiscal_year_id` (`fiscal_year_id`),
  KEY `period_id` (`period_id`),
  KEY `origin_id` (`origin_id`),
  KEY `currency_id` (`currency_id`),
  KEY `user_id` (`user_id`),
  KEY `session_id` (`session_id`),
  CONSTRAINT `general_ledger_ibfk_1` FOREIGN KEY (`fiscal_year_id`) REFERENCES `fiscal_year` (`id`),
  CONSTRAINT `general_ledger_ibfk_2` FOREIGN KEY (`period_id`) REFERENCES `period` (`id`),
  CONSTRAINT `general_ledger_ibfk_3` FOREIGN KEY (`origin_id`) REFERENCES `transaction_type` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `general_ledger_ibfk_4` FOREIGN KEY (`enterprise_id`) REFERENCES `enterprise` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `general_ledger_ibfk_5` FOREIGN KEY (`currency_id`) REFERENCES `currency` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `general_ledger_ibfk_6` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `general_ledger_ibfk_7` FOREIGN KEY (`session_id`) REFERENCES `posting_session` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `general_ledger`
--

LOCK TABLES `general_ledger` WRITE;
/*!40000 ALTER TABLE `general_ledger` DISABLE KEYS */;
/*!40000 ALTER TABLE `general_ledger` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `group_invoice`
--

DROP TABLE IF EXISTS `group_invoice`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `group_invoice` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `enterprise_id` smallint(5) unsigned NOT NULL,
  `debitor_id` int(10) unsigned NOT NULL,
  `group_id` smallint(5) unsigned NOT NULL,
  `note` text,
  `authorized_by` varchar(80) NOT NULL,
  `date` date NOT NULL,
  `total` decimal(14,4) NOT NULL DEFAULT '0.0000',
  PRIMARY KEY (`id`),
  KEY `debitor_id` (`debitor_id`),
  KEY `enterprise_id` (`enterprise_id`),
  KEY `group_id` (`group_id`),
  CONSTRAINT `group_invoice_ibfk_1` FOREIGN KEY (`debitor_id`) REFERENCES `debitor` (`id`),
  CONSTRAINT `group_invoice_ibfk_2` FOREIGN KEY (`enterprise_id`) REFERENCES `enterprise` (`id`),
  CONSTRAINT `group_invoice_ibfk_3` FOREIGN KEY (`group_id`) REFERENCES `debitor_group` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `group_invoice`
--

LOCK TABLES `group_invoice` WRITE;
/*!40000 ALTER TABLE `group_invoice` DISABLE KEYS */;
/*!40000 ALTER TABLE `group_invoice` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `group_invoice_item`
--

DROP TABLE IF EXISTS `group_invoice_item`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `group_invoice_item` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `payment_id` int(10) unsigned NOT NULL,
  `invoice_id` int(10) unsigned NOT NULL,
  `cost` decimal(16,4) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `payment_id` (`payment_id`),
  KEY `invoice_id` (`invoice_id`),
  CONSTRAINT `group_invoice_item_ibfk_1` FOREIGN KEY (`payment_id`) REFERENCES `group_invoice` (`id`) ON DELETE CASCADE,
  CONSTRAINT `group_invoice_item_ibfk_2` FOREIGN KEY (`invoice_id`) REFERENCES `sale` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `group_invoice_item`
--

LOCK TABLES `group_invoice_item` WRITE;
/*!40000 ALTER TABLE `group_invoice_item` DISABLE KEYS */;
/*!40000 ALTER TABLE `group_invoice_item` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inv_detail`
--

DROP TABLE IF EXISTS `inv_detail`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `inv_detail` (
  `id` int(10) unsigned NOT NULL,
  `inv_id` int(10) unsigned NOT NULL,
  `serial_number` text,
  `lot_number` text,
  `delivery_date` date DEFAULT NULL,
  `po_id` int(10) unsigned NOT NULL,
  `expiration_date` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `inv_id` (`inv_id`),
  KEY `po_id` (`po_id`),
  CONSTRAINT `inv_detail_ibfk_1` FOREIGN KEY (`inv_id`) REFERENCES `inventory` (`id`),
  CONSTRAINT `inv_detail_ibfk_2` FOREIGN KEY (`po_id`) REFERENCES `purchase` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inv_detail`
--

LOCK TABLES `inv_detail` WRITE;
/*!40000 ALTER TABLE `inv_detail` DISABLE KEYS */;
/*!40000 ALTER TABLE `inv_detail` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inv_group`
--

DROP TABLE IF EXISTS `inv_group`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `inv_group` (
  `id` smallint(5) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `symbol` char(1) NOT NULL,
  `sales_account` mediumint(8) unsigned NOT NULL,
  `cogs_account` mediumint(8) unsigned DEFAULT NULL,
  `stock_account` mediumint(8) unsigned DEFAULT NULL,
  `tax_account` mediumint(8) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inv_group`
--

LOCK TABLES `inv_group` WRITE;
/*!40000 ALTER TABLE `inv_group` DISABLE KEYS */;
INSERT INTO `inv_group` VALUES (1,'Services','S',92,NULL,NULL,NULL),(2,'Medicines','M',92,NULL,NULL,NULL),(3,'Surgery','C',94,NULL,NULL,NULL),(4,'Fiches','F',93,NULL,NULL,NULL),(5,'Discount','D',351,NULL,NULL,NULL);
/*!40000 ALTER TABLE `inv_group` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inv_type`
--

DROP TABLE IF EXISTS `inv_type`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `inv_type` (
  `id` tinyint(3) unsigned NOT NULL,
  `text` varchar(150) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inv_type`
--

LOCK TABLES `inv_type` WRITE;
/*!40000 ALTER TABLE `inv_type` DISABLE KEYS */;
INSERT INTO `inv_type` VALUES (0,'Article'),(1,'Assembly'),(2,'Service'),(3,'Discount');
/*!40000 ALTER TABLE `inv_type` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inv_unit`
--

DROP TABLE IF EXISTS `inv_unit`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `inv_unit` (
  `id` smallint(5) unsigned NOT NULL AUTO_INCREMENT,
  `text` varchar(100) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inv_unit`
--

LOCK TABLES `inv_unit` WRITE;
/*!40000 ALTER TABLE `inv_unit` DISABLE KEYS */;
INSERT INTO `inv_unit` VALUES (1,'Act'),(2,'Pallet'),(3,'Pill'),(4,'Box'),(5,'Lot');
/*!40000 ALTER TABLE `inv_unit` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inventory`
--

DROP TABLE IF EXISTS `inventory`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `inventory` (
  `enterprise_id` smallint(5) unsigned NOT NULL,
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `code` varchar(10) NOT NULL,
  `text` text,
  `price` decimal(10,2) unsigned NOT NULL DEFAULT '0.00',
  `group_id` smallint(5) unsigned NOT NULL,
  `unit_id` smallint(5) unsigned DEFAULT NULL,
  `unit_weight` mediumint(9) DEFAULT '0',
  `unit_volume` mediumint(9) DEFAULT '0',
  `stock` int(10) unsigned NOT NULL DEFAULT '0',
  `stock_max` int(10) unsigned NOT NULL DEFAULT '0',
  `stock_min` int(10) unsigned NOT NULL DEFAULT '0',
  `type_id` tinyint(3) unsigned NOT NULL DEFAULT '0',
  `consumable` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  KEY `enterprise_id` (`enterprise_id`),
  KEY `group_id` (`group_id`),
  KEY `unit_id` (`unit_id`),
  KEY `type_id` (`type_id`),
  CONSTRAINT `inventory_ibfk_1` FOREIGN KEY (`enterprise_id`) REFERENCES `enterprise` (`id`),
  CONSTRAINT `inventory_ibfk_2` FOREIGN KEY (`group_id`) REFERENCES `inv_group` (`id`),
  CONSTRAINT `inventory_ibfk_3` FOREIGN KEY (`unit_id`) REFERENCES `inv_unit` (`id`),
  CONSTRAINT `inventory_ibfk_4` FOREIGN KEY (`type_id`) REFERENCES `inv_type` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inventory`
--

LOCK TABLES `inventory` WRITE;
/*!40000 ALTER TABLE `inventory` DISABLE KEYS */;
INSERT INTO `inventory` VALUES (200,1,'CHCRAN','Craniotomie',21.00,1,1,0,0,0,0,0,2,0),(200,2,'CHGLOB','Goitre Lobectomie/Hemithyroidect',20.00,1,1,0,0,0,0,0,2,0),(200,3,'CHGTHY','Goitre Thyroidectomie Sobtotale',18.00,1,1,0,0,0,0,0,2,0),(200,4,'CHEXKY','Excision De Kyste Thyroiglosse',17.50,1,1,0,0,0,0,0,2,0),(200,5,'CHPASU','Parotidectomie Superficielle',16.00,1,1,0,0,0,0,0,2,0),(200,6,'CHTRAC','Trachectome',25.00,1,1,0,0,0,0,0,2,0),(200,7,'EXKYSB','Kyste Sublingual',23.00,1,1,0,0,0,0,0,2,0),(200,8,'EXKYPB','Petite Kyste De La Bouche',32.00,1,1,0,0,0,0,0,2,0),(200,9,'FCEMPL','Fiches employee',4.00,4,1,0,0,0,0,0,0,0),(200,10,'FCINFA','Fiches Infante',4.00,4,1,0,0,0,0,0,0,0),(200,11,'FCADUL','Fiches Adulte',8.00,4,1,0,0,0,0,0,0,0),(200,12,'DNT','Enterprise Level Discount',0.00,5,1,0,0,0,0,0,3,0);
/*!40000 ALTER TABLE `inventory` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `journal_log`
--

DROP TABLE IF EXISTS `journal_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `journal_log` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `transaction_id` int(10) unsigned NOT NULL,
  `note` text,
  `date` date NOT NULL,
  `user_id` smallint(5) unsigned NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `journal_log`
--

LOCK TABLES `journal_log` WRITE;
/*!40000 ALTER TABLE `journal_log` DISABLE KEYS */;
/*!40000 ALTER TABLE `journal_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `patient`
--

DROP TABLE IF EXISTS `patient`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `patient` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `debitor_id` int(10) unsigned NOT NULL,
  `creditor_id` int(10) unsigned DEFAULT NULL,
  `first_name` varchar(150) NOT NULL,
  `last_name` varchar(150) NOT NULL,
  `dob` date DEFAULT NULL,
  `parent_name` varchar(150) DEFAULT NULL,
  `sex` char(1) NOT NULL,
  `religion` varchar(50) DEFAULT NULL,
  `marital_status` varchar(50) DEFAULT NULL,
  `phone` varchar(12) DEFAULT NULL,
  `email` varchar(20) DEFAULT NULL,
  `addr_1` varchar(100) DEFAULT NULL,
  `addr_2` varchar(100) DEFAULT NULL,
  `origin_location_id` mediumint(8) unsigned NOT NULL,
  `current_location_id` mediumint(8) unsigned NOT NULL,
  `registration_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `creditor_id` (`creditor_id`),
  KEY `first_name` (`first_name`),
  KEY `debitor_id` (`debitor_id`),
  KEY `origin_location_id` (`origin_location_id`),
  KEY `current_location_id` (`current_location_id`),
  CONSTRAINT `patient_ibfk_1` FOREIGN KEY (`debitor_id`) REFERENCES `debitor` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `patient_ibfk_2` FOREIGN KEY (`current_location_id`) REFERENCES `village` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `patient_ibfk_3` FOREIGN KEY (`origin_location_id`) REFERENCES `village` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `patient`
--

LOCK TABLES `patient` WRITE;
/*!40000 ALTER TABLE `patient` DISABLE KEYS */;
INSERT INTO `patient` VALUES (1,1,NULL,'Jon','Niles','1992-06-07',NULL,'M',NULL,NULL,NULL,NULL,NULL,NULL,1,1,'2014-02-14 14:23:53');
/*!40000 ALTER TABLE `patient` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `patient_group`
--

DROP TABLE IF EXISTS `patient_group`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `patient_group` (
  `enterprise_id` smallint(5) unsigned NOT NULL,
  `id` mediumint(8) unsigned NOT NULL AUTO_INCREMENT,
  `price_list_id` smallint(5) unsigned NOT NULL,
  `name` varchar(60) NOT NULL,
  `note` text,
  PRIMARY KEY (`id`),
  KEY `enterprise_id` (`enterprise_id`),
  KEY `price_list_id` (`price_list_id`),
  CONSTRAINT `patient_group_ibfk_1` FOREIGN KEY (`enterprise_id`) REFERENCES `enterprise` (`id`),
  CONSTRAINT `patient_group_ibfk_2` FOREIGN KEY (`price_list_id`) REFERENCES `price_list` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `patient_group`
--

LOCK TABLES `patient_group` WRITE;
/*!40000 ALTER TABLE `patient_group` DISABLE KEYS */;
INSERT INTO `patient_group` VALUES (200,1,1,'HIV','Funds for patients provided by societe x');
/*!40000 ALTER TABLE `patient_group` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payment`
--

DROP TABLE IF EXISTS `payment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `payment` (
  `id` tinyint(3) unsigned NOT NULL AUTO_INCREMENT,
  `days` smallint(5) unsigned DEFAULT '0',
  `months` mediumint(8) unsigned DEFAULT '0',
  `text` varchar(50) NOT NULL,
  `note` text,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payment`
--

LOCK TABLES `payment` WRITE;
/*!40000 ALTER TABLE `payment` DISABLE KEYS */;
/*!40000 ALTER TABLE `payment` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `period`
--

DROP TABLE IF EXISTS `period`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `period` (
  `id` mediumint(8) unsigned NOT NULL AUTO_INCREMENT,
  `fiscal_year_id` mediumint(8) unsigned NOT NULL,
  `period_number` smallint(5) unsigned NOT NULL,
  `period_start` date NOT NULL,
  `period_stop` date NOT NULL,
  `locked` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `fiscal_year_id` (`fiscal_year_id`),
  CONSTRAINT `period_ibfk_1` FOREIGN KEY (`fiscal_year_id`) REFERENCES `fiscal_year` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `period`
--

LOCK TABLES `period` WRITE;
/*!40000 ALTER TABLE `period` DISABLE KEYS */;
/*!40000 ALTER TABLE `period` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `period_total`
--

DROP TABLE IF EXISTS `period_total`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `period_total` (
  `enterprise_id` smallint(5) unsigned NOT NULL,
  `fiscal_year_id` mediumint(8) unsigned NOT NULL,
  `period_id` mediumint(8) unsigned NOT NULL,
  `account_id` int(10) unsigned NOT NULL,
  `credit` decimal(19,2) unsigned DEFAULT NULL,
  `debit` decimal(19,2) unsigned DEFAULT NULL,
  `locked` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`enterprise_id`,`fiscal_year_id`,`period_id`,`account_id`),
  KEY `fiscal_year_id` (`fiscal_year_id`),
  KEY `account_id` (`account_id`),
  KEY `enterprise_id` (`enterprise_id`),
  KEY `period_id` (`period_id`),
  CONSTRAINT `period_total_ibfk_1` FOREIGN KEY (`fiscal_year_id`) REFERENCES `fiscal_year` (`id`),
  CONSTRAINT `period_total_ibfk_2` FOREIGN KEY (`account_id`) REFERENCES `account` (`id`),
  CONSTRAINT `period_total_ibfk_3` FOREIGN KEY (`enterprise_id`) REFERENCES `enterprise` (`id`),
  CONSTRAINT `period_total_ibfk_4` FOREIGN KEY (`period_id`) REFERENCES `period` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `period_total`
--

LOCK TABLES `period_total` WRITE;
/*!40000 ALTER TABLE `period_total` DISABLE KEYS */;
/*!40000 ALTER TABLE `period_total` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `permission`
--

DROP TABLE IF EXISTS `permission`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `permission` (
  `id` mediumint(8) unsigned NOT NULL AUTO_INCREMENT,
  `id_unit` smallint(5) unsigned NOT NULL,
  `id_user` smallint(5) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `id_unit` (`id_unit`),
  KEY `id_user` (`id_user`),
  CONSTRAINT `permission_ibfk_1` FOREIGN KEY (`id_unit`) REFERENCES `unit` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `permission_ibfk_2` FOREIGN KEY (`id_user`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=139 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permission`
--

LOCK TABLES `permission` WRITE;
/*!40000 ALTER TABLE `permission` DISABLE KEYS */;
INSERT INTO `permission` VALUES (1,1,2),(2,2,2),(3,4,2),(4,9,2),(5,6,2),(6,5,2),(7,8,2),(8,11,2),(9,10,2),(10,21,2),(11,30,2),(12,31,2),(13,34,2),(14,35,2),(15,33,2),(16,36,2),(17,37,2),(18,38,2),(19,39,2),(20,40,2),(21,41,2),(22,44,2),(23,45,2),(24,46,2),(25,47,2),(26,48,2),(27,49,2),(28,50,2),(29,51,2),(30,52,2),(31,53,2),(32,54,2),(33,55,2),(34,56,2),(35,57,2),(36,60,2),(37,61,2),(38,62,2),(39,63,2),(40,64,2),(41,65,2),(42,4,3),(43,6,3),(44,30,3),(45,31,3),(46,34,3),(47,35,3),(48,33,3),(49,36,3),(50,37,3),(51,38,3),(52,39,3),(53,40,3),(54,9,3),(55,41,3),(56,1,3),(57,43,3),(58,45,3),(59,46,3),(60,47,3),(61,48,3),(62,49,3),(63,50,3),(64,51,3),(65,1,1),(66,2,1),(67,4,1),(68,9,1),(69,6,1),(70,5,1),(71,8,1),(72,11,1),(73,10,1),(74,21,1),(75,30,1),(76,31,1),(77,34,1),(78,35,1),(79,33,1),(80,36,1),(81,37,1),(82,38,1),(83,39,1),(84,40,1),(85,41,1),(86,43,1),(87,45,1),(88,46,1),(89,47,1),(90,48,1),(91,49,1),(92,50,1),(93,51,1),(94,52,1),(95,53,1),(96,54,1),(97,55,1),(98,56,1),(99,57,1),(100,58,1),(101,60,1),(102,61,1),(103,62,1),(104,64,1),(105,65,1),(106,1,13),(107,2,13),(108,4,13),(109,9,13),(110,6,13),(111,5,13),(112,8,13),(113,11,13),(114,10,13),(115,21,13),(116,30,13),(117,31,13),(118,34,13),(119,35,13),(120,33,13),(121,36,13),(122,37,13),(123,38,13),(124,39,13),(125,40,13),(126,41,13),(127,43,13),(128,45,13),(129,46,13),(130,47,13),(131,48,13),(132,49,13),(133,50,13),(134,51,13),(135,52,13),(136,54,13),(137,43,2),(138,58,2);
/*!40000 ALTER TABLE `permission` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `posting_journal`
--

DROP TABLE IF EXISTS `posting_journal`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `posting_journal` (
  `id` mediumint(8) unsigned NOT NULL AUTO_INCREMENT,
  `enterprise_id` smallint(5) unsigned NOT NULL,
  `fiscal_year_id` mediumint(8) unsigned DEFAULT NULL,
  `period_id` mediumint(8) unsigned DEFAULT NULL,
  `trans_id` int(10) unsigned NOT NULL,
  `trans_date` date NOT NULL,
  `doc_num` int(10) unsigned DEFAULT NULL,
  `description` text,
  `account_id` int(10) unsigned NOT NULL,
  `debit` decimal(19,4) unsigned NOT NULL DEFAULT '0.0000',
  `credit` decimal(19,4) unsigned NOT NULL DEFAULT '0.0000',
  `debit_equiv` decimal(19,4) unsigned NOT NULL DEFAULT '0.0000',
  `credit_equiv` decimal(19,4) unsigned NOT NULL DEFAULT '0.0000',
  `currency_id` tinyint(3) unsigned NOT NULL,
  `deb_cred_id` varchar(45) DEFAULT NULL,
  `deb_cred_type` char(1) DEFAULT NULL,
  `inv_po_id` varchar(45) DEFAULT NULL,
  `comment` text,
  `cost_ctrl_id` varchar(10) DEFAULT NULL,
  `origin_id` tinyint(3) unsigned NOT NULL,
  `user_id` smallint(5) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `enterprise_id` (`enterprise_id`),
  KEY `fiscal_year_id` (`fiscal_year_id`),
  KEY `period_id` (`period_id`),
  KEY `origin_id` (`origin_id`),
  KEY `currency_id` (`currency_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `posting_journal_ibfk_1` FOREIGN KEY (`fiscal_year_id`) REFERENCES `fiscal_year` (`id`),
  CONSTRAINT `posting_journal_ibfk_2` FOREIGN KEY (`period_id`) REFERENCES `period` (`id`),
  CONSTRAINT `posting_journal_ibfk_3` FOREIGN KEY (`origin_id`) REFERENCES `transaction_type` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `posting_journal_ibfk_4` FOREIGN KEY (`enterprise_id`) REFERENCES `enterprise` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `posting_journal_ibfk_5` FOREIGN KEY (`currency_id`) REFERENCES `currency` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `posting_journal_ibfk_6` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `posting_journal`
--

LOCK TABLES `posting_journal` WRITE;
/*!40000 ALTER TABLE `posting_journal` DISABLE KEYS */;
/*!40000 ALTER TABLE `posting_journal` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `posting_session`
--

DROP TABLE IF EXISTS `posting_session`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `posting_session` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` smallint(5) unsigned NOT NULL,
  `date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `posting_session_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `posting_session`
--

LOCK TABLES `posting_session` WRITE;
/*!40000 ALTER TABLE `posting_session` DISABLE KEYS */;
/*!40000 ALTER TABLE `posting_session` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `price_list`
--

DROP TABLE IF EXISTS `price_list`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `price_list` (
  `enterprise_id` smallint(5) unsigned NOT NULL,
  `id` smallint(5) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `discount` decimal(19,2) unsigned NOT NULL DEFAULT '0.00',
  `note` text,
  PRIMARY KEY (`id`),
  KEY `enterprise_id` (`enterprise_id`),
  CONSTRAINT `price_list_ibfk_1` FOREIGN KEY (`enterprise_id`) REFERENCES `enterprise` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `price_list`
--

LOCK TABLES `price_list` WRITE;
/*!40000 ALTER TABLE `price_list` DISABLE KEYS */;
INSERT INTO `price_list` VALUES (200,1,'HIV',20.00,'Reducded cost for HIV patients');
/*!40000 ALTER TABLE `price_list` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `price_list_detail`
--

DROP TABLE IF EXISTS `price_list_detail`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `price_list_detail` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `list_id` smallint(5) unsigned NOT NULL,
  `inventory_id` int(10) unsigned NOT NULL,
  `amount` decimal(19,2) unsigned NOT NULL DEFAULT '0.00',
  `percent` tinyint(1) NOT NULL DEFAULT '0',
  `note` text,
  PRIMARY KEY (`id`),
  KEY `inventory_id` (`inventory_id`),
  KEY `list_id` (`list_id`),
  CONSTRAINT `price_list_detail_ibfk_1` FOREIGN KEY (`inventory_id`) REFERENCES `inventory` (`id`) ON DELETE CASCADE,
  CONSTRAINT `price_list_detail_ibfk_2` FOREIGN KEY (`list_id`) REFERENCES `price_list` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `price_list_detail`
--

LOCK TABLES `price_list_detail` WRITE;
/*!40000 ALTER TABLE `price_list_detail` DISABLE KEYS */;
/*!40000 ALTER TABLE `price_list_detail` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `province`
--

DROP TABLE IF EXISTS `province`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `province` (
  `id` mediumint(8) unsigned NOT NULL AUTO_INCREMENT,
  `name` text,
  `country_id` smallint(5) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `country_id` (`country_id`),
  CONSTRAINT `province_ibfk_1` FOREIGN KEY (`country_id`) REFERENCES `country` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `province`
--

LOCK TABLES `province` WRITE;
/*!40000 ALTER TABLE `province` DISABLE KEYS */;
INSERT INTO `province` VALUES (1,'Bas Congo',52),(2,'Bandundu',52),(3,'Kasai Oriental',52),(4,'Katanga',52),(5,'Equateur',52),(6,'Kasai Occidental',52),(7,'Kinshasa',52),(8,'Nord Kivu',52),(9,'Sud Kivu',52),(10,'Province Oriental',52),(11,'Maniema',52);
/*!40000 ALTER TABLE `province` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `purchase`
--

DROP TABLE IF EXISTS `purchase`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `purchase` (
  `id` int(10) unsigned NOT NULL,
  `enterprise_id` smallint(5) unsigned NOT NULL,
  `cost` decimal(19,2) unsigned NOT NULL DEFAULT '0.00',
  `currency_id` tinyint(3) unsigned NOT NULL,
  `creditor_id` int(10) unsigned NOT NULL,
  `purchaser_id` smallint(5) unsigned NOT NULL,
  `discount` mediumint(8) unsigned DEFAULT '0',
  `invoice_date` date NOT NULL,
  `note` text,
  `posted` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `enterprise_id` (`enterprise_id`),
  KEY `creditor_id` (`creditor_id`),
  KEY `purchaser_id` (`purchaser_id`),
  CONSTRAINT `purchase_ibfk_1` FOREIGN KEY (`enterprise_id`) REFERENCES `enterprise` (`id`),
  CONSTRAINT `purchase_ibfk_2` FOREIGN KEY (`creditor_id`) REFERENCES `creditor` (`id`),
  CONSTRAINT `purchase_ibfk_3` FOREIGN KEY (`purchaser_id`) REFERENCES `user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `purchase`
--

LOCK TABLES `purchase` WRITE;
/*!40000 ALTER TABLE `purchase` DISABLE KEYS */;
/*!40000 ALTER TABLE `purchase` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `purchase_item`
--

DROP TABLE IF EXISTS `purchase_item`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `purchase_item` (
  `purchase_id` int(10) unsigned NOT NULL,
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `inventory_id` int(10) unsigned NOT NULL,
  `quantity` int(10) unsigned DEFAULT '0',
  `unit_price` decimal(10,2) unsigned NOT NULL,
  `total` decimal(10,2) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `purchase_id` (`purchase_id`),
  KEY `inventory_id` (`inventory_id`),
  CONSTRAINT `purchase_item_ibfk_1` FOREIGN KEY (`purchase_id`) REFERENCES `purchase` (`id`) ON DELETE CASCADE,
  CONSTRAINT `purchase_item_ibfk_2` FOREIGN KEY (`inventory_id`) REFERENCES `inventory` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `purchase_item`
--

LOCK TABLES `purchase_item` WRITE;
/*!40000 ALTER TABLE `purchase_item` DISABLE KEYS */;
/*!40000 ALTER TABLE `purchase_item` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sale`
--

DROP TABLE IF EXISTS `sale`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sale` (
  `enterprise_id` smallint(5) unsigned NOT NULL,
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `cost` decimal(19,2) unsigned NOT NULL,
  `currency_id` tinyint(3) unsigned NOT NULL,
  `debitor_id` int(10) unsigned NOT NULL,
  `seller_id` smallint(5) unsigned NOT NULL DEFAULT '0',
  `discount` mediumint(8) unsigned DEFAULT '0',
  `invoice_date` date NOT NULL,
  `note` text,
  `posted` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `enterprise_id` (`enterprise_id`),
  KEY `debitor_id` (`debitor_id`),
  KEY `currency_id` (`currency_id`),
  CONSTRAINT `sale_ibfk_1` FOREIGN KEY (`enterprise_id`) REFERENCES `enterprise` (`id`),
  CONSTRAINT `sale_ibfk_2` FOREIGN KEY (`debitor_id`) REFERENCES `debitor` (`id`),
  CONSTRAINT `sale_ibfk_3` FOREIGN KEY (`currency_id`) REFERENCES `currency` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sale`
--

LOCK TABLES `sale` WRITE;
/*!40000 ALTER TABLE `sale` DISABLE KEYS */;
/*!40000 ALTER TABLE `sale` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sale_item`
--

DROP TABLE IF EXISTS `sale_item`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sale_item` (
  `sale_id` int(10) unsigned NOT NULL,
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `inventory_id` int(10) unsigned NOT NULL,
  `quantity` int(10) unsigned DEFAULT '0',
  `inventory_price` decimal(19,2) DEFAULT NULL,
  `transaction_price` decimal(19,2) NOT NULL,
  `debit` decimal(19,2) NOT NULL DEFAULT '0.00',
  `credit` decimal(19,2) NOT NULL DEFAULT '0.00',
  PRIMARY KEY (`id`),
  KEY `sale_id` (`sale_id`),
  KEY `inventory_id` (`inventory_id`),
  CONSTRAINT `sale_item_ibfk_1` FOREIGN KEY (`sale_id`) REFERENCES `sale` (`id`) ON DELETE CASCADE,
  CONSTRAINT `sale_item_ibfk_2` FOREIGN KEY (`inventory_id`) REFERENCES `inventory` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sale_item`
--

LOCK TABLES `sale_item` WRITE;
/*!40000 ALTER TABLE `sale_item` DISABLE KEYS */;
/*!40000 ALTER TABLE `sale_item` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sector`
--

DROP TABLE IF EXISTS `sector`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sector` (
  `id` mediumint(8) unsigned NOT NULL AUTO_INCREMENT,
  `name` text,
  `province_id` mediumint(8) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `province_id` (`province_id`),
  CONSTRAINT `sector_ibfk_1` FOREIGN KEY (`province_id`) REFERENCES `province` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sector`
--

LOCK TABLES `sector` WRITE;
/*!40000 ALTER TABLE `sector` DISABLE KEYS */;
INSERT INTO `sector` VALUES (1,'Kilunda',2),(2,'Kwilu',2);
/*!40000 ALTER TABLE `sector` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `supplier`
--

DROP TABLE IF EXISTS `supplier`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `supplier` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `creditor_id` int(10) unsigned NOT NULL,
  `name` varchar(45) NOT NULL,
  `address_1` text,
  `address_2` text,
  `location_id` mediumint(8) unsigned NOT NULL,
  `email` varchar(45) DEFAULT NULL,
  `fax` varchar(45) DEFAULT NULL,
  `note` varchar(50) DEFAULT NULL,
  `phone` varchar(15) DEFAULT NULL,
  `international` tinyint(1) NOT NULL DEFAULT '0',
  `locked` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `creditor_id` (`creditor_id`),
  KEY `location_id` (`location_id`),
  CONSTRAINT `supplier_ibfk_1` FOREIGN KEY (`location_id`) REFERENCES `village` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `supplier_ibfk_2` FOREIGN KEY (`creditor_id`) REFERENCES `creditor` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `supplier`
--

LOCK TABLES `supplier` WRITE;
/*!40000 ALTER TABLE `supplier` DISABLE KEYS */;
/*!40000 ALTER TABLE `supplier` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `transaction_type`
--

DROP TABLE IF EXISTS `transaction_type`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `transaction_type` (
  `id` tinyint(3) unsigned NOT NULL AUTO_INCREMENT,
  `service_txt` varchar(45) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `transaction_type`
--

LOCK TABLES `transaction_type` WRITE;
/*!40000 ALTER TABLE `transaction_type` DISABLE KEYS */;
INSERT INTO `transaction_type` VALUES (1,'cash'),(2,'sale'),(3,'purchase'),(4,'journal'),(5,'group_invoice'),(6,'credit_note');
/*!40000 ALTER TABLE `transaction_type` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `unit`
--

DROP TABLE IF EXISTS `unit`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `unit` (
  `id` smallint(5) unsigned NOT NULL,
  `name` varchar(30) NOT NULL,
  `description` text NOT NULL,
  `parent` smallint(6) DEFAULT '0',
  `has_children` tinyint(1) NOT NULL DEFAULT '0',
  `url` tinytext,
  `p_url` tinytext,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `unit`
--

LOCK TABLES `unit` WRITE;
/*!40000 ALTER TABLE `unit` DISABLE KEYS */;
INSERT INTO `unit` VALUES (0,'Root','The unseen root node',NULL,1,'',''),(1,'Admin','The Administration Super-Category',0,1,'',''),(2,'Enterprise','Manage the registered enterprises from here',1,0,'/partials/enterprise/','/enterprise'),(4,'Users & Permissions','Manage user privileges and permissions',1,0,'/partials/permission','/permission'),(5,'Finance','The Finance Super-Category',0,1,'',''),(6,'Account','Chart of Accounts management',1,0,'/partials/accounts/create_account','/create_account'),(8,'Budgeting','Plan your next move',0,10,'/partials/budgeting',''),(9,'Posting Journal','Daily Log',5,0,'/partials/postingjournal/','/posting_journal'),(10,'Reports','Do stuff and tell people about it',0,1,'/units/reports/','reports/summary'),(11,'Inventory','The Inventory Super-Category',0,1,'',''),(21,'Hospital','The Hospital Super-Category',0,1,'',''),(30,'Fiscal Year','Fiscal year configuration page',1,0,'/partials/fiscal','fiscal'),(31,'Patient Registration','Register patients',21,0,'/partials/patient','patient'),(33,'Patient Records','Search for patient',21,0,'/partials/patient_records/','patient_records/'),(34,'Sales','Create an invoice for a sale',5,0,'/partials/sales','sales/'),(35,'Sale Records','Search for a sale',5,0,'/partials/sale_records/','sale_records/'),(36,'Purchase Order','Create a new Purchase Order',11,0,'partials/inventory_purchase_order','inventory/purchase'),(37,'Budget by Account','Budgeting by account',8,0,'partials/budgeting','budgeting/'),(38,'Cash Box','Pay invoices',5,0,'/partials/cash','cash'),(39,'Register Stock','',11,0,'partials/inventory/register','inventory/register'),(40,'Register Supplier','',11,0,'partials/inventory/creditors','creditors'),(41,'Purchase Order Records','',5,0,'partials/purchase_records/','purchase_records/'),(43,'Finance','',10,0,'partials/reports/finance_report','reports/finance'),(44,'Balance vs. Budget','',10,0,'partials/reports/balance_budget','reports/balance_budget'),(45,'Price List','Configure price lists!',11,0,'partials/price_list','inventory/price_list'),(46,'Exchange Rate','Set todays exchange rate!',1,0,'partials/exchange_rate','exchange_rate'),(47,'Transaction Report','',10,0,'partials/reports/transaction_report','reports/transaction_report'),(48,'Creditor Groups','',1,0,'partials/creditor/group/creditor_group','creditors/creditor_group'),(49,'Debitor Groups','',1,0,'partials/debitor/debitor_group','debitor/debitor_group'),(50,'Inventory View','',11,0,'partials/inventory/view','inventory/view'),(51,'General Ledger','',10,0,'partials/reports/ledger/general_ledger','reports/ledger/general_ledger'),(52,'Location Manager','',1,0,'partials/location/location','location'),(53,'Account Balance Statement','',10,0,'partials/reports/account_balance/','reports/account_balance/'),(54,'Chart of Accounts','',10,0,'partials/reports/chartofaccounts/','reports/chart_of_accounts/'),(55,'Debitor Aging','',10,0,'partials/reports/debitor_aging/','reports/debitor_aging/'),(56,'Account Statement By Period','',10,0,'partials/reports/account_statement/','reports/account_statement/'),(57,'Income Expensive Balance','',10,0,'partials/reports/income_expensive/','reports/income_expensive/'),(58,'Credit Note','',5,0,'partials/credit_note/','credit_note/'),(60,'Patient Group Assigning','',21,0,'partials/patient_group_assign/','patient_group_assign/'),(61,'Patient Group','',1,0,'partials/patient_group/','patient_group/'),(62,'Accounting','',0,1,'',''),(63,'Cost Center Management','',62,0,'partials/cost_center/','cost_center/'),(64,'Group Invoicing','',5,0,'partials/group_invoice/','group_invoice/'),(65,'Currency','',1,0,'partials/currency/currency','/currency');
/*!40000 ALTER TABLE `unit` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user`
--

DROP TABLE IF EXISTS `user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user` (
  `id` smallint(5) unsigned NOT NULL AUTO_INCREMENT,
  `username` varchar(80) NOT NULL,
  `password` varchar(100) NOT NULL,
  `first` text NOT NULL,
  `last` text NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `logged_in` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user`
--

LOCK TABLES `user` WRITE;
/*!40000 ALTER TABLE `user` DISABLE KEYS */;
INSERT INTO `user` VALUES (1,'jniles','1','Jonathan','Niles','jonathanwniles@gmail.com',0),(2,'delva','1','Dedrick','kitamuka','kitamuka@gmail.com',0),(3,'sthreshley','ima','Larry','Sthreshley','example@email.me',0),(13,'sfount','1','Steven','Fountain','StevenFountain@live.co.uk',0);
/*!40000 ALTER TABLE `user` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `village`
--

DROP TABLE IF EXISTS `village`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `village` (
  `id` mediumint(8) unsigned NOT NULL AUTO_INCREMENT,
  `name` text,
  `sector_id` mediumint(8) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `sector_id` (`sector_id`),
  CONSTRAINT `village_ibfk_1` FOREIGN KEY (`sector_id`) REFERENCES `sector` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `village`
--

LOCK TABLES `village` WRITE;
/*!40000 ALTER TABLE `village` DISABLE KEYS */;
INSERT INTO `village` VALUES (1,'Vanga',2),(2,'Bulungu',2),(3,'Songo',1),(4,'Lusekele',1);
/*!40000 ALTER TABLE `village` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2014-02-14 16:49:37
