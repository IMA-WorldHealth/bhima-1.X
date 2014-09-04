-- phpMyAdmin SQL Dump
-- version 4.1.12
-- http://www.phpmyadmin.net
--
-- Client :  127.0.0.1
-- Généré le :  Jeu 04 Septembre 2014 à 19:41
-- Version du serveur :  5.6.16
-- Version de PHP :  5.5.11

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";

--
-- Base de données :  `bhima`
--

-- --------------------------------------------------------

--
-- Structure de la table `employee`
--

CREATE TABLE IF NOT EXISTS `employee` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `code` varchar(20) NOT NULL,
  `prenom` text,
  `name` text NOT NULL,
  `postnom` text,
  `sexe` varchar(10) NOT NULL,
  `dob` date NOT NULL,
  `date_embauche` date DEFAULT NULL,
  `nb_spouse` int(11) NOT NULL,
  `nb_enfant` int(11) NOT NULL,
  `grade` int(11) NOT NULL,
  `daily_salary` float NOT NULL,
  `bank` varchar(30) NOT NULL,
  `bank_account` varchar(30) NOT NULL,
  `adresse` varchar(50) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `email` varchar(70) DEFAULT NULL,
  `assignation` varchar(30) NOT NULL,
  `fonction_id` tinyint(3) unsigned DEFAULT NULL,
  `service_id` smallint(5) unsigned DEFAULT NULL,
  `location_id` char(36) DEFAULT NULL,
  `creditor_uuid` char(36) DEFAULT NULL,
  `debitor_uuid` char(36) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fonction_id` (`fonction_id`),
  KEY `service_id` (`service_id`),
  KEY `location_id` (`location_id`),
  KEY `creditor_uuid` (`creditor_uuid`),
  KEY `debitor_uuid` (`debitor_uuid`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=6 ;

--
-- Contenu de la table `employee`
--

INSERT INTO `employee` (`id`, `code`, `prenom`, `name`, `postnom`, `sexe`, `dob`, `date_embauche`, `nb_spouse`, `nb_enfant`, `grade`, `daily_salary`, `bank`, `bank_account`, `adresse`, `phone`, `email`, `assignation`, `fonction_id`, `service_id`, `location_id`, `creditor_uuid`, `debitor_uuid`) VALUES
(1, '0100', NULL, 'Employee A', NULL, '', '1993-06-06', NULL, 0, 0, 0, 0, '', '', '0', NULL, NULL, '', NULL, NULL, NULL, '91d2fd2b-2ca4-11e4-b242-599d0a59a019', NULL),
(2, '1704', NULL, 'Bruce Mbayo', NULL, '', '1987-04-17', NULL, 0, 0, 0, 0, '', '', '0', NULL, NULL, '', NULL, NULL, NULL, 'd9d82d3b-f7cc-45f2-8953-3d56211ef2a8', NULL),
(3, '0607', NULL, 'Chris Lomame', NULL, '', '1987-01-01', NULL, 0, 0, 0, 0, '', '', '0', NULL, NULL, '', NULL, NULL, NULL, 'e3d4c115-1347-4f54-b510-1f93816415db', NULL),
(4, '17001', 'Bruce', 'Mbayo', 'Panda', 'M', '2000-04-17', '2014-07-10', 0, 0, 17, 35, 'ProCredit Bank', '17001', '0', '0811838662', 'mbayopanda@gmail.com', 'Kinshasa', NULL, 1, NULL, '83aeccd0-6d8b-4504-bfbb-cf8cdc347fc7', NULL),
(5, '009', 'Donnie', 'Corleone', 'Parain', 'M', '2000-04-04', '2000-04-04', 2, 10, 1010, 200, 'Procredit Banque', '09090', 'Italy', '099', 'don@corleone.it', 'Lubumbashi', NULL, 1, NULL, '198ace16-1fbb-4af3-a587-d76dac543188', NULL);

--
-- Contraintes pour les tables exportées
--

--
-- Contraintes pour la table `employee`
--
ALTER TABLE `employee`
  ADD CONSTRAINT `employee_ibfk_1` FOREIGN KEY (`fonction_id`) REFERENCES `fonction` (`id`),
  ADD CONSTRAINT `employee_ibfk_2` FOREIGN KEY (`service_id`) REFERENCES `service` (`id`),
  ADD CONSTRAINT `employee_ibfk_3` FOREIGN KEY (`location_id`) REFERENCES `village` (`uuid`),
  ADD CONSTRAINT `employee_ibfk_4` FOREIGN KEY (`creditor_uuid`) REFERENCES `creditor` (`uuid`),
  ADD CONSTRAINT `employee_ibfk_5` FOREIGN KEY (`debitor_uuid`) REFERENCES `debitor` (`uuid`);
