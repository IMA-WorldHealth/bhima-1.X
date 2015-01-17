-- Update to units/menu
--
-- Add add menu/unit item for the budget menu item.
--
-- Date: 2015-01-13
-- By: Jonathan Cameron

USE bhima;

INSERT INTO `unit` VALUES
(7,'Edit Account Budget','TREE.EDIT_BUDGET','',8,0,'/partials/budget/edit/','/budgeting/edit');
