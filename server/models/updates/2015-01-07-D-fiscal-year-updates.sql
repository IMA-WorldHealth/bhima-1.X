-- Updates to fiscal year data
---
-- DROP 'closing_account' field
--
-- Date: 2015-01-07
-- By: Jonathan Niles

USE bhima;

ALTER TABLE `fiscal_year`
DROP FOREIGN KEY `fiscal_year_ibfk_1`;

ALTER TABLE `fiscal_year`
DROP `closing_account`;
