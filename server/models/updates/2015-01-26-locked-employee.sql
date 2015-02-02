-- Allow an employee lock
--
-- Date: 2015-01-26
-- By: Chris LOMAME

USE bhima;

ALTER TABLE `employee`
ADD `locked` boolean;
