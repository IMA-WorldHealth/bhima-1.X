--adding additional refs

INSERT INTO reference (is_report, ref, text, position, reference_group_id, section_resultat_id) VALUES (0, "RW", "Total des charges d'exploitation", 13, NULL, 1);

INSERT INTO reference (is_report, ref, text, position, reference_group_id, section_resultat_id) VALUES (0, "SF", "Total des charges financieres", 4, NULL, 2);

INSERT INTO reference (is_report, ref, text, position, reference_group_id, section_resultat_id) VALUES (0, "SH", "Total des charges des activites ordinaires", 5, NULL, 2);

INSERT INTO reference (is_report, ref, text, position, reference_group_id, section_resultat_id) VALUES (0, "SO", "Total des charges H.A.O", 4, NULL, 3);

INSERT INTO reference (is_report, ref, text, position, reference_group_id, section_resultat_id) VALUES (0, "SS", "Total partcipation et impots", 3, NULL, 4);

INSERT INTO reference (is_report, ref, text, position, reference_group_id, section_resultat_id) VALUES (0, "ST", "TOTAL GENARAL DES CHARGES", 6, NULL, NULL);



INSERT INTO reference (is_report, ref, text, position, reference_group_id, section_resultat_id) VALUES (0, "TW", "Total des produits d'exploitation", 17, NULL, 9);

INSERT INTO reference (is_report, ref, text, position, reference_group_id, section_resultat_id) VALUES (0, "TX", "RESULTAT D'EXPLOTATION", 18, NULL, 9);

INSERT INTO reference (is_report, ref, text, position, reference_group_id, section_resultat_id) VALUES (0, "UF", "Total des produits financiers", 5, NULL, 10);

UPDATE reference SET position = 6 WHERE ref="UG";

INSERT INTO reference (is_report, ref, text, position, reference_group_id, section_resultat_id) VALUES (0, "UH", "Total des produits des activites ordinaires", 7, NULL, 10);

INSERT INTO reference (is_report, ref, text, position, reference_group_id, section_resultat_id) VALUES (0, "UI", "RESULAT ACTIVITES ORDINAIRES", 8, NULL, 10);

INSERT INTO reference (is_report, ref, text, position, reference_group_id, section_resultat_id) VALUES (0, "UO", "Total des produits H.A.O", 11, NULL, 11);

UPDATE reference SET position = 12 WHERE ref="UP";

INSERT INTO reference (is_report, ref, text, position, reference_group_id, section_resultat_id) VALUES (0, "UT", "TOTAL GENERAL DES PRODUITS", 13, NULL, NULL);

INSERT INTO reference (is_report, ref, text, position, reference_group_id, section_resultat_id) VALUES (0, "UZ", "RESULAT NET", 14, NULL, NULL);