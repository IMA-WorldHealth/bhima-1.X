-- Update to units/menu
--
-- Add add menu/unit item for the budget menu item.
--
-- Date: 2015-01-13
-- By: Jonathan Cameron

USE bhima;

INSERT INTO `transaction_type` (`service_txt`) VALUES
('cotisation_engagement'), ('tax_engagement');
