-- Updates to patient data
--
-- Date: 2015-01-05
-- By: Jonathan Cameron

USE bhima;

ALTER TABLE `patient`
ADD `title` VARCHAR(30);
