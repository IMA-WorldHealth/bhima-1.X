-- Updates to patient data
-- CHANGE length of email column to 40 characters
--
-- Date: 2015-01-05
-- By: Jonathan Cameron

USE bhima;

ALTER TABLE `patient`
CHANGE `email` `email` varchar(40);
