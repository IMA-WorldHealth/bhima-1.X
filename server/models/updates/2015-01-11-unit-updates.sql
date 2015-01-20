-- Updates to unit table
---
-- DROPs unused has_children field
--
-- Date: 2015-01-11
-- By: Jonathan Niles

USE bhima;

ALTER TABLE `unit`
DROP `has_children`;

