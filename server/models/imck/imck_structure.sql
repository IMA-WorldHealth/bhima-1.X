/*
SQLyog Ultimate v11.11 (32 bit)
MySQL - 5.6.12 : Database - bhima
*********************************************************************
*/

/*!40101 SET NAMES utf8 */;

/*!40101 SET SQL_MODE=''*/;

/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
CREATE DATABASE /*!32312 IF NOT EXISTS*/`bhima` /*!40100 DEFAULT CHARACTER SET utf8 */;

USE `bhima`;

/*Table structure for table `account` */

DROP TABLE IF EXISTS `account`;

CREATE TABLE `account` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `account_type_id` mediumint(8) unsigned NOT NULL,
  `enterprise_id` smallint(5) unsigned NOT NULL,
  `account_number` int(11) NOT NULL,
  `account_txt` text,
  `parent` int(10) unsigned NOT NULL,
  `locked` tinyint(3) unsigned DEFAULT '0',
  `cc_id` smallint(6) DEFAULT NULL,
  `pc_id` smallint(6) DEFAULT NULL,
  `created` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `classe` int(11) DEFAULT NULL,
  `is_asset` tinyint(1) DEFAULT NULL,
  `is_ohada` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `account_type_id` (`account_type_id`),
  KEY `enterprise_id` (`enterprise_id`),
  KEY `cc_id` (`cc_id`),
  CONSTRAINT `account_ibfk_1` FOREIGN KEY (`account_type_id`) REFERENCES `account_type` (`id`),
  CONSTRAINT `account_ibfk_2` FOREIGN KEY (`enterprise_id`) REFERENCES `enterprise` (`id`),
  CONSTRAINT `account_ibfk_3` FOREIGN KEY (`cc_id`) REFERENCES `cost_center` (`id`),
  CONSTRAINT `account_ibfk_4` FOREIGN KEY (`account_type_id`) REFERENCES `account_type` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3577 DEFAULT CHARSET=latin1;

/*Table structure for table `account_type` */

DROP TABLE IF EXISTS `account_type`;

CREATE TABLE `account_type` (
  `id` mediumint(8) unsigned NOT NULL,
  `type` varchar(35) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

/*Table structure for table `assignation_patient` */

DROP TABLE IF EXISTS `assignation_patient`;

CREATE TABLE `assignation_patient` (
  `uuid` char(36) NOT NULL,
  `patient_group_uuid` char(36) NOT NULL,
  `patient_uuid` char(36) NOT NULL,
  PRIMARY KEY (`uuid`),
  KEY `patient_group_uuid` (`patient_group_uuid`),
  KEY `patient_uuid` (`patient_uuid`),
  CONSTRAINT `assignation_patient_ibfk_1` FOREIGN KEY (`patient_group_uuid`) REFERENCES `patient_group` (`uuid`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `assignation_patient_ibfk_2` FOREIGN KEY (`patient_uuid`) REFERENCES `patient` (`uuid`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

/*Table structure for table `beneficiary` */

DROP TABLE IF EXISTS `beneficiary`;

CREATE TABLE `beneficiary` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `text` varchar(50) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

/*Table structure for table `budget` */

DROP TABLE IF EXISTS `budget`;

CREATE TABLE `budget` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `account_id` int(10) unsigned NOT NULL DEFAULT '0',
  `period_id` mediumint(8) unsigned NOT NULL,
  `budget` decimal(10,4) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

/*Table structure for table `cash` */

DROP TABLE IF EXISTS `cash`;

CREATE TABLE `cash` (
  `project_id` smallint(5) unsigned NOT NULL,
  `reference` int(10) unsigned NOT NULL,
  `uuid` char(36) NOT NULL,
  `document_id` int(10) unsigned NOT NULL,
  `type` char(1) NOT NULL,
  `date` date NOT NULL,
  `debit_account` int(10) unsigned NOT NULL,
  `credit_account` int(10) unsigned NOT NULL,
  `deb_cred_uuid` char(36) NOT NULL,
  `deb_cred_type` varchar(1) NOT NULL,
  `currency_id` tinyint(3) unsigned NOT NULL,
  `cost` decimal(19,4) unsigned NOT NULL DEFAULT '0.0000',
  `user_id` smallint(5) unsigned NOT NULL,
  `cashbox_id` smallint(5) unsigned NOT NULL,
  `description` text,
  `is_caution` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`uuid`),
  KEY `reference` (`reference`),
  KEY `project_id` (`project_id`),
  KEY `currency_id` (`currency_id`),
  KEY `user_id` (`user_id`),
  KEY `debit_account` (`debit_account`),
  KEY `credit_account` (`credit_account`),
  CONSTRAINT `cash_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `project` (`id`),
  CONSTRAINT `cash_ibfk_2` FOREIGN KEY (`currency_id`) REFERENCES `currency` (`id`),
  CONSTRAINT `cash_ibfk_3` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`),
  CONSTRAINT `cash_ibfk_4` FOREIGN KEY (`debit_account`) REFERENCES `account` (`id`),
  CONSTRAINT `cash_ibfk_5` FOREIGN KEY (`credit_account`) REFERENCES `account` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

/*Table structure for table `cash_box` */

DROP TABLE IF EXISTS `cash_box`;

CREATE TABLE `cash_box` (
  `id` mediumint(8) unsigned NOT NULL AUTO_INCREMENT,
  `text` text NOT NULL,
  `project_id` smallint(5) unsigned NOT NULL,
  `is_auxillary` tinyint(1) NOT NULL,
  `is_bank` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `project_id` (`project_id`),
  CONSTRAINT `cash_box_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `project` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=latin1;

/*Table structure for table `cash_box_account_currency` */

DROP TABLE IF EXISTS `cash_box_account_currency`;

CREATE TABLE `cash_box_account_currency` (
  `id` mediumint(8) unsigned NOT NULL AUTO_INCREMENT,
  `currency_id` tinyint(3) unsigned NOT NULL,
  `cash_box_id` mediumint(8) unsigned NOT NULL,
  `account_id` int(10) unsigned DEFAULT NULL,
  `gain_exchange_account_id` int(10) unsigned DEFAULT '981',
  `loss_exchange_account_id` int(10) unsigned DEFAULT '718',
  `virement_account_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `currency_id` (`currency_id`),
  KEY `cash_box_id` (`cash_box_id`),
  KEY `account_id` (`account_id`),
  KEY `gain_exchange_account_id` (`gain_exchange_account_id`),
  KEY `loss_exchange_account_id` (`loss_exchange_account_id`),
  CONSTRAINT `cash_box_account_currency_ibfk_1` FOREIGN KEY (`currency_id`) REFERENCES `currency` (`id`),
  CONSTRAINT `cash_box_account_currency_ibfk_2` FOREIGN KEY (`cash_box_id`) REFERENCES `cash_box` (`id`),
  CONSTRAINT `cash_box_account_currency_ibfk_3` FOREIGN KEY (`account_id`) REFERENCES `account` (`id`),
  CONSTRAINT `cash_box_account_currency_ibfk_4` FOREIGN KEY (`gain_exchange_account_id`) REFERENCES `account` (`id`),
  CONSTRAINT `cash_box_account_currency_ibfk_5` FOREIGN KEY (`loss_exchange_account_id`) REFERENCES `account` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=latin1;

/*Table structure for table `cash_discard` */

DROP TABLE IF EXISTS `cash_discard`;

CREATE TABLE `cash_discard` (
  `project_id` smallint(5) unsigned NOT NULL,
  `reference` int(10) unsigned NOT NULL,
  `uuid` char(36) NOT NULL,
  `cost` decimal(19,4) unsigned NOT NULL,
  `debitor_uuid` char(36) NOT NULL,
  `cashier_id` smallint(5) unsigned NOT NULL DEFAULT '0',
  `cash_uuid` char(36) NOT NULL,
  `date` date NOT NULL,
  `description` text,
  `posted` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`uuid`),
  KEY `reference` (`reference`),
  KEY `project_id` (`project_id`),
  KEY `debitor_uuid` (`debitor_uuid`),
  KEY `cash_uuid` (`cash_uuid`),
  CONSTRAINT `cash_discard_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `project` (`id`),
  CONSTRAINT `cash_discard_ibfk_2` FOREIGN KEY (`debitor_uuid`) REFERENCES `debitor` (`uuid`),
  CONSTRAINT `cash_discard_ibfk_3` FOREIGN KEY (`cash_uuid`) REFERENCES `cash` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

/*Table structure for table `cash_item` */

DROP TABLE IF EXISTS `cash_item`;

CREATE TABLE `cash_item` (
  `uuid` char(36) NOT NULL,
  `cash_uuid` char(36) NOT NULL,
  `allocated_cost` decimal(19,4) unsigned NOT NULL DEFAULT '0.0000',
  `invoice_uuid` char(36) DEFAULT NULL,
  PRIMARY KEY (`uuid`),
  KEY `cash_uuid` (`cash_uuid`),
  CONSTRAINT `cash_item_ibfk_1` FOREIGN KEY (`cash_uuid`) REFERENCES `cash` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

/*Table structure for table `client` */

DROP TABLE IF EXISTS `client`;

CREATE TABLE `client` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `address` varchar(100) DEFAULT NULL,
  `debitor_uuid` char(36) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `debitor_uuid` (`debitor_uuid`),
  CONSTRAINT `client_ibfk_1` FOREIGN KEY (`debitor_uuid`) REFERENCES `debitor` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

/*Table structure for table `config_accounting` */

DROP TABLE IF EXISTS `config_accounting`;

CREATE TABLE `config_accounting` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `label` text,
  `account_id` int(10) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `account_id` (`account_id`),
  CONSTRAINT `config_accounting_ibfk_1` FOREIGN KEY (`account_id`) REFERENCES `account` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=latin1;

/*Table structure for table `config_cotisation` */

DROP TABLE IF EXISTS `config_cotisation`;

CREATE TABLE `config_cotisation` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `label` text,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

/*Table structure for table `config_cotisation_item` */

DROP TABLE IF EXISTS `config_cotisation_item`;

CREATE TABLE `config_cotisation_item` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `config_cotisation_id` int(10) unsigned NOT NULL,
  `cotisation_id` int(10) unsigned NOT NULL,
  `payable` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `config_cotisation_id` (`config_cotisation_id`),
  KEY `cotisation_id` (`cotisation_id`),
  CONSTRAINT `config_cotisation_item_ibfk_1` FOREIGN KEY (`config_cotisation_id`) REFERENCES `config_cotisation` (`id`),
  CONSTRAINT `config_cotisation_item_ibfk_2` FOREIGN KEY (`cotisation_id`) REFERENCES `cotisation` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

/*Table structure for table `config_paiement_period` */

DROP TABLE IF EXISTS `config_paiement_period`;

CREATE TABLE `config_paiement_period` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `paiement_period_id` int(10) unsigned NOT NULL,
  `weekFrom` date NOT NULL,
  `weekTo` date NOT NULL,
  PRIMARY KEY (`id`),
  KEY `paiement_period_id` (`paiement_period_id`),
  CONSTRAINT `config_paiement_period_ibfk_1` FOREIGN KEY (`paiement_period_id`) REFERENCES `paiement_period` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

/*Table structure for table `config_rubric` */

DROP TABLE IF EXISTS `config_rubric`;

CREATE TABLE `config_rubric` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `label` text,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

/*Table structure for table `config_rubric_item` */

DROP TABLE IF EXISTS `config_rubric_item`;

CREATE TABLE `config_rubric_item` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `config_rubric_id` int(10) unsigned NOT NULL,
  `rubric_id` int(10) unsigned NOT NULL,
  `payable` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `config_rubric_id` (`config_rubric_id`),
  KEY `rubric_id` (`rubric_id`),
  CONSTRAINT `config_rubric_item_ibfk_1` FOREIGN KEY (`config_rubric_id`) REFERENCES `config_rubric` (`id`),
  CONSTRAINT `config_rubric_item_ibfk_2` FOREIGN KEY (`rubric_id`) REFERENCES `rubric` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

/*Table structure for table `config_tax` */

DROP TABLE IF EXISTS `config_tax`;

CREATE TABLE `config_tax` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `label` text,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

/*Table structure for table `config_tax_item` */

DROP TABLE IF EXISTS `config_tax_item`;

CREATE TABLE `config_tax_item` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `config_tax_id` int(10) unsigned NOT NULL,
  `tax_id` int(10) unsigned NOT NULL,
  `payable` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `config_tax_id` (`config_tax_id`),
  KEY `tax_id` (`tax_id`),
  CONSTRAINT `config_tax_item_ibfk_1` FOREIGN KEY (`config_tax_id`) REFERENCES `config_tax` (`id`),
  CONSTRAINT `config_tax_item_ibfk_2` FOREIGN KEY (`tax_id`) REFERENCES `tax` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

/*Table structure for table `consumption` */

DROP TABLE IF EXISTS `consumption`;

CREATE TABLE `consumption` (
  `uuid` char(36) NOT NULL,
  `depot_uuid` char(36) NOT NULL,
  `date` date DEFAULT NULL,
  `document_id` char(36) NOT NULL,
  `tracking_number` char(50) NOT NULL,
  `quantity` int(10) unsigned DEFAULT NULL,
  `unit_price` float unsigned DEFAULT NULL,
  PRIMARY KEY (`uuid`),
  KEY `depot_uuid` (`depot_uuid`),
  CONSTRAINT `consumption_ibfk_1` FOREIGN KEY (`depot_uuid`) REFERENCES `depot` (`uuid`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

/*Table structure for table `consumption_loss` */

DROP TABLE IF EXISTS `consumption_loss`;

CREATE TABLE `consumption_loss` (
  `uuid` char(36) NOT NULL,
  `consumption_uuid` char(36) NOT NULL,
  `document_uuid` char(36) NOT NULL,
  PRIMARY KEY (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

/*Table structure for table `consumption_patient` */

DROP TABLE IF EXISTS `consumption_patient`;

CREATE TABLE `consumption_patient` (
  `uuid` char(36) NOT NULL,
  `consumption_uuid` char(36) NOT NULL,
  `sale_uuid` char(36) NOT NULL,
  `patient_uuid` char(36) NOT NULL,
  PRIMARY KEY (`uuid`),
  KEY `consumption_uuid` (`consumption_uuid`),
  KEY `sale_uuid` (`sale_uuid`),
  KEY `patient_uuid` (`patient_uuid`),
  CONSTRAINT `consumption_patient_ibfk_1` FOREIGN KEY (`consumption_uuid`) REFERENCES `consumption` (`uuid`),
  CONSTRAINT `consumption_patient_ibfk_2` FOREIGN KEY (`sale_uuid`) REFERENCES `sale` (`uuid`),
  CONSTRAINT `consumption_patient_ibfk_3` FOREIGN KEY (`patient_uuid`) REFERENCES `patient` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

/*Table structure for table `consumption_reversing` */

DROP TABLE IF EXISTS `consumption_reversing`;

CREATE TABLE `consumption_reversing` (
  `uuid` char(36) NOT NULL,
  `consumption_uuid` char(36) NOT NULL,
  `depot_uuid` char(36) NOT NULL,
  `document_id` char(36) NOT NULL,
  `date` date DEFAULT NULL,
  `tracking_number` char(50) NOT NULL,
  `quantity` int(11) DEFAULT NULL,
  `description` text,
  PRIMARY KEY (`uuid`),
  KEY `consumption_uuid` (`consumption_uuid`),
  KEY `depot_uuid` (`depot_uuid`),
  CONSTRAINT `consumption_reversing_ibfk_1` FOREIGN KEY (`consumption_uuid`) REFERENCES `consumption` (`uuid`),
  CONSTRAINT `consumption_reversing_ibfk_2` FOREIGN KEY (`depot_uuid`) REFERENCES `depot` (`uuid`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

/*Table structure for table `consumption_rummage` */

DROP TABLE IF EXISTS `consumption_rummage`;

CREATE TABLE `consumption_rummage` (
  `uuid` char(36) NOT NULL,
  `consumption_uuid` char(36) NOT NULL,
  `document_uuid` char(36) NOT NULL,
  PRIMARY KEY (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

/*Table structure for table `consumption_service` */

DROP TABLE IF EXISTS `consumption_service`;

CREATE TABLE `consumption_service` (
  `uuid` char(36) NOT NULL,
  `consumption_uuid` char(36) NOT NULL,
  `service_id` smallint(5) unsigned NOT NULL,
  PRIMARY KEY (`uuid`),
  KEY `consumption_uuid` (`consumption_uuid`),
  KEY `service_id` (`service_id`),
  CONSTRAINT `consumption_service_ibfk_1` FOREIGN KEY (`consumption_uuid`) REFERENCES `consumption` (`uuid`),
  CONSTRAINT `consumption_service_ibfk_2` FOREIGN KEY (`service_id`) REFERENCES `service` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

/*Table structure for table `cost_center` */

DROP TABLE IF EXISTS `cost_center`;

CREATE TABLE `cost_center` (
  `project_id` smallint(5) unsigned NOT NULL,
  `id` smallint(6) NOT NULL AUTO_INCREMENT,
  `text` varchar(100) NOT NULL,
  `note` text,
  `is_principal` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `project_id` (`project_id`),
  CONSTRAINT `cost_center_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `project` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=62 DEFAULT CHARSET=latin1;

/*Table structure for table `cost_center_assignation` */

DROP TABLE IF EXISTS `cost_center_assignation`;

CREATE TABLE `cost_center_assignation` (
  `project_id` smallint(5) unsigned NOT NULL,
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `auxi_cc_id` smallint(6) NOT NULL,
  `cost` float DEFAULT '0',
  `date` date DEFAULT NULL,
  `note` text,
  PRIMARY KEY (`id`),
  KEY `project_id` (`project_id`),
  KEY `auxi_cc_id` (`auxi_cc_id`),
  CONSTRAINT `cost_center_assignation_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `project` (`id`) ON DELETE CASCADE,
  CONSTRAINT `cost_center_assignation_ibfk_2` FOREIGN KEY (`auxi_cc_id`) REFERENCES `cost_center` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

/*Table structure for table `cost_center_assignation_item` */

DROP TABLE IF EXISTS `cost_center_assignation_item`;

CREATE TABLE `cost_center_assignation_item` (
  `cost_center_assignation_id` int(10) unsigned NOT NULL,
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `pri_cc_id` smallint(6) NOT NULL,
  `init_cost` float DEFAULT '0',
  `value_criteria` float DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `cost_center_assignation_id` (`cost_center_assignation_id`),
  KEY `pri_cc_id` (`pri_cc_id`),
  CONSTRAINT `cost_center_assignation_item_ibfk_1` FOREIGN KEY (`cost_center_assignation_id`) REFERENCES `cost_center_assignation` (`id`) ON DELETE CASCADE,
  CONSTRAINT `cost_center_assignation_item_ibfk_2` FOREIGN KEY (`pri_cc_id`) REFERENCES `cost_center` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

/*Table structure for table `cotisation` */

DROP TABLE IF EXISTS `cotisation`;

CREATE TABLE `cotisation` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `label` text,
  `abbr` varchar(4) DEFAULT NULL,
  `is_employee` tinyint(1) DEFAULT NULL,
  `is_percent` tinyint(1) DEFAULT NULL,
  `four_account_id` int(10) unsigned DEFAULT NULL,
  `six_account_id` int(10) unsigned DEFAULT NULL,
  `value` float DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `four_account_id` (`four_account_id`),
  KEY `six_account_id` (`six_account_id`),
  CONSTRAINT `cotisation_ibfk_1` FOREIGN KEY (`four_account_id`) REFERENCES `account` (`id`),
  CONSTRAINT `cotisation_ibfk_2` FOREIGN KEY (`six_account_id`) REFERENCES `account` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

/*Table structure for table `cotisation_paiement` */

DROP TABLE IF EXISTS `cotisation_paiement`;

CREATE TABLE `cotisation_paiement` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `paiement_uuid` char(36) NOT NULL,
  `cotisation_id` int(10) unsigned NOT NULL,
  `value` float DEFAULT '0',
  `posted` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `paiement_uuid` (`paiement_uuid`),
  KEY `cotisation_id` (`cotisation_id`),
  CONSTRAINT `cotisation_paiement_ibfk_1` FOREIGN KEY (`paiement_uuid`) REFERENCES `paiement` (`uuid`),
  CONSTRAINT `cotisation_paiement_ibfk_2` FOREIGN KEY (`cotisation_id`) REFERENCES `cotisation` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

/*Table structure for table `country` */

DROP TABLE IF EXISTS `country`;

CREATE TABLE `country` (
  `uuid` char(36) NOT NULL,
  `code` smallint(5) unsigned NOT NULL,
  `country_en` varchar(45) NOT NULL,
  `country_fr` varchar(45) NOT NULL,
  PRIMARY KEY (`uuid`),
  UNIQUE KEY `code_unique` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

/*Table structure for table `credit_note` */

DROP TABLE IF EXISTS `credit_note`;

CREATE TABLE `credit_note` (
  `project_id` smallint(5) unsigned NOT NULL,
  `reference` int(10) unsigned NOT NULL,
  `uuid` char(36) NOT NULL,
  `cost` decimal(19,4) unsigned NOT NULL,
  `debitor_uuid` char(36) NOT NULL,
  `seller_id` smallint(5) unsigned NOT NULL DEFAULT '0',
  `sale_uuid` char(36) NOT NULL,
  `note_date` date NOT NULL,
  `description` text,
  `posted` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`uuid`),
  KEY `reference` (`reference`),
  KEY `project_id` (`project_id`),
  KEY `debitor_uuid` (`debitor_uuid`),
  KEY `sale_uuid` (`sale_uuid`),
  CONSTRAINT `credit_note_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `project` (`id`),
  CONSTRAINT `credit_note_ibfk_2` FOREIGN KEY (`debitor_uuid`) REFERENCES `debitor` (`uuid`),
  CONSTRAINT `credit_note_ibfk_3` FOREIGN KEY (`sale_uuid`) REFERENCES `sale` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

/*Table structure for table `creditor` */

DROP TABLE IF EXISTS `creditor`;

CREATE TABLE `creditor` (
  `uuid` char(36) NOT NULL,
  `group_uuid` char(36) NOT NULL,
  `text` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`uuid`),
  KEY `group_uuid` (`group_uuid`),
  CONSTRAINT `creditor_ibfk_1` FOREIGN KEY (`group_uuid`) REFERENCES `creditor_group` (`uuid`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

/*Table structure for table `creditor_group` */

DROP TABLE IF EXISTS `creditor_group`;

CREATE TABLE `creditor_group` (
  `enterprise_id` smallint(5) unsigned NOT NULL,
  `uuid` char(36) NOT NULL,
  `name` varchar(80) DEFAULT NULL,
  `account_id` int(10) unsigned NOT NULL,
  `locked` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`uuid`),
  KEY `account_id` (`account_id`),
  KEY `enterprise_id` (`enterprise_id`),
  CONSTRAINT `creditor_group_ibfk_1` FOREIGN KEY (`enterprise_id`) REFERENCES `enterprise` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `creditor_group_ibfk_2` FOREIGN KEY (`account_id`) REFERENCES `account` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

/*Table structure for table `critere` */

DROP TABLE IF EXISTS `critere`;

CREATE TABLE `critere` (
  `id` smallint(5) unsigned NOT NULL AUTO_INCREMENT,
  `text` varchar(50) NOT NULL,
  `note` text,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

/*Table structure for table `currency` */

DROP TABLE IF EXISTS `currency`;

CREATE TABLE `currency` (
  `id` tinyint(3) unsigned NOT NULL AUTO_INCREMENT,
  `name` text NOT NULL,
  `symbol` varchar(15) NOT NULL,
  `note` text,
  `separator` varchar(5) DEFAULT NULL,
  `decimal` varchar(5) DEFAULT NULL,
  `min_monentary_unit` decimal(10,2) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=latin1;

/*Table structure for table `debitor` */

DROP TABLE IF EXISTS `debitor`;

CREATE TABLE `debitor` (
  `uuid` char(36) NOT NULL,
  `group_uuid` char(36) DEFAULT NULL,
  `text` text,
  PRIMARY KEY (`uuid`),
  KEY `group_uuid` (`group_uuid`),
  CONSTRAINT `debitor_ibfk_1` FOREIGN KEY (`group_uuid`) REFERENCES `debitor_group` (`uuid`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

/*Table structure for table `debitor_group` */

DROP TABLE IF EXISTS `debitor_group`;

CREATE TABLE `debitor_group` (
  `enterprise_id` smallint(5) unsigned NOT NULL,
  `uuid` char(36) NOT NULL,
  `name` varchar(100) NOT NULL,
  `account_id` int(10) unsigned NOT NULL,
  `location_id` char(36) NOT NULL,
  `phone` varchar(10) DEFAULT '',
  `email` varchar(30) DEFAULT '',
  `note` text,
  `locked` tinyint(1) NOT NULL DEFAULT '0',
  `max_credit` mediumint(8) unsigned DEFAULT '0',
  `is_convention` tinyint(1) NOT NULL DEFAULT '0',
  `price_list_uuid` char(36) DEFAULT NULL,
  PRIMARY KEY (`uuid`),
  KEY `enterprise_id` (`enterprise_id`),
  KEY `account_id` (`account_id`),
  KEY `location_id` (`location_id`),
  KEY `price_list_uuid` (`price_list_uuid`),
  CONSTRAINT `debitor_group_ibfk_1` FOREIGN KEY (`enterprise_id`) REFERENCES `enterprise` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `debitor_group_ibfk_2` FOREIGN KEY (`account_id`) REFERENCES `account` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `debitor_group_ibfk_3` FOREIGN KEY (`location_id`) REFERENCES `village` (`uuid`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `debitor_group_ibfk_4` FOREIGN KEY (`price_list_uuid`) REFERENCES `price_list` (`uuid`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

/*Table structure for table `debitor_group_history` */

DROP TABLE IF EXISTS `debitor_group_history`;

CREATE TABLE `debitor_group_history` (
  `uuid` char(36) NOT NULL,
  `debitor_uuid` char(36) DEFAULT NULL,
  `debitor_group_uuid` char(36) DEFAULT NULL,
  `income_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `user_id` smallint(5) unsigned DEFAULT NULL,
  PRIMARY KEY (`uuid`),
  KEY `debitor_uuid` (`debitor_uuid`),
  KEY `debitor_group_uuid` (`debitor_group_uuid`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `debitor_group_history_ibfk_1` FOREIGN KEY (`debitor_uuid`) REFERENCES `debitor` (`uuid`),
  CONSTRAINT `debitor_group_history_ibfk_2` FOREIGN KEY (`debitor_group_uuid`) REFERENCES `debitor_group` (`uuid`),
  CONSTRAINT `debitor_group_history_ibfk_3` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

/*Table structure for table `depot` */

DROP TABLE IF EXISTS `depot`;

CREATE TABLE `depot` (
  `uuid` char(36) NOT NULL,
  `reference` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `text` text,
  `enterprise_id` smallint(5) unsigned NOT NULL,
  `is_warehouse` smallint(5) unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`uuid`),
  KEY `reference` (`reference`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=latin1;

/*Table structure for table `donation_item` */

DROP TABLE IF EXISTS `donation_item`;

CREATE TABLE `donation_item` (
  `uuid` char(36) NOT NULL,
  `donation_uuid` char(36) NOT NULL,
  `tracking_number` char(36) NOT NULL,
  PRIMARY KEY (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

/*Table structure for table `donations` */

DROP TABLE IF EXISTS `donations`;

CREATE TABLE `donations` (
  `uuid` char(36) NOT NULL,
  `donor_id` int(11) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `date` date DEFAULT NULL,
  `is_received` tinyint(1) NOT NULL DEFAULT '0',
  `is_confirmed` tinyint(1) NOT NULL DEFAULT '0',
  `confirmed_by` int(10) unsigned NOT NULL,
  PRIMARY KEY (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

/*Table structure for table `donor` */

DROP TABLE IF EXISTS `donor`;

CREATE TABLE `donor` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` text NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=latin1;

/*Table structure for table `employee` */

DROP TABLE IF EXISTS `employee`;

CREATE TABLE `employee` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `code` varchar(20) NOT NULL,
  `prenom` text,
  `name` text NOT NULL,
  `postnom` text,
  `sexe` varchar(10) NOT NULL,
  `dob` date NOT NULL,
  `date_embauche` date DEFAULT NULL,
  `nb_spouse` int(11) DEFAULT '0',
  `nb_enfant` int(11) DEFAULT '0',
  `grade_id` char(36) NOT NULL,
  `daily_salary` float DEFAULT '0',
  `bank` varchar(30) DEFAULT NULL,
  `bank_account` varchar(30) DEFAULT NULL,
  `adresse` varchar(50) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `email` varchar(70) DEFAULT NULL,
  `fonction_id` tinyint(3) unsigned DEFAULT NULL,
  `service_id` smallint(5) unsigned DEFAULT NULL,
  `location_id` char(36) DEFAULT NULL,
  `creditor_uuid` char(36) DEFAULT NULL,
  `debitor_uuid` char(36) DEFAULT NULL,
  `locked` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fonction_id` (`fonction_id`),
  KEY `service_id` (`service_id`),
  KEY `location_id` (`location_id`),
  KEY `creditor_uuid` (`creditor_uuid`),
  KEY `debitor_uuid` (`debitor_uuid`),
  KEY `grade_id` (`grade_id`),
  CONSTRAINT `employee_ibfk_1` FOREIGN KEY (`fonction_id`) REFERENCES `fonction` (`id`),
  CONSTRAINT `employee_ibfk_2` FOREIGN KEY (`service_id`) REFERENCES `service` (`id`),
  CONSTRAINT `employee_ibfk_3` FOREIGN KEY (`location_id`) REFERENCES `village` (`uuid`),
  CONSTRAINT `employee_ibfk_4` FOREIGN KEY (`creditor_uuid`) REFERENCES `creditor` (`uuid`),
  CONSTRAINT `employee_ibfk_5` FOREIGN KEY (`debitor_uuid`) REFERENCES `debitor` (`uuid`),
  CONSTRAINT `employee_ibfk_6` FOREIGN KEY (`grade_id`) REFERENCES `grade` (`uuid`)
) ENGINE=InnoDB AUTO_INCREMENT=149 DEFAULT CHARSET=latin1;

/*Table structure for table `employee_invoice` */

DROP TABLE IF EXISTS `employee_invoice`;

CREATE TABLE `employee_invoice` (
  `uuid` char(36) NOT NULL,
  `project_id` smallint(5) unsigned NOT NULL,
  `debitor_uuid` char(36) NOT NULL,
  `creditor_uuid` char(36) NOT NULL,
  `note` text,
  `authorized_by` varchar(80) NOT NULL,
  `date` date NOT NULL,
  `total` decimal(14,4) NOT NULL DEFAULT '0.0000',
  PRIMARY KEY (`uuid`),
  KEY `debitor_uuid` (`debitor_uuid`),
  KEY `project_id` (`project_id`),
  KEY `creditor_uuid` (`creditor_uuid`),
  CONSTRAINT `employee_invoice_ibfk_1` FOREIGN KEY (`debitor_uuid`) REFERENCES `debitor` (`uuid`),
  CONSTRAINT `employee_invoice_ibfk_2` FOREIGN KEY (`project_id`) REFERENCES `project` (`id`),
  CONSTRAINT `employee_invoice_ibfk_3` FOREIGN KEY (`creditor_uuid`) REFERENCES `creditor` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

/*Table structure for table `employee_invoice_item` */

DROP TABLE IF EXISTS `employee_invoice_item`;

CREATE TABLE `employee_invoice_item` (
  `uuid` char(36) NOT NULL,
  `payment_uuid` char(36) NOT NULL,
  `invoice_uuid` char(36) NOT NULL,
  `cost` decimal(16,4) unsigned NOT NULL,
  PRIMARY KEY (`uuid`),
  KEY `payment_uuid` (`payment_uuid`),
  KEY `invoice_uuid` (`invoice_uuid`),
  CONSTRAINT `employee_invoice_item_ibfk_1` FOREIGN KEY (`payment_uuid`) REFERENCES `employee_invoice` (`uuid`) ON DELETE CASCADE,
  CONSTRAINT `employee_invoice_item_ibfk_2` FOREIGN KEY (`invoice_uuid`) REFERENCES `sale` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

/*Table structure for table `enterprise` */

DROP TABLE IF EXISTS `enterprise`;

CREATE TABLE `enterprise` (
  `id` smallint(5) unsigned NOT NULL AUTO_INCREMENT,
  `name` text NOT NULL,
  `abbr` varchar(50) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `email` varchar(70) DEFAULT NULL,
  `location_id` char(36) DEFAULT NULL,
  `logo` varchar(70) DEFAULT NULL,
  `currency_id` tinyint(3) unsigned NOT NULL,
  `po_box` varchar(30) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `location_id` (`location_id`),
  KEY `currency_id` (`currency_id`),
  CONSTRAINT `enterprise_ibfk_1` FOREIGN KEY (`currency_id`) REFERENCES `currency` (`id`),
  CONSTRAINT `enterprise_ibfk_2` FOREIGN KEY (`location_id`) REFERENCES `village` (`uuid`)
) ENGINE=InnoDB AUTO_INCREMENT=201 DEFAULT CHARSET=latin1;

/*Table structure for table `exchange_rate` */

DROP TABLE IF EXISTS `exchange_rate`;

CREATE TABLE `exchange_rate` (
  `id` mediumint(8) unsigned NOT NULL AUTO_INCREMENT,
  `enterprise_currency_id` tinyint(3) unsigned NOT NULL,
  `foreign_currency_id` tinyint(3) unsigned NOT NULL,
  `rate` decimal(19,4) unsigned NOT NULL,
  `date` date NOT NULL,
  PRIMARY KEY (`id`),
  KEY `enterprise_currency_id` (`enterprise_currency_id`),
  KEY `foreign_currency_id` (`foreign_currency_id`),
  CONSTRAINT `exchange_rate_ibfk_1` FOREIGN KEY (`enterprise_currency_id`) REFERENCES `currency` (`id`),
  CONSTRAINT `exchange_rate_ibfk_2` FOREIGN KEY (`foreign_currency_id`) REFERENCES `currency` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=latin1;

/*Table structure for table `fiscal_year` */

DROP TABLE IF EXISTS `fiscal_year`;

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
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=latin1;

/*Table structure for table `fonction` */

DROP TABLE IF EXISTS `fonction`;

CREATE TABLE `fonction` (
  `id` tinyint(3) unsigned NOT NULL AUTO_INCREMENT,
  `fonction_txt` text NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=45 DEFAULT CHARSET=latin1;

/*Table structure for table `general_ledger` */

DROP TABLE IF EXISTS `general_ledger`;

CREATE TABLE `general_ledger` (
  `uuid` char(36) NOT NULL,
  `project_id` smallint(5) unsigned NOT NULL,
  `fiscal_year_id` mediumint(8) unsigned NOT NULL,
  `period_id` mediumint(8) unsigned NOT NULL,
  `trans_id` text NOT NULL,
  `trans_date` date NOT NULL,
  `doc_num` int(10) unsigned DEFAULT NULL,
  `description` text,
  `account_id` int(10) unsigned NOT NULL,
  `debit` decimal(19,4) unsigned NOT NULL DEFAULT '0.0000',
  `credit` decimal(19,4) unsigned NOT NULL DEFAULT '0.0000',
  `debit_equiv` decimal(19,4) unsigned NOT NULL DEFAULT '0.0000',
  `credit_equiv` decimal(19,4) unsigned NOT NULL DEFAULT '0.0000',
  `currency_id` tinyint(3) unsigned NOT NULL,
  `deb_cred_uuid` char(36) DEFAULT NULL,
  `deb_cred_type` char(1) DEFAULT NULL,
  `inv_po_id` char(36) DEFAULT NULL,
  `comment` text,
  `cost_ctrl_id` varchar(10) DEFAULT NULL,
  `origin_id` tinyint(3) unsigned NOT NULL,
  `user_id` smallint(5) unsigned NOT NULL,
  `session_id` int(10) unsigned NOT NULL,
  `cc_id` smallint(6) DEFAULT NULL,
  `pc_id` smallint(6) DEFAULT NULL,
  PRIMARY KEY (`uuid`),
  KEY `project_id` (`project_id`),
  KEY `fiscal_year_id` (`fiscal_year_id`),
  KEY `period_id` (`period_id`),
  KEY `origin_id` (`origin_id`),
  KEY `currency_id` (`currency_id`),
  KEY `user_id` (`user_id`),
  KEY `session_id` (`session_id`),
  KEY `cc_id` (`cc_id`),
  KEY `pc_id` (`pc_id`),
  CONSTRAINT `general_ledger_ibfk_1` FOREIGN KEY (`fiscal_year_id`) REFERENCES `fiscal_year` (`id`),
  CONSTRAINT `general_ledger_ibfk_2` FOREIGN KEY (`period_id`) REFERENCES `period` (`id`),
  CONSTRAINT `general_ledger_ibfk_3` FOREIGN KEY (`origin_id`) REFERENCES `transaction_type` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `general_ledger_ibfk_4` FOREIGN KEY (`project_id`) REFERENCES `project` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `general_ledger_ibfk_5` FOREIGN KEY (`currency_id`) REFERENCES `currency` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `general_ledger_ibfk_6` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `general_ledger_ibfk_7` FOREIGN KEY (`session_id`) REFERENCES `posting_session` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `general_ledger_ibfk_8` FOREIGN KEY (`cc_id`) REFERENCES `cost_center` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `general_ledger_ibfk_9` FOREIGN KEY (`pc_id`) REFERENCES `profit_center` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

/*Table structure for table `grade` */

DROP TABLE IF EXISTS `grade`;

CREATE TABLE `grade` (
  `uuid` char(36) NOT NULL,
  `code` varchar(30) DEFAULT NULL,
  `text` text,
  `basic_salary` decimal(19,4) unsigned DEFAULT NULL,
  PRIMARY KEY (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

/*Table structure for table `group_invoice` */

DROP TABLE IF EXISTS `group_invoice`;

CREATE TABLE `group_invoice` (
  `uuid` char(36) NOT NULL,
  `project_id` smallint(5) unsigned NOT NULL,
  `debitor_uuid` char(36) NOT NULL,
  `group_uuid` char(36) NOT NULL,
  `note` text,
  `authorized_by` varchar(80) NOT NULL,
  `date` date NOT NULL,
  `total` decimal(14,4) NOT NULL DEFAULT '0.0000',
  PRIMARY KEY (`uuid`),
  KEY `debitor_uuid` (`debitor_uuid`),
  KEY `project_id` (`project_id`),
  KEY `group_uuid` (`group_uuid`),
  CONSTRAINT `group_invoice_ibfk_1` FOREIGN KEY (`debitor_uuid`) REFERENCES `debitor` (`uuid`),
  CONSTRAINT `group_invoice_ibfk_2` FOREIGN KEY (`project_id`) REFERENCES `project` (`id`),
  CONSTRAINT `group_invoice_ibfk_3` FOREIGN KEY (`group_uuid`) REFERENCES `debitor_group` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

/*Table structure for table `group_invoice_item` */

DROP TABLE IF EXISTS `group_invoice_item`;

CREATE TABLE `group_invoice_item` (
  `uuid` char(36) NOT NULL,
  `payment_uuid` char(36) NOT NULL,
  `invoice_uuid` char(36) NOT NULL,
  `cost` decimal(16,4) unsigned NOT NULL,
  PRIMARY KEY (`uuid`),
  KEY `payment_uuid` (`payment_uuid`),
  KEY `invoice_uuid` (`invoice_uuid`),
  CONSTRAINT `group_invoice_item_ibfk_1` FOREIGN KEY (`payment_uuid`) REFERENCES `group_invoice` (`uuid`) ON DELETE CASCADE,
  CONSTRAINT `group_invoice_item_ibfk_2` FOREIGN KEY (`invoice_uuid`) REFERENCES `sale` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

/*Table structure for table `hollyday` */

DROP TABLE IF EXISTS `hollyday`;

CREATE TABLE `hollyday` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `employee_id` int(10) unsigned NOT NULL,
  `percentage` float DEFAULT '0',
  `label` text,
  `dateFrom` date DEFAULT NULL,
  `dateTo` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `employee_id` (`employee_id`),
  CONSTRAINT `hollyday_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employee` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

/*Table structure for table `hollyday_paiement` */

DROP TABLE IF EXISTS `hollyday_paiement`;

CREATE TABLE `hollyday_paiement` (
  `hollyday_id` int(10) unsigned NOT NULL,
  `hollyday_nbdays` int(10) unsigned NOT NULL,
  `hollyday_percentage` float DEFAULT '0',
  `paiement_uuid` char(36) NOT NULL,
  KEY `paiement_uuid` (`paiement_uuid`),
  KEY `hollyday_id` (`hollyday_id`),
  CONSTRAINT `hollyday_paiement_ibfk_1` FOREIGN KEY (`paiement_uuid`) REFERENCES `paiement` (`uuid`),
  CONSTRAINT `hollyday_paiement_ibfk_2` FOREIGN KEY (`hollyday_id`) REFERENCES `hollyday` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

/*Table structure for table `inventory` */

DROP TABLE IF EXISTS `inventory`;

CREATE TABLE `inventory` (
  `enterprise_id` smallint(5) unsigned NOT NULL,
  `uuid` char(36) NOT NULL,
  `code` varchar(30) NOT NULL,
  `text` text,
  `price` decimal(10,4) unsigned NOT NULL DEFAULT '0.0000',
  `purchase_price` decimal(10,4) unsigned NOT NULL DEFAULT '0.0000',
  `group_uuid` char(36) NOT NULL,
  `unit_id` smallint(5) unsigned DEFAULT NULL,
  `unit_weight` mediumint(9) DEFAULT '0',
  `unit_volume` mediumint(9) DEFAULT '0',
  `stock` int(10) unsigned NOT NULL DEFAULT '0',
  `stock_max` int(10) unsigned NOT NULL DEFAULT '0',
  `stock_min` int(10) unsigned NOT NULL DEFAULT '0',
  `type_id` tinyint(3) unsigned NOT NULL DEFAULT '0',
  `consumable` tinyint(1) NOT NULL DEFAULT '0',
  `origin_stamp` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`uuid`),
  UNIQUE KEY `code` (`code`),
  KEY `enterprise_id` (`enterprise_id`),
  KEY `group_uuid` (`group_uuid`),
  KEY `unit_id` (`unit_id`),
  KEY `type_id` (`type_id`),
  CONSTRAINT `inventory_ibfk_1` FOREIGN KEY (`enterprise_id`) REFERENCES `enterprise` (`id`),
  CONSTRAINT `inventory_ibfk_2` FOREIGN KEY (`group_uuid`) REFERENCES `inventory_group` (`uuid`),
  CONSTRAINT `inventory_ibfk_3` FOREIGN KEY (`unit_id`) REFERENCES `inventory_unit` (`id`),
  CONSTRAINT `inventory_ibfk_4` FOREIGN KEY (`type_id`) REFERENCES `inventory_type` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

/*Table structure for table `inventory_group` */

DROP TABLE IF EXISTS `inventory_group`;

CREATE TABLE `inventory_group` (
  `uuid` char(36) NOT NULL,
  `name` varchar(100) NOT NULL,
  `code` smallint(6) NOT NULL,
  `sales_account` mediumint(8) unsigned NOT NULL,
  `cogs_account` mediumint(8) unsigned DEFAULT NULL,
  `stock_account` mediumint(8) unsigned DEFAULT NULL,
  `donation_account` mediumint(8) unsigned DEFAULT NULL,
  PRIMARY KEY (`uuid`),
  KEY `sales_account` (`sales_account`),
  KEY `cogs_account` (`cogs_account`),
  KEY `stock_account` (`stock_account`),
  KEY `donation_account` (`donation_account`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

/*Table structure for table `inventory_log` */

DROP TABLE IF EXISTS `inventory_log`;

CREATE TABLE `inventory_log` (
  `uuid` char(36) NOT NULL,
  `inventory_uuid` char(36) NOT NULL,
  `log_timestamp` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `price` decimal(19,4) unsigned DEFAULT NULL,
  `code` varchar(30) DEFAULT NULL,
  `text` text,
  PRIMARY KEY (`uuid`),
  KEY `inventory_uuid` (`inventory_uuid`),
  CONSTRAINT `inventory_log_ibfk_1` FOREIGN KEY (`inventory_uuid`) REFERENCES `inventory` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

/*Table structure for table `inventory_type` */

DROP TABLE IF EXISTS `inventory_type`;

CREATE TABLE `inventory_type` (
  `id` tinyint(3) unsigned NOT NULL AUTO_INCREMENT,
  `text` varchar(150) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=latin1;

/*Table structure for table `inventory_unit` */

DROP TABLE IF EXISTS `inventory_unit`;

CREATE TABLE `inventory_unit` (
  `id` smallint(5) unsigned NOT NULL AUTO_INCREMENT,
  `text` varchar(100) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=latin1;

/*Table structure for table `journal_log` */

DROP TABLE IF EXISTS `journal_log`;

CREATE TABLE `journal_log` (
  `uuid` char(36) NOT NULL,
  `transaction_id` text NOT NULL,
  `justification` text,
  `date` date NOT NULL,
  `user_id` smallint(5) unsigned NOT NULL,
  PRIMARY KEY (`uuid`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `journal_log_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

/*Table structure for table `language` */

DROP TABLE IF EXISTS `language`;

CREATE TABLE `language` (
  `id` tinyint(3) unsigned NOT NULL,
  `name` text NOT NULL,
  `key` text NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

/*Table structure for table `mod_snis_attribut_form` */

DROP TABLE IF EXISTS `mod_snis_attribut_form`;

CREATE TABLE `mod_snis_attribut_form` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_liste_item` int(11) NOT NULL,
  `attribut_form` varchar(100) NOT NULL,
  `request_auto` text NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `attribut_form` (`attribut_form`),
  KEY `id_liste_item` (`id_liste_item`)
) ENGINE=InnoDB AUTO_INCREMENT=3524 DEFAULT CHARSET=latin1;

/*Table structure for table `mod_snis_domaine` */

DROP TABLE IF EXISTS `mod_snis_domaine`;

CREATE TABLE `mod_snis_domaine` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `titre` varchar(50) NOT NULL,
  `nb_jour_travail_prevu_mois` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=28 DEFAULT CHARSET=latin1;

/*Table structure for table `mod_snis_hopital` */

DROP TABLE IF EXISTS `mod_snis_hopital`;

CREATE TABLE `mod_snis_hopital` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_project` int(11) DEFAULT NULL,
  `nom` varchar(50) DEFAULT NULL,
  `id_zs` int(11) DEFAULT NULL,
  `adresse` varchar(100) DEFAULT NULL,
  `id_employe_medecin_directeur` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=2 DEFAULT CHARSET=latin1;

/*Table structure for table `mod_snis_identification` */

DROP TABLE IF EXISTS `mod_snis_identification`;

CREATE TABLE `mod_snis_identification` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_rapport` int(11) NOT NULL,
  `id_hopital` int(11) NOT NULL,
  `id_zs` int(11) NOT NULL,
  `id_employe_medecin_dir` int(11) DEFAULT NULL,
  `date_envoie` date DEFAULT NULL,
  `date_reception` date DEFAULT NULL,
  `date_encodage` date DEFAULT NULL,
  `information` text,
  `id_employe_envoi` int(11) DEFAULT NULL,
  `id_employe_reception` int(11) DEFAULT NULL,
  `id_employe_encodage` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=latin1;

/*Table structure for table `mod_snis_items` */

DROP TABLE IF EXISTS `mod_snis_items`;

CREATE TABLE `mod_snis_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `libelle` varchar(255) DEFAULT NULL,
  `rubrique_snis` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=906 DEFAULT CHARSET=latin1;

/*Table structure for table `mod_snis_monthly_report` */

DROP TABLE IF EXISTS `mod_snis_monthly_report`;

CREATE TABLE `mod_snis_monthly_report` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_attribut_form` int(11) NOT NULL,
  `value` float NOT NULL,
  `id_month` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `id_attribut_form` (`id_attribut_form`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

/*Table structure for table `mod_snis_rapport` */

DROP TABLE IF EXISTS `mod_snis_rapport`;

CREATE TABLE `mod_snis_rapport` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `date` date NOT NULL,
  `id_snis_hopital` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=latin1;

/*Table structure for table `mod_snis_zs` */

DROP TABLE IF EXISTS `mod_snis_zs`;

CREATE TABLE `mod_snis_zs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `zone` varchar(100) NOT NULL,
  `territoire` varchar(100) NOT NULL,
  `province` varchar(100) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=797 DEFAULT CHARSET=latin1;

/*Table structure for table `movement` */

DROP TABLE IF EXISTS `movement`;

CREATE TABLE `movement` (
  `uuid` char(36) NOT NULL,
  `document_id` char(36) NOT NULL,
  `depot_entry` char(36) DEFAULT NULL,
  `depot_exit` char(36) DEFAULT NULL,
  `tracking_number` char(50) NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT '0',
  `date` date DEFAULT NULL,
  PRIMARY KEY (`uuid`),
  KEY `tracking_number` (`tracking_number`),
  KEY `depot_exit` (`depot_exit`),
  CONSTRAINT `movement_ibfk_1` FOREIGN KEY (`tracking_number`) REFERENCES `stock` (`tracking_number`),
  CONSTRAINT `movement_ibfk_2` FOREIGN KEY (`depot_exit`) REFERENCES `depot` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

/*Table structure for table `offday` */

DROP TABLE IF EXISTS `offday`;

CREATE TABLE `offday` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `label` text,
  `date` date NOT NULL,
  `percent_pay` float DEFAULT '100',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

/*Table structure for table `paiement` */

DROP TABLE IF EXISTS `paiement`;

CREATE TABLE `paiement` (
  `uuid` char(36) NOT NULL,
  `employee_id` int(10) unsigned NOT NULL,
  `paiement_period_id` int(10) unsigned NOT NULL,
  `currency_id` tinyint(3) unsigned DEFAULT NULL,
  `paiement_date` date DEFAULT NULL,
  `working_day` int(10) unsigned NOT NULL,
  `net_before_tax` float DEFAULT '0',
  `net_after_tax` float DEFAULT '0',
  `net_salary` float DEFAULT '0',
  `is_paid` tinyint(4) DEFAULT '0',
  PRIMARY KEY (`uuid`),
  KEY `employee_id` (`employee_id`),
  KEY `paiement_period_id` (`paiement_period_id`),
  KEY `currency_id` (`currency_id`),
  CONSTRAINT `paiement_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employee` (`id`),
  CONSTRAINT `paiement_ibfk_2` FOREIGN KEY (`paiement_period_id`) REFERENCES `paiement_period` (`id`),
  CONSTRAINT `paiement_ibfk_3` FOREIGN KEY (`currency_id`) REFERENCES `currency` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

/*Table structure for table `paiement_period` */

DROP TABLE IF EXISTS `paiement_period`;

CREATE TABLE `paiement_period` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `config_tax_id` int(10) unsigned NOT NULL,
  `config_rubric_id` int(10) unsigned NOT NULL,
  `config_cotisation_id` int(10) unsigned NOT NULL,
  `config_accounting_id` int(10) unsigned NOT NULL,
  `label` text,
  `dateFrom` date NOT NULL,
  `dateTo` date NOT NULL,
  PRIMARY KEY (`id`),
  KEY `config_tax_id` (`config_tax_id`),
  KEY `config_rubric_id` (`config_rubric_id`),
  KEY `config_cotisation_id` (`config_cotisation_id`),
  KEY `config_accounting_id` (`config_accounting_id`),
  CONSTRAINT `paiement_period_ibfk_1` FOREIGN KEY (`config_tax_id`) REFERENCES `config_tax` (`id`),
  CONSTRAINT `paiement_period_ibfk_2` FOREIGN KEY (`config_rubric_id`) REFERENCES `config_rubric` (`id`),
  CONSTRAINT `paiement_period_ibfk_3` FOREIGN KEY (`config_cotisation_id`) REFERENCES `config_cotisation` (`id`),
  CONSTRAINT `paiement_period_ibfk_4` FOREIGN KEY (`config_accounting_id`) REFERENCES `config_accounting` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

/*Table structure for table `partial_paiement` */

DROP TABLE IF EXISTS `partial_paiement`;

CREATE TABLE `partial_paiement` (
  `uuid` char(36) NOT NULL,
  `paiement_uuid` char(36) NOT NULL,
  `currency_id` tinyint(3) unsigned DEFAULT NULL,
  `paiement_date` date DEFAULT NULL,
  `amount` float DEFAULT '0',
  PRIMARY KEY (`uuid`),
  KEY `paiement_uuid` (`paiement_uuid`),
  KEY `currency_id` (`currency_id`),
  CONSTRAINT `partial_paiement_ibfk_1` FOREIGN KEY (`paiement_uuid`) REFERENCES `paiement` (`uuid`),
  CONSTRAINT `partial_paiement_ibfk_2` FOREIGN KEY (`currency_id`) REFERENCES `currency` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

/*Table structure for table `patient` */

DROP TABLE IF EXISTS `patient`;

CREATE TABLE `patient` (
  `uuid` char(36) NOT NULL,
  `project_id` smallint(5) unsigned NOT NULL,
  `reference` int(10) unsigned NOT NULL,
  `debitor_uuid` char(36) NOT NULL,
  `creditor_uuid` char(36) DEFAULT NULL,
  `first_name` varchar(150) NOT NULL,
  `last_name` varchar(150) NOT NULL,
  `dob` date DEFAULT NULL,
  `father_name` varchar(150) DEFAULT NULL,
  `mother_name` varchar(150) DEFAULT NULL,
  `profession` varchar(150) DEFAULT NULL,
  `employer` varchar(150) DEFAULT NULL,
  `spouse` varchar(150) DEFAULT NULL,
  `spouse_profession` varchar(150) DEFAULT NULL,
  `spouse_employer` varchar(150) DEFAULT NULL,
  `sex` char(1) NOT NULL,
  `religion` varchar(50) DEFAULT NULL,
  `marital_status` varchar(50) DEFAULT NULL,
  `phone` varchar(12) DEFAULT NULL,
  `email` varchar(40) DEFAULT NULL,
  `address_1` varchar(100) DEFAULT NULL,
  `address_2` varchar(100) DEFAULT NULL,
  `renewal` tinyint(1) NOT NULL DEFAULT '0',
  `origin_location_id` char(36) NOT NULL,
  `current_location_id` char(36) NOT NULL,
  `registration_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `title` varchar(30) DEFAULT NULL,
  `notes` text,
  `middle_name` varchar(150) DEFAULT NULL,
  `hospital_no` varchar(150) DEFAULT NULL,
  PRIMARY KEY (`uuid`),
  UNIQUE KEY `creditor_uuid` (`creditor_uuid`),
  KEY `reference` (`reference`),
  KEY `project_id` (`project_id`),
  KEY `debitor_uuid` (`debitor_uuid`),
  KEY `origin_location_id` (`origin_location_id`),
  KEY `current_location_id` (`current_location_id`),
  CONSTRAINT `patient_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `project` (`id`),
  CONSTRAINT `patient_ibfk_2` FOREIGN KEY (`debitor_uuid`) REFERENCES `debitor` (`uuid`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `patient_ibfk_3` FOREIGN KEY (`current_location_id`) REFERENCES `village` (`uuid`) ON UPDATE CASCADE,
  CONSTRAINT `patient_ibfk_4` FOREIGN KEY (`origin_location_id`) REFERENCES `village` (`uuid`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

/*Table structure for table `patient_group` */

DROP TABLE IF EXISTS `patient_group`;

CREATE TABLE `patient_group` (
  `enterprise_id` smallint(5) unsigned NOT NULL,
  `uuid` char(36) NOT NULL,
  `price_list_uuid` char(36) DEFAULT NULL,
  `name` varchar(60) NOT NULL,
  `note` text,
  `created` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `subsidy_uuid` char(36) DEFAULT NULL,
  PRIMARY KEY (`uuid`),
  KEY `enterprise_id` (`enterprise_id`),
  KEY `price_list_uuid` (`price_list_uuid`),
  KEY `subsidy_uuid` (`subsidy_uuid`),
  CONSTRAINT `patient_group_ibfk_1` FOREIGN KEY (`enterprise_id`) REFERENCES `enterprise` (`id`),
  CONSTRAINT `patient_group_ibfk_2` FOREIGN KEY (`price_list_uuid`) REFERENCES `price_list` (`uuid`),
  CONSTRAINT `patient_group_ibfk_3` FOREIGN KEY (`subsidy_uuid`) REFERENCES `subsidy` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

/*Table structure for table `patient_visit` */

DROP TABLE IF EXISTS `patient_visit`;

CREATE TABLE `patient_visit` (
  `uuid` char(36) NOT NULL,
  `patient_uuid` char(36) NOT NULL,
  `date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `registered_by` smallint(5) unsigned NOT NULL,
  PRIMARY KEY (`uuid`),
  KEY `patient_uuid` (`patient_uuid`),
  KEY `registered_by` (`registered_by`),
  CONSTRAINT `patient_visit_ibfk_1` FOREIGN KEY (`patient_uuid`) REFERENCES `patient` (`uuid`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `patient_visit_ibfk_2` FOREIGN KEY (`registered_by`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

/*Table structure for table `payment` */

DROP TABLE IF EXISTS `payment`;

CREATE TABLE `payment` (
  `id` tinyint(3) unsigned NOT NULL AUTO_INCREMENT,
  `days` smallint(5) unsigned DEFAULT '0',
  `months` mediumint(8) unsigned DEFAULT '0',
  `text` varchar(50) NOT NULL,
  `note` text,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

/*Table structure for table `period` */

DROP TABLE IF EXISTS `period`;

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
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=latin1;

/*Table structure for table `period_total` */

DROP TABLE IF EXISTS `period_total`;

CREATE TABLE `period_total` (
  `enterprise_id` smallint(5) unsigned NOT NULL,
  `fiscal_year_id` mediumint(8) unsigned NOT NULL,
  `period_id` mediumint(8) unsigned NOT NULL,
  `account_id` int(10) unsigned NOT NULL,
  `credit` decimal(19,4) unsigned DEFAULT NULL,
  `debit` decimal(19,4) unsigned DEFAULT NULL,
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
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

/*Table structure for table `permission` */

DROP TABLE IF EXISTS `permission`;

CREATE TABLE `permission` (
  `id` mediumint(8) unsigned NOT NULL AUTO_INCREMENT,
  `unit_id` smallint(5) unsigned NOT NULL,
  `user_id` smallint(5) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unit_id_2` (`unit_id`,`user_id`),
  KEY `unit_id` (`unit_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `permission_ibfk_1` FOREIGN KEY (`unit_id`) REFERENCES `unit` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `permission_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=812 DEFAULT CHARSET=latin1;

/*Table structure for table `posting_journal` */

DROP TABLE IF EXISTS `posting_journal`;

CREATE TABLE `posting_journal` (
  `uuid` char(36) NOT NULL,
  `project_id` smallint(5) unsigned NOT NULL,
  `fiscal_year_id` mediumint(8) unsigned DEFAULT NULL,
  `period_id` mediumint(8) unsigned DEFAULT NULL,
  `trans_id` text NOT NULL,
  `trans_date` date NOT NULL,
  `doc_num` int(10) unsigned DEFAULT NULL,
  `description` text,
  `account_id` int(10) unsigned NOT NULL,
  `debit` decimal(19,4) unsigned NOT NULL DEFAULT '0.0000',
  `credit` decimal(19,4) unsigned NOT NULL DEFAULT '0.0000',
  `debit_equiv` decimal(19,4) unsigned NOT NULL DEFAULT '0.0000',
  `credit_equiv` decimal(19,4) unsigned NOT NULL DEFAULT '0.0000',
  `currency_id` tinyint(3) unsigned NOT NULL,
  `deb_cred_uuid` char(36) DEFAULT NULL,
  `deb_cred_type` char(1) DEFAULT NULL,
  `inv_po_id` char(36) DEFAULT NULL,
  `comment` text,
  `cost_ctrl_id` varchar(10) DEFAULT NULL,
  `origin_id` tinyint(3) unsigned NOT NULL,
  `user_id` smallint(5) unsigned NOT NULL,
  `cc_id` smallint(6) DEFAULT NULL,
  `pc_id` smallint(6) DEFAULT NULL,
  PRIMARY KEY (`uuid`),
  KEY `project_id` (`project_id`),
  KEY `fiscal_year_id` (`fiscal_year_id`),
  KEY `period_id` (`period_id`),
  KEY `origin_id` (`origin_id`),
  KEY `currency_id` (`currency_id`),
  KEY `user_id` (`user_id`),
  KEY `cc_id` (`cc_id`),
  KEY `pc_id` (`pc_id`),
  CONSTRAINT `posting_journal_ibfk_1` FOREIGN KEY (`fiscal_year_id`) REFERENCES `fiscal_year` (`id`),
  CONSTRAINT `posting_journal_ibfk_2` FOREIGN KEY (`period_id`) REFERENCES `period` (`id`),
  CONSTRAINT `posting_journal_ibfk_3` FOREIGN KEY (`origin_id`) REFERENCES `transaction_type` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `posting_journal_ibfk_4` FOREIGN KEY (`project_id`) REFERENCES `project` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `posting_journal_ibfk_5` FOREIGN KEY (`currency_id`) REFERENCES `currency` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `posting_journal_ibfk_6` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `posting_journal_ibfk_7` FOREIGN KEY (`cc_id`) REFERENCES `cost_center` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `posting_journal_ibfk_8` FOREIGN KEY (`pc_id`) REFERENCES `profit_center` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

/*Table structure for table `posting_session` */

DROP TABLE IF EXISTS `posting_session`;

CREATE TABLE `posting_session` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` smallint(5) unsigned NOT NULL,
  `date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `posting_session_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=latin1;

/*Table structure for table `price_list` */

DROP TABLE IF EXISTS `price_list`;

CREATE TABLE `price_list` (
  `enterprise_id` smallint(5) unsigned NOT NULL,
  `uuid` char(36) NOT NULL,
  `title` text,
  `description` text,
  PRIMARY KEY (`uuid`),
  KEY `enterprise_id` (`enterprise_id`),
  CONSTRAINT `price_list_ibfk_1` FOREIGN KEY (`enterprise_id`) REFERENCES `enterprise` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

/*Table structure for table `price_list_item` */

DROP TABLE IF EXISTS `price_list_item`;

CREATE TABLE `price_list_item` (
  `uuid` char(36) NOT NULL,
  `item_order` int(10) unsigned NOT NULL,
  `description` text,
  `value` float NOT NULL,
  `is_discount` tinyint(1) NOT NULL DEFAULT '0',
  `is_global` tinyint(1) NOT NULL DEFAULT '0',
  `price_list_uuid` char(36) NOT NULL,
  `inventory_uuid` char(36) DEFAULT NULL,
  PRIMARY KEY (`uuid`),
  KEY `price_list_uuid` (`price_list_uuid`),
  KEY `inventory_uuid` (`inventory_uuid`),
  CONSTRAINT `price_list_item_ibfk_1` FOREIGN KEY (`price_list_uuid`) REFERENCES `price_list` (`uuid`) ON DELETE CASCADE,
  CONSTRAINT `price_list_item_ibfk_2` FOREIGN KEY (`inventory_uuid`) REFERENCES `inventory` (`uuid`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

/*Table structure for table `primary_cash` */

DROP TABLE IF EXISTS `primary_cash`;

CREATE TABLE `primary_cash` (
  `reference` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `uuid` char(36) NOT NULL,
  `project_id` smallint(5) unsigned NOT NULL,
  `type` char(1) NOT NULL,
  `date` date NOT NULL,
  `deb_cred_uuid` char(36) DEFAULT NULL,
  `deb_cred_type` varchar(1) DEFAULT NULL,
  `currency_id` tinyint(3) unsigned NOT NULL,
  `account_id` int(10) unsigned NOT NULL,
  `cost` decimal(19,4) unsigned NOT NULL DEFAULT '0.0000',
  `user_id` smallint(5) unsigned NOT NULL,
  `description` text,
  `cash_box_id` mediumint(8) unsigned NOT NULL,
  `origin_id` tinyint(3) unsigned NOT NULL,
  PRIMARY KEY (`uuid`),
  KEY `project_id` (`project_id`),
  KEY `reference` (`reference`),
  KEY `currency_id` (`currency_id`),
  KEY `user_id` (`user_id`),
  KEY `cash_box_id` (`cash_box_id`),
  KEY `account_id` (`account_id`),
  KEY `origin_id` (`origin_id`),
  CONSTRAINT `primary_cash_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `project` (`id`),
  CONSTRAINT `primary_cash_ibfk_2` FOREIGN KEY (`currency_id`) REFERENCES `currency` (`id`),
  CONSTRAINT `primary_cash_ibfk_3` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`),
  CONSTRAINT `primary_cash_ibfk_4` FOREIGN KEY (`cash_box_id`) REFERENCES `cash_box` (`id`),
  CONSTRAINT `primary_cash_ibfk_5` FOREIGN KEY (`account_id`) REFERENCES `account` (`id`),
  CONSTRAINT `primary_cash_ibfk_6` FOREIGN KEY (`origin_id`) REFERENCES `primary_cash_module` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

/*Table structure for table `primary_cash_item` */

DROP TABLE IF EXISTS `primary_cash_item`;

CREATE TABLE `primary_cash_item` (
  `uuid` varchar(36) NOT NULL,
  `primary_cash_uuid` varchar(36) NOT NULL,
  `debit` decimal(19,4) unsigned NOT NULL DEFAULT '0.0000',
  `credit` decimal(19,4) unsigned NOT NULL DEFAULT '0.0000',
  `inv_po_id` varchar(36) DEFAULT NULL,
  `document_uuid` varchar(36) DEFAULT NULL,
  PRIMARY KEY (`uuid`),
  KEY `primary_cash_uuid` (`primary_cash_uuid`),
  CONSTRAINT `primary_cash_item_ibfk_1` FOREIGN KEY (`primary_cash_uuid`) REFERENCES `primary_cash` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

/*Table structure for table `primary_cash_module` */

DROP TABLE IF EXISTS `primary_cash_module`;

CREATE TABLE `primary_cash_module` (
  `id` tinyint(3) unsigned NOT NULL AUTO_INCREMENT,
  `text` varchar(45) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=latin1;

/*Table structure for table `profit_center` */

DROP TABLE IF EXISTS `profit_center`;

CREATE TABLE `profit_center` (
  `project_id` smallint(5) unsigned NOT NULL,
  `id` smallint(6) NOT NULL AUTO_INCREMENT,
  `text` varchar(100) NOT NULL,
  `note` text,
  PRIMARY KEY (`id`),
  KEY `project_id` (`project_id`),
  CONSTRAINT `profit_center_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `project` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=62 DEFAULT CHARSET=latin1;

/*Table structure for table `project` */

DROP TABLE IF EXISTS `project`;

CREATE TABLE `project` (
  `id` smallint(5) unsigned NOT NULL AUTO_INCREMENT,
  `name` text,
  `abbr` char(3) DEFAULT NULL,
  `enterprise_id` smallint(5) unsigned NOT NULL,
  `zs_id` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `abbr` (`abbr`),
  KEY `enterprise_id` (`enterprise_id`),
  CONSTRAINT `project_ibfk_1` FOREIGN KEY (`enterprise_id`) REFERENCES `enterprise` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=latin1;

/*Table structure for table `project_permission` */

DROP TABLE IF EXISTS `project_permission`;

CREATE TABLE `project_permission` (
  `id` smallint(5) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` smallint(5) unsigned NOT NULL,
  `project_id` smallint(5) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id_2` (`user_id`,`project_id`),
  KEY `user_id` (`user_id`),
  KEY `project_id` (`project_id`),
  CONSTRAINT `project_permission_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `project` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=32 DEFAULT CHARSET=latin1;

/*Table structure for table `province` */

DROP TABLE IF EXISTS `province`;

CREATE TABLE `province` (
  `uuid` char(36) NOT NULL,
  `name` text,
  `country_uuid` char(36) NOT NULL,
  PRIMARY KEY (`uuid`),
  KEY `country_uuid` (`country_uuid`),
  CONSTRAINT `province_ibfk_1` FOREIGN KEY (`country_uuid`) REFERENCES `country` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

/*Table structure for table `purchase` */

DROP TABLE IF EXISTS `purchase`;

CREATE TABLE `purchase` (
  `project_id` smallint(5) unsigned NOT NULL,
  `reference` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `uuid` char(36) NOT NULL,
  `cost` decimal(19,4) unsigned NOT NULL DEFAULT '0.0000',
  `currency_id` tinyint(3) unsigned NOT NULL,
  `creditor_uuid` char(36) DEFAULT NULL,
  `purchaser_id` smallint(5) unsigned NOT NULL,
  `employee_id` int(10) unsigned DEFAULT NULL,
  `discount` mediumint(8) unsigned DEFAULT '0',
  `purchase_date` date NOT NULL,
  `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `note` text,
  `paid` tinyint(1) DEFAULT '0',
  `paid_uuid` char(36) DEFAULT NULL,
  `confirmed` tinyint(1) NOT NULL DEFAULT '0',
  `closed` tinyint(1) DEFAULT '0',
  `is_direct` tinyint(1) DEFAULT '0',
  `is_donation` tinyint(1) DEFAULT '0',
  `header_id` int(10) unsigned DEFAULT NULL,
  `issuer_id` int(10) unsigned DEFAULT NULL,
  `is_authorized` tinyint(1) DEFAULT '0',
  `is_validate` tinyint(1) DEFAULT '0',
  `confirmed_by` int(10) unsigned DEFAULT NULL,
  `is_integration` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`uuid`),
  KEY `project_id` (`project_id`),
  KEY `reference` (`reference`),
  KEY `creditor_uuid` (`creditor_uuid`),
  KEY `purchaser_id` (`purchaser_id`),
  KEY `paid_uuid` (`paid_uuid`),
  CONSTRAINT `purchase_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `project` (`id`),
  CONSTRAINT `purchase_ibfk_2` FOREIGN KEY (`creditor_uuid`) REFERENCES `creditor` (`uuid`),
  CONSTRAINT `purchase_ibfk_3` FOREIGN KEY (`purchaser_id`) REFERENCES `user` (`id`),
  CONSTRAINT `purchase_ibfk_4` FOREIGN KEY (`paid_uuid`) REFERENCES `primary_cash` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

/*Table structure for table `purchase_item` */

DROP TABLE IF EXISTS `purchase_item`;

CREATE TABLE `purchase_item` (
  `purchase_uuid` char(36) NOT NULL,
  `uuid` char(36) NOT NULL,
  `inventory_uuid` char(36) NOT NULL,
  `quantity` int(10) unsigned DEFAULT '0',
  `unit_price` decimal(10,4) unsigned NOT NULL,
  `total` decimal(10,4) unsigned DEFAULT NULL,
  PRIMARY KEY (`uuid`),
  KEY `purchase_uuid` (`purchase_uuid`),
  KEY `inventory_uuid` (`inventory_uuid`),
  CONSTRAINT `purchase_item_ibfk_1` FOREIGN KEY (`purchase_uuid`) REFERENCES `purchase` (`uuid`) ON DELETE CASCADE,
  CONSTRAINT `purchase_item_ibfk_2` FOREIGN KEY (`inventory_uuid`) REFERENCES `inventory` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

/*Table structure for table `rubric` */

DROP TABLE IF EXISTS `rubric`;

CREATE TABLE `rubric` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `label` text,
  `abbr` varchar(4) DEFAULT NULL,
  `is_discount` tinyint(1) DEFAULT NULL,
  `is_percent` tinyint(1) DEFAULT NULL,
  `value` float DEFAULT '0',
  `is_advance` tinyint(1) DEFAULT NULL,
  `is_social_care` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

/*Table structure for table `rubric_paiement` */

DROP TABLE IF EXISTS `rubric_paiement`;

CREATE TABLE `rubric_paiement` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `paiement_uuid` char(36) NOT NULL,
  `rubric_id` int(10) unsigned NOT NULL,
  `value` float DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `paiement_uuid` (`paiement_uuid`),
  KEY `rubric_id` (`rubric_id`),
  CONSTRAINT `rubric_paiement_ibfk_1` FOREIGN KEY (`paiement_uuid`) REFERENCES `paiement` (`uuid`),
  CONSTRAINT `rubric_paiement_ibfk_2` FOREIGN KEY (`rubric_id`) REFERENCES `rubric` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

/*Table structure for table `sale` */

DROP TABLE IF EXISTS `sale`;

CREATE TABLE `sale` (
  `project_id` smallint(5) unsigned NOT NULL,
  `reference` int(10) unsigned NOT NULL,
  `uuid` char(36) NOT NULL,
  `cost` decimal(19,4) unsigned NOT NULL,
  `currency_id` tinyint(3) unsigned NOT NULL,
  `debitor_uuid` char(36) DEFAULT NULL,
  `service_id` smallint(5) unsigned DEFAULT NULL,
  `seller_id` smallint(5) unsigned NOT NULL DEFAULT '0',
  `discount` mediumint(8) unsigned DEFAULT '0',
  `invoice_date` date NOT NULL,
  `note` text,
  `posted` tinyint(1) NOT NULL DEFAULT '0',
  `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_distributable` bit(1) NOT NULL DEFAULT b'1',
  PRIMARY KEY (`uuid`),
  KEY `reference` (`reference`),
  KEY `project_id` (`project_id`),
  KEY `debitor_uuid` (`debitor_uuid`),
  KEY `currency_id` (`currency_id`),
  KEY `service_id` (`service_id`),
  CONSTRAINT `sale_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `project` (`id`),
  CONSTRAINT `sale_ibfk_2` FOREIGN KEY (`debitor_uuid`) REFERENCES `debitor` (`uuid`),
  CONSTRAINT `sale_ibfk_3` FOREIGN KEY (`currency_id`) REFERENCES `currency` (`id`),
  CONSTRAINT `sale_ibfk_4` FOREIGN KEY (`service_id`) REFERENCES `service` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

/*Table structure for table `sale_item` */

DROP TABLE IF EXISTS `sale_item`;

CREATE TABLE `sale_item` (
  `sale_uuid` char(36) NOT NULL,
  `uuid` char(36) NOT NULL,
  `inventory_uuid` char(36) NOT NULL,
  `quantity` int(10) unsigned DEFAULT '0',
  `inventory_price` decimal(19,4) DEFAULT NULL,
  `transaction_price` decimal(19,4) NOT NULL,
  `debit` decimal(19,4) NOT NULL DEFAULT '0.0000',
  `credit` decimal(19,4) NOT NULL DEFAULT '0.0000',
  PRIMARY KEY (`uuid`),
  KEY `sale_uuid` (`sale_uuid`),
  KEY `inventory_uuid` (`inventory_uuid`),
  CONSTRAINT `sale_item_ibfk_1` FOREIGN KEY (`sale_uuid`) REFERENCES `sale` (`uuid`) ON DELETE CASCADE,
  CONSTRAINT `sale_item_ibfk_2` FOREIGN KEY (`inventory_uuid`) REFERENCES `inventory` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

/*Table structure for table `sale_subsidy` */

DROP TABLE IF EXISTS `sale_subsidy`;

CREATE TABLE `sale_subsidy` (
  `uuid` char(36) NOT NULL,
  `sale_uuid` char(36) NOT NULL,
  `subsidy_uuid` char(36) NOT NULL,
  `value` decimal(19,4) DEFAULT '0.0000',
  PRIMARY KEY (`uuid`),
  KEY `sale_uuid` (`sale_uuid`),
  KEY `subsidy_uuid` (`subsidy_uuid`),
  CONSTRAINT `sale_subsidy_ibfk_1` FOREIGN KEY (`sale_uuid`) REFERENCES `sale` (`uuid`) ON DELETE CASCADE,
  CONSTRAINT `sale_subsidy_ibfk_2` FOREIGN KEY (`subsidy_uuid`) REFERENCES `subsidy` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

/*Table structure for table `sector` */

DROP TABLE IF EXISTS `sector`;

CREATE TABLE `sector` (
  `uuid` char(36) NOT NULL,
  `name` text,
  `province_uuid` char(36) NOT NULL,
  PRIMARY KEY (`uuid`),
  KEY `province_id` (`province_uuid`),
  CONSTRAINT `sector_ibfk_1` FOREIGN KEY (`province_uuid`) REFERENCES `province` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

/*Table structure for table `service` */

DROP TABLE IF EXISTS `service`;

CREATE TABLE `service` (
  `id` smallint(5) unsigned NOT NULL AUTO_INCREMENT,
  `project_id` smallint(5) unsigned NOT NULL,
  `name` text NOT NULL,
  `cost_center_id` smallint(6) DEFAULT NULL,
  `profit_center_id` smallint(6) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `project_id` (`project_id`),
  KEY `cost_center_id` (`cost_center_id`),
  KEY `profit_center_id` (`profit_center_id`),
  CONSTRAINT `service_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `project` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `service_ibfk_2` FOREIGN KEY (`cost_center_id`) REFERENCES `cost_center` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `service_ibfk_3` FOREIGN KEY (`profit_center_id`) REFERENCES `profit_center` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=44 DEFAULT CHARSET=latin1;

/*Table structure for table `stock` */

DROP TABLE IF EXISTS `stock`;

CREATE TABLE `stock` (
  `inventory_uuid` char(36) NOT NULL,
  `tracking_number` char(50) NOT NULL,
  `expiration_date` date NOT NULL,
  `entry_date` date NOT NULL,
  `lot_number` varchar(70) NOT NULL,
  `purchase_order_uuid` char(36) DEFAULT NULL,
  `quantity` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`tracking_number`),
  KEY `inventory_uuid` (`inventory_uuid`),
  KEY `purchase_order_uuid` (`purchase_order_uuid`),
  CONSTRAINT `stock_ibfk_1` FOREIGN KEY (`inventory_uuid`) REFERENCES `inventory` (`uuid`),
  CONSTRAINT `stock_ibfk_2` FOREIGN KEY (`purchase_order_uuid`) REFERENCES `purchase` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

/*Table structure for table `subsidy` */

DROP TABLE IF EXISTS `subsidy`;

CREATE TABLE `subsidy` (
  `uuid` char(36) NOT NULL,
  `text` text,
  `value` float DEFAULT '0',
  `is_percent` tinyint(1) DEFAULT NULL,
  `debitor_group_uuid` char(36) NOT NULL,
  PRIMARY KEY (`uuid`),
  KEY `debitor_group_uuid` (`debitor_group_uuid`),
  CONSTRAINT `subsidy_ibfk_1` FOREIGN KEY (`debitor_group_uuid`) REFERENCES `debitor_group` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

/*Table structure for table `supplier` */

DROP TABLE IF EXISTS `supplier`;

CREATE TABLE `supplier` (
  `uuid` char(36) NOT NULL DEFAULT '',
  `creditor_uuid` char(36) NOT NULL,
  `name` varchar(45) NOT NULL,
  `address_1` text,
  `address_2` text,
  `location_id` char(36) NOT NULL,
  `email` varchar(45) DEFAULT NULL,
  `fax` varchar(45) DEFAULT NULL,
  `note` varchar(50) DEFAULT NULL,
  `phone` varchar(15) DEFAULT NULL,
  `international` tinyint(1) NOT NULL DEFAULT '0',
  `locked` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`uuid`),
  KEY `creditor_uuid` (`creditor_uuid`),
  KEY `location_id` (`location_id`),
  CONSTRAINT `supplier_ibfk_1` FOREIGN KEY (`location_id`) REFERENCES `village` (`uuid`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `supplier_ibfk_2` FOREIGN KEY (`creditor_uuid`) REFERENCES `creditor` (`uuid`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

/*Table structure for table `sym_channel` */

DROP TABLE IF EXISTS `sym_channel`;

CREATE TABLE `sym_channel` (
  `channel_id` varchar(20) NOT NULL,
  `processing_order` int(11) NOT NULL DEFAULT '1',
  `max_batch_size` int(11) NOT NULL DEFAULT '1000',
  `max_batch_to_send` int(11) NOT NULL DEFAULT '60',
  `max_data_to_route` int(11) NOT NULL DEFAULT '100000',
  `extract_period_millis` int(11) NOT NULL DEFAULT '0',
  `enabled` smallint(6) NOT NULL DEFAULT '1',
  `use_old_data_to_route` smallint(6) NOT NULL DEFAULT '1',
  `use_row_data_to_route` smallint(6) NOT NULL DEFAULT '1',
  `use_pk_data_to_route` smallint(6) NOT NULL DEFAULT '1',
  `contains_big_lob` smallint(6) NOT NULL DEFAULT '0',
  `batch_algorithm` varchar(50) NOT NULL DEFAULT 'default',
  `data_loader_type` varchar(50) NOT NULL DEFAULT 'default',
  `description` varchar(255) DEFAULT NULL,
  `create_time` datetime DEFAULT NULL,
  `last_update_by` varchar(50) DEFAULT NULL,
  `last_update_time` datetime DEFAULT NULL,
  PRIMARY KEY (`channel_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

/*Table structure for table `sym_conflict` */

DROP TABLE IF EXISTS `sym_conflict`;

CREATE TABLE `sym_conflict` (
  `conflict_id` varchar(50) NOT NULL,
  `source_node_group_id` varchar(50) NOT NULL,
  `target_node_group_id` varchar(50) NOT NULL,
  `target_channel_id` varchar(20) DEFAULT NULL,
  `target_catalog_name` varchar(255) DEFAULT NULL,
  `target_schema_name` varchar(255) DEFAULT NULL,
  `target_table_name` varchar(255) DEFAULT NULL,
  `detect_type` varchar(128) NOT NULL,
  `detect_expression` mediumtext,
  `resolve_type` varchar(128) NOT NULL,
  `ping_back` varchar(128) NOT NULL,
  `resolve_changes_only` smallint(6) DEFAULT '0',
  `resolve_row_only` smallint(6) DEFAULT '0',
  `create_time` datetime NOT NULL,
  `last_update_by` varchar(50) DEFAULT NULL,
  `last_update_time` datetime NOT NULL,
  PRIMARY KEY (`conflict_id`),
  KEY `sym_fk_cf_2_grp_lnk` (`source_node_group_id`,`target_node_group_id`),
  CONSTRAINT `sym_fk_cf_2_grp_lnk` FOREIGN KEY (`source_node_group_id`, `target_node_group_id`) REFERENCES `sym_node_group_link` (`source_node_group_id`, `target_node_group_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

/*Table structure for table `sym_data` */

DROP TABLE IF EXISTS `sym_data`;

CREATE TABLE `sym_data` (
  `data_id` bigint(20) NOT NULL AUTO_INCREMENT,
  `table_name` varchar(255) NOT NULL,
  `event_type` char(1) NOT NULL,
  `row_data` mediumtext,
  `pk_data` mediumtext,
  `old_data` mediumtext,
  `trigger_hist_id` int(11) NOT NULL,
  `channel_id` varchar(20) DEFAULT NULL,
  `transaction_id` varchar(255) DEFAULT NULL,
  `source_node_id` varchar(50) DEFAULT NULL,
  `external_data` varchar(50) DEFAULT NULL,
  `node_list` varchar(255) DEFAULT NULL,
  `create_time` datetime DEFAULT NULL,
  PRIMARY KEY (`data_id`),
  KEY `sym_idx_d_channel_id` (`data_id`,`channel_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

/*Table structure for table `sym_data_event` */

DROP TABLE IF EXISTS `sym_data_event`;

CREATE TABLE `sym_data_event` (
  `data_id` bigint(20) NOT NULL,
  `batch_id` bigint(20) NOT NULL,
  `router_id` varchar(50) NOT NULL,
  `create_time` datetime DEFAULT NULL,
  PRIMARY KEY (`data_id`,`batch_id`,`router_id`),
  KEY `sym_idx_de_batchid` (`batch_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

/*Table structure for table `sym_data_gap` */

DROP TABLE IF EXISTS `sym_data_gap`;

CREATE TABLE `sym_data_gap` (
  `start_id` bigint(20) NOT NULL,
  `end_id` bigint(20) NOT NULL,
  `status` char(2) DEFAULT NULL,
  `create_time` datetime NOT NULL,
  `last_update_hostname` varchar(255) DEFAULT NULL,
  `last_update_time` datetime NOT NULL,
  PRIMARY KEY (`start_id`,`end_id`),
  KEY `sym_idx_dg_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

/*Table structure for table `sym_extract_request` */

DROP TABLE IF EXISTS `sym_extract_request`;

CREATE TABLE `sym_extract_request` (
  `request_id` bigint(20) NOT NULL AUTO_INCREMENT,
  `node_id` varchar(50) NOT NULL,
  `status` char(2) DEFAULT NULL,
  `start_batch_id` bigint(20) NOT NULL,
  `end_batch_id` bigint(20) NOT NULL,
  `trigger_id` varchar(50) NOT NULL,
  `router_id` varchar(50) NOT NULL,
  `last_update_time` datetime DEFAULT NULL,
  `create_time` datetime DEFAULT NULL,
  PRIMARY KEY (`request_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

/*Table structure for table `sym_file_incoming` */

DROP TABLE IF EXISTS `sym_file_incoming`;

CREATE TABLE `sym_file_incoming` (
  `relative_dir` varchar(255) NOT NULL,
  `file_name` varchar(128) NOT NULL,
  `last_event_type` char(1) NOT NULL,
  `node_id` varchar(50) NOT NULL,
  `file_modified_time` bigint(20) DEFAULT NULL,
  PRIMARY KEY (`relative_dir`,`file_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

/*Table structure for table `sym_file_snapshot` */

DROP TABLE IF EXISTS `sym_file_snapshot`;

CREATE TABLE `sym_file_snapshot` (
  `trigger_id` varchar(50) NOT NULL,
  `router_id` varchar(50) NOT NULL,
  `relative_dir` varchar(255) NOT NULL,
  `file_name` varchar(128) NOT NULL,
  `last_event_type` char(1) NOT NULL,
  `crc32_checksum` bigint(20) DEFAULT NULL,
  `file_size` bigint(20) DEFAULT NULL,
  `file_modified_time` bigint(20) DEFAULT NULL,
  `last_update_time` datetime NOT NULL,
  `last_update_by` varchar(50) DEFAULT NULL,
  `create_time` datetime NOT NULL,
  PRIMARY KEY (`trigger_id`,`router_id`,`relative_dir`,`file_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

/*Table structure for table `sym_file_trigger` */

DROP TABLE IF EXISTS `sym_file_trigger`;

CREATE TABLE `sym_file_trigger` (
  `trigger_id` varchar(50) NOT NULL,
  `base_dir` varchar(255) NOT NULL,
  `recurse` smallint(6) NOT NULL DEFAULT '1',
  `includes_files` varchar(255) DEFAULT NULL,
  `excludes_files` varchar(255) DEFAULT NULL,
  `sync_on_create` smallint(6) NOT NULL DEFAULT '1',
  `sync_on_modified` smallint(6) NOT NULL DEFAULT '1',
  `sync_on_delete` smallint(6) NOT NULL DEFAULT '1',
  `before_copy_script` mediumtext,
  `after_copy_script` mediumtext,
  `create_time` datetime NOT NULL,
  `last_update_by` varchar(50) DEFAULT NULL,
  `last_update_time` datetime NOT NULL,
  PRIMARY KEY (`trigger_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

/*Table structure for table `sym_file_trigger_router` */

DROP TABLE IF EXISTS `sym_file_trigger_router`;

CREATE TABLE `sym_file_trigger_router` (
  `trigger_id` varchar(50) NOT NULL,
  `router_id` varchar(50) NOT NULL,
  `enabled` smallint(6) NOT NULL DEFAULT '1',
  `initial_load_enabled` smallint(6) NOT NULL DEFAULT '1',
  `target_base_dir` varchar(255) DEFAULT NULL,
  `conflict_strategy` varchar(128) NOT NULL DEFAULT 'source_wins',
  `create_time` datetime NOT NULL,
  `last_update_by` varchar(50) DEFAULT NULL,
  `last_update_time` datetime NOT NULL,
  PRIMARY KEY (`trigger_id`,`router_id`),
  KEY `sym_fk_ftr_2_rtr` (`router_id`),
  CONSTRAINT `sym_fk_ftr_2_ftrg` FOREIGN KEY (`trigger_id`) REFERENCES `sym_file_trigger` (`trigger_id`),
  CONSTRAINT `sym_fk_ftr_2_rtr` FOREIGN KEY (`router_id`) REFERENCES `sym_router` (`router_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

/*Table structure for table `sym_grouplet` */

DROP TABLE IF EXISTS `sym_grouplet`;

CREATE TABLE `sym_grouplet` (
  `grouplet_id` varchar(50) NOT NULL,
  `grouplet_link_policy` char(1) NOT NULL DEFAULT 'I',
  `description` varchar(255) DEFAULT NULL,
  `create_time` datetime NOT NULL,
  `last_update_by` varchar(50) DEFAULT NULL,
  `last_update_time` datetime NOT NULL,
  PRIMARY KEY (`grouplet_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

/*Table structure for table `sym_grouplet_link` */

DROP TABLE IF EXISTS `sym_grouplet_link`;

CREATE TABLE `sym_grouplet_link` (
  `grouplet_id` varchar(50) NOT NULL,
  `external_id` varchar(50) NOT NULL,
  `create_time` datetime NOT NULL,
  `last_update_by` varchar(50) DEFAULT NULL,
  `last_update_time` datetime NOT NULL,
  PRIMARY KEY (`grouplet_id`,`external_id`),
  CONSTRAINT `sym_fk_gpltlnk_2_gplt` FOREIGN KEY (`grouplet_id`) REFERENCES `sym_grouplet` (`grouplet_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

/*Table structure for table `sym_incoming_batch` */

DROP TABLE IF EXISTS `sym_incoming_batch`;

CREATE TABLE `sym_incoming_batch` (
  `batch_id` bigint(20) NOT NULL,
  `node_id` varchar(50) NOT NULL,
  `channel_id` varchar(20) DEFAULT NULL,
  `status` char(2) DEFAULT NULL,
  `error_flag` smallint(6) DEFAULT '0',
  `network_millis` bigint(20) NOT NULL DEFAULT '0',
  `filter_millis` bigint(20) NOT NULL DEFAULT '0',
  `database_millis` bigint(20) NOT NULL DEFAULT '0',
  `failed_row_number` bigint(20) NOT NULL DEFAULT '0',
  `failed_line_number` bigint(20) NOT NULL DEFAULT '0',
  `byte_count` bigint(20) NOT NULL DEFAULT '0',
  `statement_count` bigint(20) NOT NULL DEFAULT '0',
  `fallback_insert_count` bigint(20) NOT NULL DEFAULT '0',
  `fallback_update_count` bigint(20) NOT NULL DEFAULT '0',
  `ignore_count` bigint(20) NOT NULL DEFAULT '0',
  `missing_delete_count` bigint(20) NOT NULL DEFAULT '0',
  `skip_count` bigint(20) NOT NULL DEFAULT '0',
  `sql_state` varchar(10) DEFAULT NULL,
  `sql_code` int(11) NOT NULL DEFAULT '0',
  `sql_message` mediumtext,
  `last_update_hostname` varchar(255) DEFAULT NULL,
  `last_update_time` datetime DEFAULT NULL,
  `create_time` datetime DEFAULT NULL,
  PRIMARY KEY (`batch_id`,`node_id`),
  KEY `sym_idx_ib_time_status` (`create_time`,`status`),
  KEY `sym_idx_ib_in_error` (`error_flag`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

/*Table structure for table `sym_incoming_error` */

DROP TABLE IF EXISTS `sym_incoming_error`;

CREATE TABLE `sym_incoming_error` (
  `batch_id` bigint(20) NOT NULL,
  `node_id` varchar(50) NOT NULL,
  `failed_row_number` bigint(20) NOT NULL,
  `failed_line_number` bigint(20) NOT NULL DEFAULT '0',
  `target_catalog_name` varchar(255) DEFAULT NULL,
  `target_schema_name` varchar(255) DEFAULT NULL,
  `target_table_name` varchar(255) NOT NULL,
  `event_type` char(1) NOT NULL,
  `binary_encoding` varchar(10) NOT NULL DEFAULT 'HEX',
  `column_names` mediumtext NOT NULL,
  `pk_column_names` mediumtext NOT NULL,
  `row_data` mediumtext,
  `old_data` mediumtext,
  `cur_data` mediumtext,
  `resolve_data` mediumtext,
  `resolve_ignore` smallint(6) DEFAULT '0',
  `conflict_id` varchar(50) DEFAULT NULL,
  `create_time` datetime DEFAULT NULL,
  `last_update_by` varchar(50) DEFAULT NULL,
  `last_update_time` datetime NOT NULL,
  PRIMARY KEY (`batch_id`,`node_id`,`failed_row_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

/*Table structure for table `sym_load_filter` */

DROP TABLE IF EXISTS `sym_load_filter`;

CREATE TABLE `sym_load_filter` (
  `load_filter_id` varchar(50) NOT NULL,
  `load_filter_type` varchar(10) NOT NULL,
  `source_node_group_id` varchar(50) NOT NULL,
  `target_node_group_id` varchar(50) NOT NULL,
  `target_catalog_name` varchar(255) DEFAULT NULL,
  `target_schema_name` varchar(255) DEFAULT NULL,
  `target_table_name` varchar(255) DEFAULT NULL,
  `filter_on_update` smallint(6) NOT NULL DEFAULT '1',
  `filter_on_insert` smallint(6) NOT NULL DEFAULT '1',
  `filter_on_delete` smallint(6) NOT NULL DEFAULT '1',
  `before_write_script` mediumtext,
  `after_write_script` mediumtext,
  `batch_complete_script` mediumtext,
  `batch_commit_script` mediumtext,
  `batch_rollback_script` mediumtext,
  `handle_error_script` mediumtext,
  `create_time` datetime NOT NULL,
  `last_update_by` varchar(50) DEFAULT NULL,
  `last_update_time` datetime NOT NULL,
  `load_filter_order` int(11) NOT NULL DEFAULT '1',
  `fail_on_error` smallint(6) NOT NULL DEFAULT '0',
  PRIMARY KEY (`load_filter_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

/*Table structure for table `sym_lock` */

DROP TABLE IF EXISTS `sym_lock`;

CREATE TABLE `sym_lock` (
  `lock_action` varchar(50) NOT NULL,
  `locking_server_id` varchar(255) DEFAULT NULL,
  `lock_time` datetime DEFAULT NULL,
  `last_lock_time` datetime DEFAULT NULL,
  `last_locking_server_id` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`lock_action`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

/*Table structure for table `sym_node` */

DROP TABLE IF EXISTS `sym_node`;

CREATE TABLE `sym_node` (
  `node_id` varchar(50) NOT NULL,
  `node_group_id` varchar(50) NOT NULL,
  `external_id` varchar(50) NOT NULL,
  `sync_enabled` smallint(6) DEFAULT '0',
  `sync_url` varchar(255) DEFAULT NULL,
  `schema_version` varchar(50) DEFAULT NULL,
  `symmetric_version` varchar(50) DEFAULT NULL,
  `database_type` varchar(50) DEFAULT NULL,
  `database_version` varchar(50) DEFAULT NULL,
  `heartbeat_time` datetime DEFAULT NULL,
  `timezone_offset` varchar(6) DEFAULT NULL,
  `batch_to_send_count` int(11) DEFAULT '0',
  `batch_in_error_count` int(11) DEFAULT '0',
  `created_at_node_id` varchar(50) DEFAULT NULL,
  `deployment_type` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`node_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

/*Table structure for table `sym_node_channel_ctl` */

DROP TABLE IF EXISTS `sym_node_channel_ctl`;

CREATE TABLE `sym_node_channel_ctl` (
  `node_id` varchar(50) NOT NULL,
  `channel_id` varchar(20) NOT NULL,
  `suspend_enabled` smallint(6) DEFAULT '0',
  `ignore_enabled` smallint(6) DEFAULT '0',
  `last_extract_time` datetime DEFAULT NULL,
  PRIMARY KEY (`node_id`,`channel_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

/*Table structure for table `sym_node_communication` */

DROP TABLE IF EXISTS `sym_node_communication`;

CREATE TABLE `sym_node_communication` (
  `node_id` varchar(50) NOT NULL,
  `communication_type` varchar(10) NOT NULL,
  `lock_time` datetime DEFAULT NULL,
  `locking_server_id` varchar(255) DEFAULT NULL,
  `last_lock_time` datetime DEFAULT NULL,
  `last_lock_millis` bigint(20) DEFAULT '0',
  `success_count` bigint(20) DEFAULT '0',
  `fail_count` bigint(20) DEFAULT '0',
  `total_success_count` bigint(20) DEFAULT '0',
  `total_fail_count` bigint(20) DEFAULT '0',
  `total_success_millis` bigint(20) DEFAULT '0',
  `total_fail_millis` bigint(20) DEFAULT '0',
  PRIMARY KEY (`node_id`,`communication_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

/*Table structure for table `sym_node_group` */

DROP TABLE IF EXISTS `sym_node_group`;

CREATE TABLE `sym_node_group` (
  `node_group_id` varchar(50) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `create_time` datetime DEFAULT NULL,
  `last_update_by` varchar(50) DEFAULT NULL,
  `last_update_time` datetime DEFAULT NULL,
  PRIMARY KEY (`node_group_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

/*Table structure for table `sym_node_group_channel_wnd` */

DROP TABLE IF EXISTS `sym_node_group_channel_wnd`;

CREATE TABLE `sym_node_group_channel_wnd` (
  `node_group_id` varchar(50) NOT NULL,
  `channel_id` varchar(20) NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `enabled` smallint(6) NOT NULL DEFAULT '0',
  PRIMARY KEY (`node_group_id`,`channel_id`,`start_time`,`end_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

/*Table structure for table `sym_node_group_link` */

DROP TABLE IF EXISTS `sym_node_group_link`;

CREATE TABLE `sym_node_group_link` (
  `source_node_group_id` varchar(50) NOT NULL,
  `target_node_group_id` varchar(50) NOT NULL,
  `data_event_action` char(1) NOT NULL DEFAULT 'W',
  `create_time` datetime DEFAULT NULL,
  `last_update_by` varchar(50) DEFAULT NULL,
  `last_update_time` datetime DEFAULT NULL,
  PRIMARY KEY (`source_node_group_id`,`target_node_group_id`),
  KEY `sym_fk_lnk_2_grp_tgt` (`target_node_group_id`),
  CONSTRAINT `sym_fk_lnk_2_grp_src` FOREIGN KEY (`source_node_group_id`) REFERENCES `sym_node_group` (`node_group_id`),
  CONSTRAINT `sym_fk_lnk_2_grp_tgt` FOREIGN KEY (`target_node_group_id`) REFERENCES `sym_node_group` (`node_group_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

/*Table structure for table `sym_node_host` */

DROP TABLE IF EXISTS `sym_node_host`;

CREATE TABLE `sym_node_host` (
  `node_id` varchar(50) NOT NULL,
  `host_name` varchar(60) NOT NULL,
  `ip_address` varchar(50) DEFAULT NULL,
  `os_user` varchar(50) DEFAULT NULL,
  `os_name` varchar(50) DEFAULT NULL,
  `os_arch` varchar(50) DEFAULT NULL,
  `os_version` varchar(50) DEFAULT NULL,
  `available_processors` int(11) DEFAULT '0',
  `free_memory_bytes` bigint(20) DEFAULT '0',
  `total_memory_bytes` bigint(20) DEFAULT '0',
  `max_memory_bytes` bigint(20) DEFAULT '0',
  `java_version` varchar(50) DEFAULT NULL,
  `java_vendor` varchar(255) DEFAULT NULL,
  `symmetric_version` varchar(50) DEFAULT NULL,
  `timezone_offset` varchar(6) DEFAULT NULL,
  `heartbeat_time` datetime DEFAULT NULL,
  `last_restart_time` datetime NOT NULL,
  `create_time` datetime NOT NULL,
  PRIMARY KEY (`node_id`,`host_name`),
  CONSTRAINT `sym_fk_host_2_node` FOREIGN KEY (`node_id`) REFERENCES `sym_node` (`node_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

/*Table structure for table `sym_node_host_channel_stats` */

DROP TABLE IF EXISTS `sym_node_host_channel_stats`;

CREATE TABLE `sym_node_host_channel_stats` (
  `node_id` varchar(50) NOT NULL,
  `host_name` varchar(60) NOT NULL,
  `channel_id` varchar(20) NOT NULL,
  `start_time` datetime NOT NULL,
  `end_time` datetime NOT NULL,
  `data_routed` bigint(20) DEFAULT '0',
  `data_unrouted` bigint(20) DEFAULT '0',
  `data_event_inserted` bigint(20) DEFAULT '0',
  `data_extracted` bigint(20) DEFAULT '0',
  `data_bytes_extracted` bigint(20) DEFAULT '0',
  `data_extracted_errors` bigint(20) DEFAULT '0',
  `data_bytes_sent` bigint(20) DEFAULT '0',
  `data_sent` bigint(20) DEFAULT '0',
  `data_sent_errors` bigint(20) DEFAULT '0',
  `data_loaded` bigint(20) DEFAULT '0',
  `data_bytes_loaded` bigint(20) DEFAULT '0',
  `data_loaded_errors` bigint(20) DEFAULT '0',
  PRIMARY KEY (`node_id`,`host_name`,`channel_id`,`start_time`,`end_time`),
  KEY `sym_idx_nd_hst_chnl_sts` (`node_id`,`start_time`,`end_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

/*Table structure for table `sym_node_host_job_stats` */

DROP TABLE IF EXISTS `sym_node_host_job_stats`;

CREATE TABLE `sym_node_host_job_stats` (
  `node_id` varchar(50) NOT NULL,
  `host_name` varchar(60) NOT NULL,
  `job_name` varchar(50) NOT NULL,
  `start_time` datetime NOT NULL,
  `end_time` datetime NOT NULL,
  `processed_count` bigint(20) DEFAULT '0',
  PRIMARY KEY (`node_id`,`host_name`,`job_name`,`start_time`,`end_time`),
  KEY `sym_idx_nd_hst_job` (`node_id`,`start_time`,`end_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

/*Table structure for table `sym_node_host_stats` */

DROP TABLE IF EXISTS `sym_node_host_stats`;

CREATE TABLE `sym_node_host_stats` (
  `node_id` varchar(50) NOT NULL,
  `host_name` varchar(60) NOT NULL,
  `start_time` datetime NOT NULL,
  `end_time` datetime NOT NULL,
  `restarted` bigint(20) NOT NULL DEFAULT '0',
  `nodes_pulled` bigint(20) DEFAULT '0',
  `total_nodes_pull_time` bigint(20) DEFAULT '0',
  `nodes_pushed` bigint(20) DEFAULT '0',
  `total_nodes_push_time` bigint(20) DEFAULT '0',
  `nodes_rejected` bigint(20) DEFAULT '0',
  `nodes_registered` bigint(20) DEFAULT '0',
  `nodes_loaded` bigint(20) DEFAULT '0',
  `nodes_disabled` bigint(20) DEFAULT '0',
  `purged_data_rows` bigint(20) DEFAULT '0',
  `purged_data_event_rows` bigint(20) DEFAULT '0',
  `purged_batch_outgoing_rows` bigint(20) DEFAULT '0',
  `purged_batch_incoming_rows` bigint(20) DEFAULT '0',
  `triggers_created_count` bigint(20) DEFAULT NULL,
  `triggers_rebuilt_count` bigint(20) DEFAULT NULL,
  `triggers_removed_count` bigint(20) DEFAULT NULL,
  PRIMARY KEY (`node_id`,`host_name`,`start_time`,`end_time`),
  KEY `sym_idx_nd_hst_sts` (`node_id`,`start_time`,`end_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

/*Table structure for table `sym_node_identity` */

DROP TABLE IF EXISTS `sym_node_identity`;

CREATE TABLE `sym_node_identity` (
  `node_id` varchar(50) NOT NULL,
  PRIMARY KEY (`node_id`),
  CONSTRAINT `sym_fk_ident_2_node` FOREIGN KEY (`node_id`) REFERENCES `sym_node` (`node_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

/*Table structure for table `sym_node_security` */

DROP TABLE IF EXISTS `sym_node_security`;

CREATE TABLE `sym_node_security` (
  `node_id` varchar(50) NOT NULL,
  `node_password` varchar(50) NOT NULL,
  `registration_enabled` smallint(6) DEFAULT '0',
  `registration_time` datetime DEFAULT NULL,
  `initial_load_enabled` smallint(6) DEFAULT '0',
  `initial_load_time` datetime DEFAULT NULL,
  `initial_load_id` bigint(20) DEFAULT NULL,
  `initial_load_create_by` varchar(255) DEFAULT NULL,
  `rev_initial_load_enabled` smallint(6) DEFAULT '0',
  `rev_initial_load_time` datetime DEFAULT NULL,
  `rev_initial_load_id` bigint(20) DEFAULT NULL,
  `rev_initial_load_create_by` varchar(255) DEFAULT NULL,
  `created_at_node_id` varchar(50) NOT NULL,
  PRIMARY KEY (`node_id`),
  CONSTRAINT `sym_fk_sec_2_node` FOREIGN KEY (`node_id`) REFERENCES `sym_node` (`node_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

/*Table structure for table `sym_outgoing_batch` */

DROP TABLE IF EXISTS `sym_outgoing_batch`;

CREATE TABLE `sym_outgoing_batch` (
  `batch_id` bigint(20) NOT NULL,
  `node_id` varchar(50) NOT NULL,
  `channel_id` varchar(20) DEFAULT NULL,
  `status` char(2) DEFAULT NULL,
  `load_id` bigint(20) DEFAULT NULL,
  `extract_job_flag` smallint(6) DEFAULT '0',
  `load_flag` smallint(6) DEFAULT '0',
  `error_flag` smallint(6) DEFAULT '0',
  `common_flag` smallint(6) DEFAULT '0',
  `ignore_count` bigint(20) NOT NULL DEFAULT '0',
  `byte_count` bigint(20) NOT NULL DEFAULT '0',
  `extract_count` bigint(20) NOT NULL DEFAULT '0',
  `sent_count` bigint(20) NOT NULL DEFAULT '0',
  `load_count` bigint(20) NOT NULL DEFAULT '0',
  `data_event_count` bigint(20) NOT NULL DEFAULT '0',
  `reload_event_count` bigint(20) NOT NULL DEFAULT '0',
  `insert_event_count` bigint(20) NOT NULL DEFAULT '0',
  `update_event_count` bigint(20) NOT NULL DEFAULT '0',
  `delete_event_count` bigint(20) NOT NULL DEFAULT '0',
  `other_event_count` bigint(20) NOT NULL DEFAULT '0',
  `router_millis` bigint(20) NOT NULL DEFAULT '0',
  `network_millis` bigint(20) NOT NULL DEFAULT '0',
  `filter_millis` bigint(20) NOT NULL DEFAULT '0',
  `load_millis` bigint(20) NOT NULL DEFAULT '0',
  `extract_millis` bigint(20) NOT NULL DEFAULT '0',
  `sql_state` varchar(10) DEFAULT NULL,
  `sql_code` int(11) NOT NULL DEFAULT '0',
  `sql_message` mediumtext,
  `failed_data_id` bigint(20) NOT NULL DEFAULT '0',
  `failed_line_number` bigint(20) NOT NULL DEFAULT '0',
  `last_update_hostname` varchar(255) DEFAULT NULL,
  `last_update_time` datetime DEFAULT NULL,
  `create_time` datetime DEFAULT NULL,
  `create_by` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`batch_id`,`node_id`),
  KEY `sym_idx_ob_node_status` (`node_id`,`status`),
  KEY `sym_idx_ob_status` (`status`),
  KEY `sym_idx_ob_in_error` (`error_flag`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

/*Table structure for table `sym_parameter` */

DROP TABLE IF EXISTS `sym_parameter`;

CREATE TABLE `sym_parameter` (
  `external_id` varchar(50) NOT NULL,
  `node_group_id` varchar(50) NOT NULL,
  `param_key` varchar(80) NOT NULL,
  `param_value` mediumtext,
  `create_time` datetime DEFAULT NULL,
  `last_update_by` varchar(50) DEFAULT NULL,
  `last_update_time` datetime DEFAULT NULL,
  PRIMARY KEY (`external_id`,`node_group_id`,`param_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

/*Table structure for table `sym_registration_redirect` */

DROP TABLE IF EXISTS `sym_registration_redirect`;

CREATE TABLE `sym_registration_redirect` (
  `registrant_external_id` varchar(50) NOT NULL,
  `registration_node_id` varchar(50) NOT NULL,
  PRIMARY KEY (`registrant_external_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

/*Table structure for table `sym_registration_request` */

DROP TABLE IF EXISTS `sym_registration_request`;

CREATE TABLE `sym_registration_request` (
  `node_group_id` varchar(50) NOT NULL,
  `external_id` varchar(50) NOT NULL,
  `status` char(2) NOT NULL,
  `host_name` varchar(60) NOT NULL,
  `ip_address` varchar(50) NOT NULL,
  `attempt_count` int(11) DEFAULT '0',
  `registered_node_id` varchar(50) DEFAULT NULL,
  `error_message` mediumtext,
  `create_time` datetime NOT NULL,
  `last_update_by` varchar(50) DEFAULT NULL,
  `last_update_time` datetime NOT NULL,
  PRIMARY KEY (`node_group_id`,`external_id`,`create_time`),
  KEY `sym_idx_reg_req_1` (`node_group_id`,`external_id`,`status`,`host_name`,`ip_address`),
  KEY `sym_idx_reg_req_2` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

/*Table structure for table `sym_router` */

DROP TABLE IF EXISTS `sym_router`;

CREATE TABLE `sym_router` (
  `router_id` varchar(50) NOT NULL,
  `target_catalog_name` varchar(255) DEFAULT NULL,
  `target_schema_name` varchar(255) DEFAULT NULL,
  `target_table_name` varchar(255) DEFAULT NULL,
  `source_node_group_id` varchar(50) NOT NULL,
  `target_node_group_id` varchar(50) NOT NULL,
  `router_type` varchar(50) DEFAULT NULL,
  `router_expression` mediumtext,
  `sync_on_update` smallint(6) NOT NULL DEFAULT '1',
  `sync_on_insert` smallint(6) NOT NULL DEFAULT '1',
  `sync_on_delete` smallint(6) NOT NULL DEFAULT '1',
  `create_time` datetime NOT NULL,
  `last_update_by` varchar(50) DEFAULT NULL,
  `last_update_time` datetime NOT NULL,
  PRIMARY KEY (`router_id`),
  KEY `sym_fk_rt_2_grp_lnk` (`source_node_group_id`,`target_node_group_id`),
  CONSTRAINT `sym_fk_rt_2_grp_lnk` FOREIGN KEY (`source_node_group_id`, `target_node_group_id`) REFERENCES `sym_node_group_link` (`source_node_group_id`, `target_node_group_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

/*Table structure for table `sym_sequence` */

DROP TABLE IF EXISTS `sym_sequence`;

CREATE TABLE `sym_sequence` (
  `sequence_name` varchar(50) NOT NULL,
  `current_value` bigint(20) NOT NULL DEFAULT '0',
  `increment_by` int(11) NOT NULL DEFAULT '1',
  `min_value` bigint(20) NOT NULL DEFAULT '1',
  `max_value` bigint(20) NOT NULL DEFAULT '9999999999',
  `cycle` smallint(6) DEFAULT '0',
  `create_time` datetime DEFAULT NULL,
  `last_update_by` varchar(50) DEFAULT NULL,
  `last_update_time` datetime NOT NULL,
  PRIMARY KEY (`sequence_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

/*Table structure for table `sym_table_reload_request` */

DROP TABLE IF EXISTS `sym_table_reload_request`;

CREATE TABLE `sym_table_reload_request` (
  `target_node_id` varchar(50) NOT NULL,
  `source_node_id` varchar(50) NOT NULL,
  `trigger_id` varchar(50) NOT NULL,
  `router_id` varchar(50) NOT NULL,
  `reload_select` mediumtext,
  `reload_delete_stmt` mediumtext,
  `reload_enabled` smallint(6) DEFAULT '0',
  `reload_time` datetime DEFAULT NULL,
  `create_time` datetime DEFAULT NULL,
  `last_update_by` varchar(50) DEFAULT NULL,
  `last_update_time` datetime NOT NULL,
  PRIMARY KEY (`target_node_id`,`source_node_id`,`trigger_id`,`router_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

/*Table structure for table `sym_transform_column` */

DROP TABLE IF EXISTS `sym_transform_column`;

CREATE TABLE `sym_transform_column` (
  `transform_id` varchar(50) NOT NULL,
  `include_on` char(1) NOT NULL DEFAULT '*',
  `target_column_name` varchar(128) NOT NULL,
  `source_column_name` varchar(128) DEFAULT NULL,
  `pk` smallint(6) DEFAULT '0',
  `transform_type` varchar(50) DEFAULT 'copy',
  `transform_expression` mediumtext,
  `transform_order` int(11) NOT NULL DEFAULT '1',
  `create_time` datetime DEFAULT NULL,
  `last_update_by` varchar(50) DEFAULT NULL,
  `last_update_time` datetime DEFAULT NULL,
  PRIMARY KEY (`transform_id`,`include_on`,`target_column_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

/*Table structure for table `sym_transform_table` */

DROP TABLE IF EXISTS `sym_transform_table`;

CREATE TABLE `sym_transform_table` (
  `transform_id` varchar(50) NOT NULL,
  `source_node_group_id` varchar(50) NOT NULL,
  `target_node_group_id` varchar(50) NOT NULL,
  `transform_point` varchar(10) NOT NULL,
  `source_catalog_name` varchar(255) DEFAULT NULL,
  `source_schema_name` varchar(255) DEFAULT NULL,
  `source_table_name` varchar(255) NOT NULL,
  `target_catalog_name` varchar(255) DEFAULT NULL,
  `target_schema_name` varchar(255) DEFAULT NULL,
  `target_table_name` varchar(255) DEFAULT NULL,
  `update_first` smallint(6) DEFAULT '0',
  `delete_action` varchar(10) NOT NULL,
  `transform_order` int(11) NOT NULL DEFAULT '1',
  `column_policy` varchar(10) NOT NULL DEFAULT 'SPECIFIED',
  `create_time` datetime DEFAULT NULL,
  `last_update_by` varchar(50) DEFAULT NULL,
  `last_update_time` datetime DEFAULT NULL,
  PRIMARY KEY (`transform_id`,`source_node_group_id`,`target_node_group_id`),
  KEY `sym_fk_tt_2_grp_lnk` (`source_node_group_id`,`target_node_group_id`),
  CONSTRAINT `sym_fk_tt_2_grp_lnk` FOREIGN KEY (`source_node_group_id`, `target_node_group_id`) REFERENCES `sym_node_group_link` (`source_node_group_id`, `target_node_group_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

/*Table structure for table `sym_trigger` */

DROP TABLE IF EXISTS `sym_trigger`;

CREATE TABLE `sym_trigger` (
  `trigger_id` varchar(50) NOT NULL,
  `source_catalog_name` varchar(255) DEFAULT NULL,
  `source_schema_name` varchar(255) DEFAULT NULL,
  `source_table_name` varchar(255) NOT NULL,
  `channel_id` varchar(20) NOT NULL,
  `sync_on_update` smallint(6) NOT NULL DEFAULT '1',
  `sync_on_insert` smallint(6) NOT NULL DEFAULT '1',
  `sync_on_delete` smallint(6) NOT NULL DEFAULT '1',
  `sync_on_incoming_batch` smallint(6) NOT NULL DEFAULT '0',
  `name_for_update_trigger` varchar(255) DEFAULT NULL,
  `name_for_insert_trigger` varchar(255) DEFAULT NULL,
  `name_for_delete_trigger` varchar(255) DEFAULT NULL,
  `sync_on_update_condition` mediumtext,
  `sync_on_insert_condition` mediumtext,
  `sync_on_delete_condition` mediumtext,
  `custom_on_update_text` mediumtext,
  `custom_on_insert_text` mediumtext,
  `custom_on_delete_text` mediumtext,
  `external_select` mediumtext,
  `tx_id_expression` mediumtext,
  `excluded_column_names` mediumtext,
  `sync_key_names` mediumtext,
  `use_stream_lobs` smallint(6) NOT NULL DEFAULT '0',
  `use_capture_lobs` smallint(6) NOT NULL DEFAULT '0',
  `use_capture_old_data` smallint(6) NOT NULL DEFAULT '1',
  `use_handle_key_updates` smallint(6) NOT NULL DEFAULT '0',
  `create_time` datetime NOT NULL,
  `last_update_by` varchar(50) DEFAULT NULL,
  `last_update_time` datetime NOT NULL,
  PRIMARY KEY (`trigger_id`),
  KEY `sym_fk_trg_2_chnl` (`channel_id`),
  CONSTRAINT `sym_fk_trg_2_chnl` FOREIGN KEY (`channel_id`) REFERENCES `sym_channel` (`channel_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

/*Table structure for table `sym_trigger_hist` */

DROP TABLE IF EXISTS `sym_trigger_hist`;

CREATE TABLE `sym_trigger_hist` (
  `trigger_hist_id` int(11) NOT NULL AUTO_INCREMENT,
  `trigger_id` varchar(50) NOT NULL,
  `source_table_name` varchar(255) NOT NULL,
  `source_catalog_name` varchar(255) DEFAULT NULL,
  `source_schema_name` varchar(255) DEFAULT NULL,
  `name_for_update_trigger` varchar(255) DEFAULT NULL,
  `name_for_insert_trigger` varchar(255) DEFAULT NULL,
  `name_for_delete_trigger` varchar(255) DEFAULT NULL,
  `table_hash` bigint(20) NOT NULL DEFAULT '0',
  `trigger_row_hash` bigint(20) NOT NULL DEFAULT '0',
  `trigger_template_hash` bigint(20) NOT NULL DEFAULT '0',
  `column_names` mediumtext NOT NULL,
  `pk_column_names` mediumtext NOT NULL,
  `last_trigger_build_reason` char(1) NOT NULL,
  `error_message` mediumtext,
  `create_time` datetime NOT NULL,
  `inactive_time` datetime DEFAULT NULL,
  PRIMARY KEY (`trigger_hist_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

/*Table structure for table `sym_trigger_router` */

DROP TABLE IF EXISTS `sym_trigger_router`;

CREATE TABLE `sym_trigger_router` (
  `trigger_id` varchar(50) NOT NULL,
  `router_id` varchar(50) NOT NULL,
  `enabled` smallint(6) NOT NULL DEFAULT '1',
  `initial_load_order` int(11) NOT NULL DEFAULT '1',
  `initial_load_select` mediumtext,
  `initial_load_delete_stmt` mediumtext,
  `initial_load_batch_count` int(11) DEFAULT '1',
  `ping_back_enabled` smallint(6) NOT NULL DEFAULT '0',
  `create_time` datetime NOT NULL,
  `last_update_by` varchar(50) DEFAULT NULL,
  `last_update_time` datetime NOT NULL,
  PRIMARY KEY (`trigger_id`,`router_id`),
  KEY `sym_fk_tr_2_rtr` (`router_id`),
  CONSTRAINT `sym_fk_tr_2_rtr` FOREIGN KEY (`router_id`) REFERENCES `sym_router` (`router_id`),
  CONSTRAINT `sym_fk_tr_2_trg` FOREIGN KEY (`trigger_id`) REFERENCES `sym_trigger` (`trigger_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

/*Table structure for table `sym_trigger_router_grouplet` */

DROP TABLE IF EXISTS `sym_trigger_router_grouplet`;

CREATE TABLE `sym_trigger_router_grouplet` (
  `grouplet_id` varchar(50) NOT NULL,
  `trigger_id` varchar(50) NOT NULL,
  `router_id` varchar(50) NOT NULL,
  `applies_when` char(1) NOT NULL,
  `create_time` datetime NOT NULL,
  `last_update_by` varchar(50) DEFAULT NULL,
  `last_update_time` datetime NOT NULL,
  PRIMARY KEY (`grouplet_id`,`trigger_id`,`router_id`,`applies_when`),
  KEY `sym_fk_trgplt_2_tr` (`trigger_id`,`router_id`),
  CONSTRAINT `sym_fk_trgplt_2_gplt` FOREIGN KEY (`grouplet_id`) REFERENCES `sym_grouplet` (`grouplet_id`),
  CONSTRAINT `sym_fk_trgplt_2_tr` FOREIGN KEY (`trigger_id`, `router_id`) REFERENCES `sym_trigger_router` (`trigger_id`, `router_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

/*Table structure for table `tax` */

DROP TABLE IF EXISTS `tax`;

CREATE TABLE `tax` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `label` text,
  `abbr` varchar(4) DEFAULT NULL,
  `is_employee` tinyint(1) DEFAULT NULL,
  `is_percent` tinyint(1) DEFAULT NULL,
  `four_account_id` int(10) unsigned DEFAULT NULL,
  `six_account_id` int(10) unsigned DEFAULT NULL,
  `value` float DEFAULT '0',
  `is_ipr` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `four_account_id` (`four_account_id`),
  KEY `six_account_id` (`six_account_id`),
  CONSTRAINT `tax_ibfk_1` FOREIGN KEY (`four_account_id`) REFERENCES `account` (`id`),
  CONSTRAINT `tax_ibfk_2` FOREIGN KEY (`six_account_id`) REFERENCES `account` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

/*Table structure for table `tax_paiement` */

DROP TABLE IF EXISTS `tax_paiement`;

CREATE TABLE `tax_paiement` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `paiement_uuid` char(36) NOT NULL,
  `tax_id` int(10) unsigned NOT NULL,
  `value` float DEFAULT '0',
  `posted` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `paiement_uuid` (`paiement_uuid`),
  KEY `tax_id` (`tax_id`),
  CONSTRAINT `tax_paiement_ibfk_1` FOREIGN KEY (`paiement_uuid`) REFERENCES `paiement` (`uuid`),
  CONSTRAINT `tax_paiement_ibfk_2` FOREIGN KEY (`tax_id`) REFERENCES `tax` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

/*Table structure for table `taxe_ipr` */

DROP TABLE IF EXISTS `taxe_ipr`;

CREATE TABLE `taxe_ipr` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `taux` float NOT NULL,
  `tranche_annuelle_debut` float DEFAULT NULL,
  `tranche_annuelle_fin` float DEFAULT NULL,
  `tranche_mensuelle_debut` float DEFAULT NULL,
  `tranche_mensuelle_fin` float DEFAULT NULL,
  `ecart_annuel` float DEFAULT NULL,
  `ecart_mensuel` float DEFAULT NULL,
  `impot_annuel` float DEFAULT NULL,
  `impot_mensuel` float DEFAULT NULL,
  `cumul_annuel` float DEFAULT NULL,
  `cumul_mensuel` float DEFAULT NULL,
  `currency_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=latin1;

/*Table structure for table `transaction_type` */

DROP TABLE IF EXISTS `transaction_type`;

CREATE TABLE `transaction_type` (
  `id` tinyint(3) unsigned NOT NULL AUTO_INCREMENT,
  `service_txt` varchar(45) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=33 DEFAULT CHARSET=latin1;

/*Table structure for table `unit` */

DROP TABLE IF EXISTS `unit`;

CREATE TABLE `unit` (
  `id` smallint(5) unsigned NOT NULL,
  `name` varchar(30) NOT NULL,
  `key` varchar(70) NOT NULL,
  `description` text NOT NULL,
  `parent` smallint(6) DEFAULT '0',
  `has_children` tinyint(1) NOT NULL DEFAULT '0',
  `url` tinytext,
  `path` tinytext,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

/*Table structure for table `user` */

DROP TABLE IF EXISTS `user`;

CREATE TABLE `user` (
  `id` smallint(5) unsigned NOT NULL AUTO_INCREMENT,
  `username` varchar(80) NOT NULL,
  `password` varchar(100) NOT NULL,
  `first` text NOT NULL,
  `last` text NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `logged_in` tinyint(1) NOT NULL DEFAULT '0',
  `pin` char(4) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=latin1;

/*Table structure for table `village` */

DROP TABLE IF EXISTS `village`;

CREATE TABLE `village` (
  `uuid` char(36) NOT NULL,
  `name` text,
  `sector_uuid` char(36) NOT NULL,
  PRIMARY KEY (`uuid`),
  KEY `sector_id` (`sector_uuid`),
  CONSTRAINT `village_ibfk_1` FOREIGN KEY (`sector_uuid`) REFERENCES `sector` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
