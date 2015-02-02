-- Updates to accounts data
-- 
-- INSERT new parents class and UPDATE depending accounts
-- UPDATE is_asset (passive or active)
--
-- Date: 2015-01-29
-- By: Bruce Mbayo

use bhima;

-- Get the last id
SET @AUTO_ID = NULL;
SELECT `AUTO_INCREMENT` INTO @AUTO_ID
FROM  INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = 'bhima'
AND   TABLE_NAME   = 'account';

-- Setting up id for new parent class
-- FIXME naive incrementation method
SET @ID_18 = @AUTO_ID;
SET @ID_29 = @AUTO_ID + 1;
SET @ID_32 = @AUTO_ID + 2;
SET @ID_34 = @AUTO_ID + 3;
SET @ID_36 = @AUTO_ID + 4;
SET @ID_38 = @AUTO_ID + 5;
SET @ID_35 = @AUTO_ID + 6;
SET @ID_33 = @AUTO_ID + 7;
SET @ID_46 = @AUTO_ID + 8;
SET @ID_466 = @AUTO_ID + 9;
SET @ID_48 = @AUTO_ID + 10;
SET @ID_49 = @AUTO_ID + 11;
SET @ID_42 = @AUTO_ID + 12;
SET @ID_5734 = @AUTO_ID + 13;
SET @ID_5735 = @AUTO_ID + 14;
SET @ID_61 = @AUTO_ID + 15;
SET @ID_613 = @AUTO_ID + 16;
SET @ID_6131 = @AUTO_ID + 17;
SET @ID_616 = @AUTO_ID + 18;
SET @ID_619 = @AUTO_ID + 19;
SET @ID_62 = @AUTO_ID + 20;
SET @ID_628 = @AUTO_ID + 21;
SET @ID_6334 = @AUTO_ID + 22;
SET @ID_68 = @AUTO_ID + 23;
SET @ID_72 = @AUTO_ID + 24;
SET @ID_7614 = @AUTO_ID + 25;
SET @ID_7615 = @AUTO_ID + 26;
SET @ID_78 = @AUTO_ID + 27;

-- adding missing parent class
INSERT INTO `account` VALUES 
(@ID_18, 3, 200, 18, 'PROVISIONS', 1, NULL, 0, NULL, NULL, '2014-07-10 08:13:00', 1),
(@ID_29, 3, 200, 29, 'IMMOBILISATIONS', 25, NULL, 0, NULL, NULL, '2014-07-10 08:13:00', 2),
(@ID_32, 3, 200, 32, 'Emballages commerciaux', 89, NULL, 0, NULL, NULL, '2014-07-10 08:13:00', 3),
(@ID_34, 3, 200, 34, 'Produits ophtalmologie', 89, NULL, 0, NULL, NULL, '2014-07-10 08:13:00', 3),
(@ID_36, 3, 200, 36, 'Stocks à l\'extérieur', 89, NULL, 0, NULL, NULL, '2014-07-10 08:13:00', 3),
(@ID_38, 3, 200, 38, 'Provisions pour dépréciation', 89, NULL, 0, NULL, NULL, '2014-07-10 08:13:00', 3),
(@ID_35, 3, 200, 35, 'ACCOUCHEMENT', 89, NULL, 0, NULL, NULL, '2014-07-10 08:13:00', 3),
(@ID_33, 3, 200, 33, 'Externe', 89, NULL, 0, NULL, NULL, '2014-07-10 08:13:00', 3),
(@ID_46, 3, 200, 46, 'DEBITEURS ET CREDITEURS DIVERS', 184, NULL, 0, NULL, NULL, '2014-07-10 08:13:00', 4),
(@ID_466, 3, 200, 466, 'AUTRES DEBITEURS ET CREDITEURS', @ID_46, NULL, 0, NULL, NULL, '2014-07-10 08:13:00', 4),
(@ID_48, 3, 200, 48, 'PROVISIONS POUR IMPAYES MALADES', 184, NULL, 0, NULL, NULL, '2014-07-10 08:13:00', 4),
(@ID_49, 3, 200, 49, 'COMPTE D\'ATTENTE (ACTIF)', 184, NULL, 0, NULL, NULL, '2014-07-10 08:13:00', 4),
(@ID_42, 3, 200, 42, 'MALADES HOSPITALISES', 184, NULL, 0, NULL, NULL, '2014-07-10 08:13:00', 4),
(@ID_5734, 3, 200, 5734, 'ROW', 490, NULL, 0, NULL, NULL, '2014-07-10 08:13:00', 5),
(@ID_5735, 3, 200, 5735, 'UNICEF', 490, NULL, 0, NULL, NULL, '2014-07-10 08:13:00', 5),
(@ID_61, 3, 200, 61, 'CONSOMMATIONS FOURNITURES', 535, NULL, 0, NULL, NULL, '2014-07-10 08:13:00', 6),
(@ID_613, 3, 200, 613, 'MATERIELS ET EQUIPEMENTS', @ID_61, NULL, 0, NULL, NULL, '2014-07-10 08:13:00', 6),
(@ID_6131, 3, 200, 6131, 'Matériel et équipement administratif', @ID_613, NULL, 0, NULL, NULL, '2014-07-10 08:13:00', 6),
(@ID_616, 3, 200, 616, 'Consommable et matériel d\'entretien hospitalier', @ID_61, NULL, 0, NULL, NULL, '2014-07-10 08:13:00', 6),
(@ID_619, 3, 200, 619, 'AUTRES FOURNITURES', @ID_61, NULL, 0, NULL, NULL, '2014-07-10 08:13:00', 6),
(@ID_62, 3, 200, 62, 'TRANSPORT CONSOMME', 535, NULL, 0, NULL, NULL, '2014-07-10 08:13:00', 6),
(@ID_628, 3, 200, 628, 'DIVERS FRAIS DE VOYAGE', @ID_62, NULL, 0, NULL, NULL, '2014-07-10 08:13:00', 6),
(@ID_6334, 3, 200, 6334, 'ROW', 660, NULL, 0, NULL, NULL, '2014-07-10 08:13:00', 6),
(@ID_68, 3, 200, 68, 'DOTATIONS', 535, NULL, 0, NULL, NULL, '2014-07-10 08:13:00', 6),
(@ID_72, 3, 200, 72, 'PRODUCTIONS STOCKEES', 888, NULL, 0, NULL, NULL, '2014-07-10 08:13:00', 7),
(@ID_7615, 3, 200, 7615, 'DIVERS', 989, NULL, 0, NULL, NULL, '2014-07-10 08:13:00', 7),
(@ID_7614, 3, 200, 7614, 'ROW', 989, NULL, 0, NULL, NULL, '2014-07-10 08:13:00', 7),
(@ID_78, 3, 200, 78, 'Reprise subvention d\'équipement', 888, NULL, 0, NULL, NULL, '2014-07-10 08:13:00', 7);

-- update accounts which dont't have parent or a correct parent
UPDATE `account` SET `parent`=@ID_18 WHERE `account_number`=18001000;
UPDATE `account` SET `parent`=@ID_29 WHERE `account_number`=29001000;
UPDATE `account` SET `parent`=@ID_32 WHERE `account_number`=32011000;
UPDATE `account` SET `parent`=@ID_34 WHERE `account_number`=34011100;
UPDATE `account` SET `parent`=@ID_36 WHERE `account_number`=36011100;
UPDATE `account` SET `parent`=@ID_38 WHERE `account_number`=38011100;
UPDATE `account` SET `parent`=@ID_35 WHERE `account_number`=35011000;
UPDATE `account` SET `parent`=@ID_33 WHERE `account_number`=33010000;
UPDATE `account` SET `parent`=@ID_46 WHERE `account_number` IN (462, 463, 464);
UPDATE `account` SET `parent`=@ID_466 WHERE LEFT(`account_number`,3)=466 AND `account_number`<>466;
UPDATE `account` SET `parent`=@ID_48 WHERE LEFT(`account_number`,2)=48 AND `account_number`<>48;
UPDATE `account` SET `parent`=@ID_49 WHERE LEFT(`account_number`,2)=49 AND `account_number`<>49;
UPDATE `account` SET `parent`=@ID_42 WHERE `account_number`=42771105;
UPDATE `account` SET `parent`=490 WHERE LEFT(`account_number`,4)=5730 AND `account_number`<>5730;
UPDATE `account` SET `parent`=@ID_5734 WHERE LEFT(`account_number`,4)=5734 AND `account_number`<>5734;
UPDATE `account` SET `parent`=@ID_5735 WHERE LEFT(`account_number`,4)=5735 AND `account_number`<>5735;
UPDATE `account` SET `parent`=@ID_6131 WHERE LEFT(`account_number`,4)=6131 AND `account_number`<>6131;
UPDATE `account` SET `parent`=@ID_616 WHERE LEFT(`account_number`,3)=616 AND `account_number`<>616;
UPDATE `account` SET `parent`=@ID_619 WHERE LEFT(`account_number`,3)=619 AND `account_number`<>619;
UPDATE `account` SET `parent`=@ID_62 WHERE `account_number`=621;
UPDATE `account` SET `parent`=@ID_628 WHERE LEFT(`account_number`,3)=628 AND `account_number`<>628;
UPDATE `account` SET `parent`=@ID_6334 WHERE LEFT(`account_number`,4)=6334 AND `account_number`<>6334;
UPDATE `account` SET `parent`=@ID_68 WHERE LEFT(`account_number`,2)=68 AND `account_number`<>68;
UPDATE `account` SET `parent`=@ID_72 WHERE LEFT(`account_number`,2)=72 AND `account_number`<>72;
UPDATE `account` SET `parent`=@ID_7615 WHERE LEFT(`account_number`,4)=7615 AND `account_number`<>7615;
UPDATE `account` SET `parent`=@ID_7614 WHERE LEFT(`account_number`,4)=7614 AND `account_number`<>7614;
UPDATE `account` SET `parent`=@ID_78 WHERE LEFT(`account_number`,2)=78 AND `account_number`<>78;

-- update active or passive
-- TRUE for active or FALSE for passive
UPDATE `account` SET `is_asset`=FALSE WHERE `classe`=1;
UPDATE `account` SET `is_asset`=TRUE WHERE `classe`=2;
UPDATE `account` SET `is_asset`=TRUE WHERE `classe`=3;
UPDATE `account` SET `is_asset`=FALSE WHERE LEFT(`account_number`,2)=40;
UPDATE `account` SET `is_asset`=TRUE WHERE LEFT(`account_number`,2)=41;
UPDATE `account` SET `is_asset`=FALSE WHERE LEFT(`account_number`,2)=42;
UPDATE `account` SET `is_asset`=FALSE WHERE LEFT(`account_number`,2)=43;
UPDATE `account` SET `is_asset`=TRUE WHERE LEFT(`account_number`,3)=462;
UPDATE `account` SET `is_asset`=TRUE WHERE LEFT(`account_number`,3)=463;
UPDATE `account` SET `is_asset`=FALSE WHERE LEFT(`account_number`,3)=464;
UPDATE `account` SET `is_asset`=FALSE WHERE LEFT(`account_number`,2)=47;
UPDATE `account` SET `is_asset`=FALSE WHERE LEFT(`account_number`,2)=48;
UPDATE `account` SET `is_asset`=FALSE WHERE LEFT(`account_number`,2)=49;
UPDATE `account` SET `is_asset`=FALSE WHERE LEFT(`account_number`,3)=466;
UPDATE `account` SET `is_asset`=TRUE WHERE `classe`=5;