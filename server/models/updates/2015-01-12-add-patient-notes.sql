-- Updates to patient data
--
-- Add patient 'notes' field
--
-- Date: 2015-01-12
-- By: Jonathan Cameron

USE bhima;

ALTER TABLE `patient`
ADD `notes` text;
