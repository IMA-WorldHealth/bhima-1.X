-- Configuration for enterprise IMCK
------------------------------------------------------------------------------

-- TODO Foreign key relationships cannot be across differenct channels,
--      temporary fix is to include all data in enterprise_data channel, whilst
--      maintaining the concept of enterprise vs. transactional with routes.
--      Channels should be re-asessed considering foreign keys
-- TODO sym_node_security definining initial load for client 005
--
-- Nodes
--

-- i personaly add them

delete from sym_trigger_router;
delete from sym_router;
delete from sym_trigger;
delete from sym_channel;


delete from sym_node_group_link;
delete from sym_node_group;
delete from sym_node_identity;
delete from sym_node_security;
delete from sym_node;



insert into sym_node_group (node_group_id, description)
values ('master', 'IMCK HBB Tshikaji');
insert into sym_node_group (node_group_id, description)
values ('client', 'IMCK PAX Kananga');


insert into sym_node_group_link (source_node_group_id, target_node_group_id, data_event_action)
values ('client', 'master', 'P');
insert into sym_node_group_link (source_node_group_id, target_node_group_id, data_event_action)
values ('master', 'client', 'W');


insert into sym_node (node_id, node_group_id, external_id, sync_enabled)
values ('000', 'master', '000', 1);
insert into sym_node_security (node_id,node_password,registration_enabled,registration_time,initial_load_enabled,initial_load_time,initial_load_id,initial_load_create_by,rev_initial_load_enabled,rev_initial_load_time,rev_initial_load_id,rev_initial_load_create_by,created_at_node_id)
values ('000','HISCongo2013',0,current_timestamp,0,current_timestamp,null,null,0,null,null,null,'000');
insert into sym_node_identity values ('000');

--
-- Channels
--
insert into sym_channel
(channel_id, processing_order, max_batch_size, enabled, description)
values('enterprise_data', 1, 100000, 1, 'Common data to every node');

insert into sym_channel
(channel_id, processing_order, max_batch_size, enabled, description)
values('transactional', 2, 100000, 1, 'Transactional data');

--
-- Triggers
--

--
-- ONE WAY Transactional triggers (clients report to master)
--

insert into sym_trigger
(trigger_id, source_table_name, channel_id, last_update_time, create_time)
values('cost_center', 'cost_center', 'enterprise_data', current_timestamp, current_timestamp);

insert into sym_trigger
(trigger_id, source_table_name, channel_id, last_update_time, create_time)
values('cost_center_assignation', 'cost_center_assignation', 'enterprise_data', current_timestamp, current_timestamp);

insert into sym_trigger
(trigger_id, source_table_name, channel_id, last_update_time, create_time)
values('cost_center_assignation_item', 'cost_center_assignation_item', 'enterprise_data', current_timestamp, current_timestamp);

insert into sym_trigger
(trigger_id, source_table_name, channel_id, last_update_time, create_time)
values ('donor', 'donor', 'enterprise_data', current_timestamp, current_timestamp);

insert into sym_trigger
(trigger_id, source_table_name, channel_id,last_update_time,create_time)
values('employee_invoice', 'employee_invoice', 'enterprise_data', current_timestamp, current_timestamp);

insert into sym_trigger
(trigger_id, source_table_name, channel_id, last_update_time, create_time)
values('employee_invoice_item', 'employee_invoice_item', 'enterprise_data', current_timestamp, current_timestamp);

insert into sym_trigger
(trigger_id, source_table_name, channel_id, last_update_time, create_time)
values('group_invoice', 'group_invoice', 'enterprise_data', current_timestamp, current_timestamp);

insert into sym_trigger
(trigger_id, source_table_name, channel_id, last_update_time, create_time)
values('group_invoice_item', 'group_invoice_item', 'enterprise_data', current_timestamp, current_timestamp);

insert into sym_trigger
(trigger_id, source_table_name, channel_id, last_update_time, create_time)
values('posting_journal', 'posting_journal', 'enterprise_data', current_timestamp, current_timestamp);

insert into sym_trigger
(trigger_id, source_table_name, channel_id, last_update_time, create_time)
values('profit_center', 'profit_center', 'enterprise_data', current_timestamp, current_timestamp);

insert into sym_trigger
(trigger_id, source_table_name, channel_id, last_update_time, create_time)
values('service', 'service', 'enterprise_data', current_timestamp, current_timestamp);

--
-- END ONE WAY Transactional triggers (clients report to master)
--





--
-- ONE WAY dead sym_trigger
--


insert into sym_trigger
(trigger_id, source_table_name, channel_id, last_update_time, create_time)
values('employee_invoice_dead', 'employee_invoice', 'enterprise_data', current_timestamp, current_timestamp);

insert into sym_trigger
(trigger_id, source_table_name, channel_id, last_update_time, create_time)
values('employee_invoice_item_dead', 'employee_invoice_item', 'enterprise_data', current_timestamp, current_timestamp);

insert into sym_trigger
(trigger_id, source_table_name, channel_id, sync_on_insert, sync_on_update, sync_on_delete, last_update_time, create_time)
values('group_invoice_dead', 'group_invoice', 'enterprise_data', 0, 0, 0, current_timestamp, current_timestamp);

insert into sym_trigger
(trigger_id, source_table_name, channel_id, sync_on_insert, sync_on_update, sync_on_delete, last_update_time, create_time)
values('group_invoice_item_dead', 'group_invoice_item', 'enterprise_data', 0, 0, 0, current_timestamp, current_timestamp);

insert into sym_trigger
(trigger_id, source_table_name, channel_id, sync_on_insert, sync_on_update, sync_on_delete, last_update_time, create_time)
values('posting_journal_dead', 'posting_journal', 'enterprise_data', 0, 0, 0, current_timestamp, current_timestamp);

--
-- END ONE WAY dead sym_triggers
--


--
-- TWO WAYS sym triggers (common to all nodes)
--
-- Safe to sync both ways (UUID)

insert into sym_trigger
(trigger_id, source_table_name, channel_id, last_update_time, create_time)
values ('account', 'account', 'enterprise_data', current_timestamp, current_timestamp);

insert into sym_trigger
(trigger_id, source_table_name, channel_id, last_update_time, create_time)
values ('account_type', 'account_type', 'enterprise_data', current_timestamp, current_timestamp);

insert into sym_trigger
(trigger_id, source_table_name, channel_id, last_update_time, create_time)
values ('assignation_patient', 'assignation_patient', 'enterprise_data', current_timestamp, current_timestamp);

insert into sym_trigger
(trigger_id, source_table_name, channel_id, last_update_time, create_time)
values ('cash_box', 'cash_box', 'enterprise_data', current_timestamp, current_timestamp);

insert into sym_trigger
(trigger_id, source_table_name, channel_id, last_update_time, create_time)
values ('cash_box_account_currency', 'cash_box_account_currency', 'enterprise_data', current_timestamp, current_timestamp);

insert into sym_trigger
(trigger_id, source_table_name, channel_id, last_update_time, create_time)
values ('cash_discard', 'cash_discard', 'enterprise_data', current_timestamp, current_timestamp);

-- insert into sym_trigger
-- (trigger_id, source_table_name, channel_id, last_update_time, create_time)
-- values ('caution', 'caution', 'enterprise_data', current_timestamp, current_timestamp);

-- insert into sym_trigger
-- (trigger_id, source_table_name, channel_id, last_update_time, create_time)
-- values ('caution_box', 'caution_box', 'enterprise_data', current_timestamp, current_timestamp);

-- insert into sym_trigger
-- (trigger_id, source_table_name, channel_id, last_update_time, create_time)
-- values ('caution_box_account_currency', 'caution_box_account_currency', 'enterprise_data', current_timestamp, current_timestamp);

insert into sym_trigger
(trigger_id, source_table_name, channel_id, last_update_time, create_time)
values ('consumption', 'consumption', 'enterprise_data', current_timestamp, current_timestamp);

insert into sym_trigger
(trigger_id, source_table_name, channel_id, last_update_time, create_time)
values ('consumption_loss', 'consumption_loss', 'enterprise_data', current_timestamp, current_timestamp);

insert into sym_trigger
(trigger_id, source_table_name, channel_id, last_update_time, create_time)
values ('consumption_patient', 'consumption_patient', 'enterprise_data', current_timestamp, current_timestamp);

insert into sym_trigger
(trigger_id, source_table_name, channel_id, last_update_time, create_time)
values ('consumption_reversing', 'consumption_reversing', 'enterprise_data', current_timestamp, current_timestamp);

insert into sym_trigger
(trigger_id, source_table_name, channel_id, last_update_time, create_time)
values ('consumption_rummage', 'consumption_rummage', 'enterprise_data', current_timestamp, current_timestamp);

insert into sym_trigger
(trigger_id, source_table_name, channel_id, last_update_time, create_time)
values ('consumption_service', 'consumption_service', 'enterprise_data', current_timestamp, current_timestamp);

insert into sym_trigger
(trigger_id, source_table_name, channel_id, last_update_time, create_time)
values ('country', 'country', 'enterprise_data', current_timestamp, current_timestamp);

insert into sym_trigger
(trigger_id, source_table_name, channel_id, last_update_time, create_time)
values ('credit_note', 'credit_note', 'enterprise_data', current_timestamp, current_timestamp);

insert into sym_trigger
(trigger_id, source_table_name, channel_id, last_update_time, create_time)
values ('creditor', 'creditor', 'enterprise_data', current_timestamp, current_timestamp);

insert into sym_trigger
(trigger_id, source_table_name, channel_id, last_update_time, create_time)
values ('creditor_group', 'creditor_group', 'enterprise_data', current_timestamp, current_timestamp);

-- Must enforce master to client for now (non UUID)
insert into sym_trigger
(trigger_id, source_table_name, channel_id, last_update_time, create_time)
values ('currency', 'currency', 'enterprise_data', current_timestamp, current_timestamp);

insert into sym_trigger
(trigger_id, source_table_name, channel_id, last_update_time, create_time)
values ('debitor', 'debitor', 'enterprise_data', current_timestamp, current_timestamp);

insert into sym_trigger
(trigger_id, source_table_name, channel_id, last_update_time, create_time)
values ('debitor_group', 'debitor_group', 'enterprise_data', current_timestamp, current_timestamp);

insert into sym_trigger
(trigger_id, source_table_name, channel_id, last_update_time, create_time)
values ('debitor_group_history', 'debitor_group_history', 'enterprise_data', current_timestamp, current_timestamp);

insert into sym_trigger
(trigger_id, source_table_name, channel_id, last_update_time, create_time)
values ('depot', 'depot', 'enterprise_data', current_timestamp, current_timestamp);

insert into sym_trigger
(trigger_id, source_table_name, channel_id, last_update_time, create_time)
values ('donations', 'donations', 'enterprise_data', current_timestamp, current_timestamp);

insert into sym_trigger
(trigger_id, source_table_name, channel_id, last_update_time, create_time)
values ('donation_item', 'donation_item', 'enterprise_data', current_timestamp, current_timestamp);

insert into sym_trigger
(trigger_id, source_table_name, channel_id, last_update_time, create_time)
values ('employee', 'employee', 'enterprise_data', current_timestamp, current_timestamp);

insert into sym_trigger
(trigger_id, source_table_name, channel_id, last_update_time, create_time)
values ('enterprise', 'enterprise', 'enterprise_data', current_timestamp, current_timestamp);

insert into sym_trigger
(trigger_id, source_table_name, channel_id, last_update_time, create_time)
values ('fiscal_year', 'fiscal_year', 'enterprise_data', current_timestamp, current_timestamp);

insert into sym_trigger
(trigger_id, source_table_name, channel_id, last_update_time, create_time)
values ('fonction', 'fonction', 'enterprise_data', current_timestamp, current_timestamp);

insert into sym_trigger
(trigger_id, source_table_name, channel_id, last_update_time, create_time)
values ('inventory', 'inventory', 'enterprise_data', current_timestamp, current_timestamp);

insert into sym_trigger
(trigger_id, source_table_name, channel_id, last_update_time, create_time)
values ('inventory_group', 'inventory_group', 'enterprise_data', current_timestamp, current_timestamp);

insert into sym_trigger
(trigger_id, source_table_name, channel_id, last_update_time, create_time)
values ('inventory_log', 'inventory_log', 'enterprise_data', current_timestamp, current_timestamp);

insert into sym_trigger
(trigger_id, source_table_name, channel_id, last_update_time, create_time)
values ('inventory_type', 'inventory_type', 'enterprise_data', current_timestamp, current_timestamp);

insert into sym_trigger
(trigger_id, source_table_name, channel_id, last_update_time, create_time)
values ('inventory_unit', 'inventory_unit', 'enterprise_data', current_timestamp, current_timestamp);

insert into sym_trigger
(trigger_id, source_table_name, channel_id, last_update_time, create_time)
values ('language', 'language', 'enterprise_data', current_timestamp, current_timestamp);

insert into sym_trigger
(trigger_id, source_table_name, channel_id, last_update_time, create_time)
values ('movement', 'movement', 'enterprise_data', current_timestamp, current_timestamp);

insert into sym_trigger
(trigger_id, source_table_name, channel_id, last_update_time, create_time)
values ('patient', 'patient', 'enterprise_data', current_timestamp, current_timestamp);

insert into sym_trigger
(trigger_id, source_table_name, channel_id, last_update_time, create_time)
values ('patient_group', 'patient_group', 'enterprise_data', current_timestamp, current_timestamp);

insert into sym_trigger
(trigger_id, source_table_name, channel_id, last_update_time, create_time)
values ('patient_visit', 'patient_visit', 'enterprise_data', current_timestamp, current_timestamp);

insert into sym_trigger
(trigger_id, source_table_name, channel_id, last_update_time, create_time)
values ('period', 'period', 'enterprise_data', current_timestamp, current_timestamp);

insert into sym_trigger
(trigger_id, source_table_name, channel_id, last_update_time, create_time)
values ('permission', 'permission', 'enterprise_data', current_timestamp, current_timestamp);

insert into sym_trigger
(trigger_id, source_table_name, channel_id, last_update_time, create_time)
values ('price_list', 'price_list', 'enterprise_data', current_timestamp, current_timestamp);

insert into sym_trigger
(trigger_id,source_table_name,channel_id,last_update_time,create_time)
values ('primary_cash', 'primary_cash', 'enterprise_data', current_timestamp, current_timestamp);

insert into sym_trigger
(trigger_id,source_table_name,channel_id,last_update_time,create_time)
values ('primary_cash_item', 'primary_cash_item', 'enterprise_data', current_timestamp, current_timestamp);

insert into sym_trigger
(trigger_id,source_table_name,channel_id,last_update_time,create_time)
values ('price_list_item', 'price_list_item', 'enterprise_data', current_timestamp, current_timestamp);

insert into sym_trigger
(trigger_id, source_table_name, channel_id, last_update_time, create_time)
values('project', 'project', 'enterprise_data', current_timestamp, current_timestamp);

insert into sym_trigger
(trigger_id, source_table_name, channel_id, last_update_time, create_time)
values ('project_permission', 'project_permission', 'enterprise_data', current_timestamp, current_timestamp);

insert into sym_trigger
(trigger_id, source_table_name, channel_id, last_update_time, create_time)
values ('province', 'province', 'enterprise_data', current_timestamp, current_timestamp);

insert into sym_trigger
(trigger_id, source_table_name, channel_id, last_update_time, create_time)
values ('purchase', 'purchase', 'enterprise_data', current_timestamp, current_timestamp);

insert into sym_trigger
(trigger_id, source_table_name, channel_id, last_update_time, create_time)
values ('purchase_item', 'purchase_item', 'enterprise_data', current_timestamp, current_timestamp);

insert into sym_trigger
(trigger_id, source_table_name, channel_id, last_update_time, create_time)
values ('sector', 'sector', 'enterprise_data', current_timestamp, current_timestamp);

insert into sym_trigger
(trigger_id, source_table_name, channel_id, last_update_time, create_time)
values ('stock', 'stock', 'enterprise_data', current_timestamp, current_timestamp);

insert into sym_trigger
(trigger_id, source_table_name, channel_id, last_update_time, create_time)
values ('subsidy', 'subsidy', 'enterprise_data', current_timestamp, current_timestamp);

insert into sym_trigger
(trigger_id, source_table_name, channel_id, last_update_time, create_time)
values ('supplier', 'supplier', 'enterprise_data', current_timestamp, current_timestamp);

insert into sym_trigger
(trigger_id, source_table_name, channel_id, last_update_time, create_time)
values ('transaction_type', 'transaction_type', 'enterprise_data', current_timestamp, current_timestamp);

insert into sym_trigger
(trigger_id, source_table_name, channel_id, last_update_time, create_time)
values ('unit', 'unit', 'enterprise_data', current_timestamp, current_timestamp);

insert into sym_trigger
(trigger_id, source_table_name, channel_id, last_update_time, create_time)
values ('user', 'user', 'enterprise_data', current_timestamp, current_timestamp);

insert into sym_trigger
(trigger_id, source_table_name, channel_id, last_update_time, create_time)
values ('village', 'village', 'enterprise_data', current_timestamp, current_timestamp);

insert into sym_trigger
(trigger_id, source_table_name, channel_id, last_update_time, create_time)
values('cash', 'cash', 'enterprise_data', current_timestamp, current_timestamp);

insert into sym_trigger
(trigger_id, source_table_name, channel_id, last_update_time, create_time)
values('cash_item', 'cash_item', 'enterprise_data', current_timestamp, current_timestamp);

insert into sym_trigger
(trigger_id, source_table_name, channel_id, last_update_time, create_time)
values('sale', 'sale', 'enterprise_data', current_timestamp, current_timestamp);

insert into sym_trigger
(trigger_id, source_table_name, channel_id, last_update_time, create_time)
values('sale_item', 'sale_item', 'enterprise_data', current_timestamp, current_timestamp);

insert into sym_trigger
(trigger_id, source_table_name, channel_id, last_update_time, create_time)
values('sale_subsidy', 'sale_subsidy', 'enterprise_data', current_timestamp, current_timestamp);



--
-- END TWO WAYS Shared data triggers (common to all nodes)
--





--
-- dead trigger suite of two ways sync
--


-- insert into sym_trigger
-- (trigger_id, source_table_name, channel_id, last_update_time, create_time)
-- values ('caution_dead', 'caution', 'enterprise_data', current_timestamp, current_timestamp);

insert into sym_trigger
(trigger_id, source_table_name, channel_id, last_update_time, create_time)
values ('cash_discard_dead', 'cash_discard', 'enterprise_data', current_timestamp, current_timestamp);

insert into sym_trigger
(trigger_id, source_table_name, channel_id, sync_on_insert, sync_on_update, sync_on_delete, last_update_time, create_time)
values('cash_dead', 'cash', 'enterprise_data', 0, 0, 0, current_timestamp, current_timestamp);

insert into sym_trigger
(trigger_id, source_table_name, channel_id, sync_on_insert, sync_on_update, sync_on_delete, last_update_time, create_time)
values('cash_item_dead', 'cash_item', 'enterprise_data', 0, 0, 0, current_timestamp, current_timestamp);

insert into sym_trigger
(trigger_id, source_table_name, channel_id, sync_on_insert, sync_on_update, sync_on_delete, last_update_time, create_time)
values('sale_dead', 'sale', 'enterprise_data', 0, 0, 0, current_timestamp, current_timestamp);

insert into sym_trigger
(trigger_id, source_table_name, channel_id, sync_on_insert, sync_on_update, sync_on_delete, last_update_time, create_time)
values('sale_item_dead', 'sale_item', 'enterprise_data', 0, 0, 0, current_timestamp, current_timestamp);

insert into sym_trigger
(trigger_id, source_table_name, channel_id, sync_on_insert, sync_on_update, sync_on_delete, last_update_time, create_time)
values('sale_subsidy_dead', 'sale_subsidy', 'enterprise_data', 0, 0, 0, current_timestamp, current_timestamp);

insert into sym_trigger
(trigger_id,source_table_name,channel_id,last_update_time,create_time)
values ('primary_cash_dead', 'primary_cash', 'enterprise_data', current_timestamp, current_timestamp);

insert into sym_trigger
(trigger_id,source_table_name,channel_id,last_update_time,create_time)
values ('primary_cash_item_dead', 'primary_cash_item', 'enterprise_data', current_timestamp, current_timestamp);

insert into sym_trigger
(trigger_id,source_table_name,channel_id, sync_on_insert, sync_on_update, sync_on_delete, last_update_time,create_time)
values('assignation_patient_dead', 'assignation_patient', 'enterprise_data',0,0,0,current_timestamp,current_timestamp);

insert into sym_trigger
(trigger_id,source_table_name,channel_id, sync_on_insert, sync_on_update, sync_on_delete,sync_on_incoming_batch,last_update_time,create_time)
values('country_dead', 'country', 'enterprise_data',0,0,0,0,current_timestamp,current_timestamp);

insert into sym_trigger
(trigger_id,source_table_name,channel_id, sync_on_insert, sync_on_update, sync_on_delete, last_update_time,create_time)
values('province_dead', 'province', 'enterprise_data',0,0,0,current_timestamp,current_timestamp);

insert into sym_trigger
(trigger_id,source_table_name,channel_id, sync_on_insert, sync_on_update, sync_on_delete, last_update_time,create_time)
values('sector_dead', 'sector', 'enterprise_data',0,0,0,current_timestamp,current_timestamp);

insert into sym_trigger
(trigger_id,source_table_name,channel_id, sync_on_insert, sync_on_update, sync_on_delete, last_update_time,create_time)
values('village_dead', 'village', 'enterprise_data',0,0,0,current_timestamp,current_timestamp);

insert into sym_trigger
(trigger_id,source_table_name,channel_id, sync_on_insert, sync_on_update, sync_on_delete, last_update_time,create_time)
values('patient_dead', 'patient', 'enterprise_data',0,0,0,current_timestamp,current_timestamp);

insert into sym_trigger
(trigger_id,source_table_name,channel_id, sync_on_insert, sync_on_update, sync_on_delete, last_update_time,create_time)
values('debitor_group_dead', 'debitor_group', 'enterprise_data',0,0,0,current_timestamp,current_timestamp);

insert into sym_trigger
(trigger_id,source_table_name,channel_id, sync_on_insert, sync_on_update, sync_on_delete, last_update_time,create_time)
values('debitor_dead', 'debitor', 'enterprise_data',0,0,0,current_timestamp,current_timestamp);

insert into sym_trigger
(trigger_id,source_table_name,channel_id, sync_on_insert, sync_on_update, sync_on_delete, last_update_time,create_time)
values('patient_visit_dead', 'patient_visit', 'enterprise_data',0,0,0,current_timestamp,current_timestamp);

insert into sym_trigger
(trigger_id,source_table_name,channel_id, sync_on_insert, sync_on_update, sync_on_delete, last_update_time,create_time)
values('credit_note_dead', 'credit_note', 'enterprise_data',0,0,0,current_timestamp,current_timestamp);

insert into sym_trigger
(trigger_id,source_table_name,channel_id, sync_on_insert, sync_on_update, sync_on_delete, last_update_time,create_time)
values('debitor_group_history_dead', 'debitor_group_history', 'enterprise_data',0,0,0,current_timestamp,current_timestamp);

insert into sym_trigger
(trigger_id,source_table_name,channel_id, sync_on_insert, sync_on_update, sync_on_delete, last_update_time,create_time)
values('depot_dead', 'depot', 'enterprise_data',0,0,0,current_timestamp,current_timestamp);

insert into sym_trigger
(trigger_id,source_table_name,channel_id, sync_on_insert, sync_on_update, sync_on_delete, last_update_time,create_time)
values('consumption_dead', 'consumption', 'enterprise_data',0,0,0,current_timestamp,current_timestamp);

insert into sym_trigger
(trigger_id,source_table_name,channel_id, sync_on_insert, sync_on_update, sync_on_delete, last_update_time,create_time)
values('consumption_loss_dead', 'consumption_loss', 'enterprise_data',0,0,0,current_timestamp,current_timestamp);

insert into sym_trigger
(trigger_id,source_table_name,channel_id, sync_on_insert, sync_on_update, sync_on_delete, last_update_time,create_time)
values('consumption_patient_dead', 'consumption_patient', 'enterprise_data',0,0,0,current_timestamp,current_timestamp);

insert into sym_trigger
(trigger_id,source_table_name,channel_id, sync_on_insert, sync_on_update, sync_on_delete, last_update_time,create_time)
values('consumption_rummage_dead', 'consumption_rummage', 'enterprise_data',0,0,0,current_timestamp,current_timestamp);

insert into sym_trigger
(trigger_id,source_table_name,channel_id, sync_on_insert, sync_on_update, sync_on_delete, last_update_time,create_time)
values('consumption_reversing_dead', 'consumption_reversing', 'enterprise_data',0,0,0,current_timestamp,current_timestamp);

insert into sym_trigger
(trigger_id,source_table_name,channel_id, sync_on_insert, sync_on_update, sync_on_delete, last_update_time,create_time)
values('consumption_service_dead', 'consumption_service', 'enterprise_data',0,0,0,current_timestamp,current_timestamp);

insert into sym_trigger
(trigger_id,source_table_name,channel_id, sync_on_insert, sync_on_update, sync_on_delete, last_update_time,create_time)
values('movement_dead', 'movement', 'enterprise_data',0,0,0,current_timestamp,current_timestamp);

insert into sym_trigger
(trigger_id, source_table_name, channel_id, last_update_time, create_time)
values ('stock_dead', 'stock', 'enterprise_data', current_timestamp, current_timestamp);

insert into sym_trigger
(trigger_id,source_table_name,channel_id, sync_on_insert, sync_on_update, sync_on_delete, last_update_time,create_time)
values('subsidy_dead', 'subsidy', 'enterprise_data',0,0,0,current_timestamp,current_timestamp);

insert into sym_trigger
(trigger_id, source_table_name, channel_id, last_update_time, create_time)
values ('donations_dead', 'donations', 'enterprise_data', current_timestamp, current_timestamp);

insert into sym_trigger
(trigger_id, source_table_name, channel_id, last_update_time, create_time)
values ('donation_item_dead', 'donation_item', 'enterprise_data', current_timestamp, current_timestamp);




--
-- End of trigger dead of two ways sync
--

--
-- Router
--
insert into sym_router
(router_id,source_node_group_id,target_node_group_id,router_type,create_time,last_update_time)
values('master_to_client', 'master', 'client', 'default',current_timestamp, current_timestamp);

insert into sym_router
(router_id,source_node_group_id,target_node_group_id,router_type,create_time,last_update_time)
values('client_to_master', 'client', 'master', 'default',current_timestamp, current_timestamp);

--
-- Trigger Router Links
--

--
-- Transactional links (clients report to master)
-- transactional data is NOT initially loaded
--

insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('primary_cash', 'master_to_client', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('primary_cash_item', 'master_to_client', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('sale', 'client_to_master', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('sale', 'master_to_client', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('sale_subsidy', 'client_to_master', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('sale_subsidy', 'master_to_client', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('sale_item', 'client_to_master', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('sale_item', 'master_to_client', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('cash', 'client_to_master', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('cash', 'master_to_client', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('cash_item', 'client_to_master', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('cash_item', 'master_to_client', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('cash_discard', 'client_to_master', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('cash_discard', 'master_to_client', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('posting_journal', 'client_to_master', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('group_invoice', 'client_to_master', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('group_invoice_item', 'client_to_master', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('employee_invoice', 'client_to_master', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('employee_invoice', 'master_to_client', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('employee_invoice_item', 'client_to_master', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('employee_invoice_item', 'master_to_client', 100, current_timestamp, current_timestamp);

--
-- dead sym_tigger router one way
--

insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('sale_dead', 'client_to_master', 200, current_timestamp, current_timestamp);

insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('sale_subsidy_dead', 'client_to_master', 200, current_timestamp, current_timestamp);

insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('sale_item_dead', 'client_to_master', 200, current_timestamp, current_timestamp);

insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('cash_dead', 'client_to_master', 200, current_timestamp, current_timestamp);

insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('cash_discard_dead', 'client_to_master', 200, current_timestamp, current_timestamp);

insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('cash_item_dead', 'client_to_master', 200, current_timestamp, current_timestamp);

insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('posting_journal_dead', 'client_to_master', 200, current_timestamp, current_timestamp);

insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('group_invoice_dead', 'client_to_master', 200, current_timestamp, current_timestamp);

insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('group_invoice_item_dead', 'client_to_master', 200, current_timestamp, current_timestamp);

insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('employee_invoice_dead', 'client_to_master', 200, current_timestamp, current_timestamp);

insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('employee_invoice_item_dead', 'client_to_master', 200, current_timestamp, current_timestamp);

--
-- dead sym_tigger router one way
--



--
-- Shared data links (common to all nodes)
--

-- Safe to sync both ways (UUID)

insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('language', 'master_to_client', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('patient', 'client_to_master', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('patient', 'master_to_client', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('patient_dead', 'client_to_master', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('country', 'client_to_master', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('country', 'master_to_client', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('country_dead', 'client_to_master', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('province', 'client_to_master', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('province', 'master_to_client', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('province_dead', 'client_to_master', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('sector', 'client_to_master', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('sector', 'master_to_client', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('sector_dead', 'client_to_master', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('village', 'client_to_master', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('village', 'master_to_client', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('village_dead', 'client_to_master', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('price_list', 'master_to_client', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('price_list_item', 'master_to_client', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('debitor_group', 'client_to_master', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('debitor_group', 'master_to_client', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('debitor_group_dead', 'client_to_master', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('patient_group', 'master_to_client', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('debitor', 'client_to_master', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('debitor', 'master_to_client', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('debitor_dead', 'client_to_master', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('patient_visit', 'client_to_master', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('patient_visit', 'master_to_client', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('patient_visit_dead', 'client_to_master', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('assignation_patient', 'client_to_master', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('assignation_patient', 'master_to_client', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('assignation_patient_dead', 'client_to_master', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('credit_note', 'client_to_master', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('credit_note', 'master_to_client', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('credit_note_dead', 'client_to_master', 200, current_timestamp, current_timestamp);

insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('inventory_group', 'master_to_client', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('inventory', 'master_to_client', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('inventory_log', 'master_to_client', 100, current_timestamp, current_timestamp);

-- Not safe to sync both ways (non UUID)
-- TODO
insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('currency', 'master_to_client', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('user', 'master_to_client', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('unit', 'master_to_client', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('permission', 'master_to_client', 100, current_timestamp, current_timestamp);

-- FIXME don't really need a trigger here for now
insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('enterprise', 'master_to_client', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('project', 'master_to_client', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('project_permission', 'master_to_client', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('fiscal_year', 'master_to_client', 100, current_timestamp, current_timestamp);

-- FIXME can probably just be a dead trigger
insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('account_type', 'master_to_client', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('account', 'master_to_client', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('cash_box', 'master_to_client', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('cash_box_account_currency', 'master_to_client', 100, current_timestamp, current_timestamp);

-- insert into sym_trigger_router
-- (trigger_id,router_id,initial_load_order,last_update_time,create_time)
-- values('caution', 'client_to_master', 100, current_timestamp, current_timestamp);

-- insert into sym_trigger_router
-- (trigger_id,router_id,initial_load_order,last_update_time,create_time)
-- values('caution', 'master_to_client', 100, current_timestamp, current_timestamp);

-- insert into sym_trigger_router
-- (trigger_id,router_id,initial_load_order,last_update_time,create_time)
-- values('caution_box', 'master_to_client', 100, current_timestamp, current_timestamp);

-- insert into sym_trigger_router
-- (trigger_id,router_id,initial_load_order,last_update_time,create_time)
-- values('caution_box_account_currency', 'master_to_client', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('inventory_unit', 'master_to_client', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('inventory_type', 'master_to_client', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('period', 'master_to_client', 100, current_timestamp, current_timestamp);

-- FIXME probably another dead trigger
insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('transaction_type', 'master_to_client', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('creditor', 'master_to_client', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('creditor_group', 'master_to_client', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('debitor_group_history', 'master_to_client', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('debitor_group_history', 'client_to_master', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('debitor_group_history_dead', 'client_to_master', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('depot', 'master_to_client', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('depot', 'client_to_master', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('depot_dead', 'client_to_master', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('employee', 'master_to_client', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('fonction', 'master_to_client', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('consumption', 'master_to_client', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('consumption', 'client_to_master', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('consumption_dead', 'client_to_master', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('consumption_loss', 'master_to_client', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('consumption_loss', 'client_to_master', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('consumption_loss_dead', 'client_to_master', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('consumption_patient', 'master_to_client', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('consumption_patient', 'client_to_master', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('consumption_patient_dead', 'client_to_master', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('consumption_service', 'master_to_client', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('consumption_service', 'client_to_master', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('consumption_service_dead', 'client_to_master', 200, current_timestamp, current_timestamp);

insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('consumption_rummage', 'master_to_client', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('consumption_rummage', 'client_to_master', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('consumption_rummage_dead', 'client_to_master', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('movement', 'master_to_client', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('movement', 'client_to_master', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('movement_dead', 'client_to_master', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('cost_center', 'master_to_client', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('cost_center_assignation', 'master_to_client', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('cost_center_assignation_item', 'master_to_client', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('donor', 'master_to_client', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('profit_center', 'master_to_client', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('purchase', 'master_to_client', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('purchase_item', 'master_to_client', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('supplier', 'master_to_client', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('service', 'master_to_client', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('stock', 'master_to_client', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('stock', 'client_to_master', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('subsidy', 'master_to_client', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('subsidy_dead', 'client_to_master', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('consumption_reversing', 'master_to_client', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('consumption_reversing', 'client_to_master', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('consumption_reversing_dead', 'client_to_master', 200, current_timestamp, current_timestamp);


insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('donations', 'client_to_master', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('donations', 'master_to_client', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('donations_dead', 'client_to_master', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('donation_item', 'client_to_master', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('donation_item', 'master_to_client', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('donation_item_dead', 'client_to_master', 100, current_timestamp, current_timestamp);

-- insert into sym_trigger_router
-- (trigger_id,router_id,initial_load_order,last_update_time,create_time)
-- values('caution_dead', 'client_to_master', 200, current_timestamp, current_timestamp);

insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('stock_dead', 'client_to_master', 200, current_timestamp, current_timestamp);

--
-- Dead triggers (initial data synchronisation)
--dead

-- TODO
