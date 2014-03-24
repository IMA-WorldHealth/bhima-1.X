
-- Configuration for enterprise IMCK
------------------------------------------------------------------------------

-- TODO patient channel is proof of concept, channels should encompass shared and transactional data
-- TODO tshikaji / pax relationship shouldn't be hardcoded - master -> clients in general
-- TODO sym_node_security definining initial load for client 005
--
-- Nodes
--
delete from sym_node_group_link;
delete from sym_node_group;
delete from sym_node_identity;
delete from sym_node_security;
delete from sym_node;

insert into sym_node_group (node_group_id, description) 
values ('master', 'IMCK Tshikaji');
insert into sym_node_group (node_group_id, description) 
values ('client', 'IMCK PAX Clinic');


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
values('transactional', 1, 100000, 1, 'Transactional data');

--
-- Triggers
--

--
-- Transactional triggers (clients report to master)
--
insert into sym_trigger
(trigger_id,source_table_name,channel_id,last_update_time,create_time)
values('sale', 'sale', 'transactional', current_timestamp, current_timestamp);

insert into sym_trigger
(trigger_id,source_table_name,channel_id,last_update_time,create_time)
values('sale_item', 'sale_item', 'transactional', current_timestamp, current_timestamp);

insert into sym_trigger
(trigger_id,source_table_name,channel_id,last_update_time,create_time)
values('cash', 'cash', 'transactional', current_timestamp, current_timestamp);

insert into sym_trigger
(trigger_id,source_table_name,channel_id,last_update_time,create_time)
values('cash_item', 'cash_item', 'transactional', current_timestamp, current_timestamp);

insert into sym_trigger
(trigger_id,source_table_name,channel_id,last_update_time,create_time)
values('posting_journal', 'posting_journal', 'transactional', current_timestamp, current_timestamp);

insert into sym_trigger
(trigger_id,source_table_name,channel_id,last_update_time,create_time)
values('general_ledger', 'general_ledger', 'transactional', current_timestamp, current_timestamp);

insert into sym_trigger
(trigger_id,source_table_name,channel_id,last_update_time,create_time)
values('group_invoice', 'group_invoice', 'transactional', current_timestamp, current_timestamp);

insert into sym_trigger
(trigger_id,source_table_name,channel_id,last_update_time,create_time)
values('group_invoice_item', 'group_invoice_item', 'transactional', current_timestamp, current_timestamp);

--
-- Shared data triggers (common to all nodes)
--

-- Safe to sync both ways (UUID)
insert into sym_trigger
(trigger_id,source_table_name,channel_id,last_update_time,create_time)
values('country', 'country', 'enterprise_data', current_timestamp, current_timestamp);

insert into sym_trigger
(trigger_id,source_table_name,channel_id,last_update_time,create_time)
values('province', 'province', 'enterprise_data', current_timestamp, current_timestamp);

insert into sym_trigger
(trigger_id,source_table_name,channel_id,last_update_time,create_time)
values('sector', 'sector', 'enterprise_data', current_timestamp, current_timestamp);

insert into sym_trigger
(trigger_id,source_table_name,channel_id,last_update_time,create_time)
values('village', 'village', 'enterprise_data', current_timestamp, current_timestamp);

insert into sym_trigger
(trigger_id,source_table_name,channel_id,last_update_time,create_time)
values('patient', 'patient', 'enterprise_data', current_timestamp, current_timestamp);

insert into sym_trigger
(trigger_id,source_table_name,channel_id,last_update_time,create_time)
values('price_list', 'price_list', 'enterprise_data', current_timestamp, current_timestamp);

insert into sym_trigger
(trigger_id,source_table_name,channel_id,last_update_time,create_time)
values('price_list_item', 'price_list_item', 'enterprise_data', current_timestamp, current_timestamp);

insert into sym_trigger
(trigger_id,source_table_name,channel_id,last_update_time,create_time)
values('debitor_group', 'debitor_group', 'enterprise_data', current_timestamp, current_timestamp);

insert into sym_trigger
(trigger_id,source_table_name,channel_id,last_update_time,create_time)
values('patient_group', 'patient_group', 'enterprise_data', current_timestamp, current_timestamp);

insert into sym_trigger
(trigger_id,source_table_name,channel_id,last_update_time,create_time)
values('debitor', 'debitor', 'enterprise_data', current_timestamp, current_timestamp);

insert into sym_trigger
(trigger_id,source_table_name,channel_id,last_update_time,create_time)
values('patient_visit', 'patient_visit', 'enterprise_data', current_timestamp, current_timestamp);

insert into sym_trigger
(trigger_id,source_table_name,channel_id,last_update_time,create_time)
values('assignation_patient', 'assignation_patient', 'enterprise_data', current_timestamp, current_timestamp);

insert into sym_trigger
(trigger_id,source_table_name,channel_id,last_update_time,create_time)
values('credit_note', 'credit_note', 'enterprise_data', current_timestamp, current_timestamp);

insert into sym_trigger
(trigger_id,source_table_name,channel_id,last_update_time,create_time)
values('inventory_group', 'inventory_group', 'enterprise_data', current_timestamp, current_timestamp);

insert into sym_trigger
(trigger_id,source_table_name,channel_id,last_update_time,create_time)
values('inventory', 'inventory', 'enterprise_data', current_timestamp, current_timestamp);

insert into sym_trigger
(trigger_id,source_table_name,channel_id,last_update_time,create_time)
values('inventory_detail', 'inventory_detail', 'enterprise_data', current_timestamp, current_timestamp);

insert into sym_trigger 
(trigger_id,source_table_name,channel_id,last_update_time,create_time)
values('inventory_log', 'inventory_log', 'enterprise_data', current_timestamp, current_timestamp);

-- Must enforce master to client for now (non UUID)
insert into sym_trigger
(trigger_id,source_table_name,channel_id,last_update_time,create_time)
values('currency', 'currency', 'enterprise_data', current_timestamp, current_timestamp);

insert into sym_trigger
(trigger_id,source_table_name,channel_id,last_update_time,create_time)
values('exchange_rate', 'exchange_rate', 'enterprise_data', current_timestamp, current_timestamp);

insert into sym_trigger
(trigger_id,source_table_name,channel_id,last_update_time,create_time)
values('user', 'user', 'enterprise_data', current_timestamp, current_timestamp);

insert into sym_trigger
(trigger_id,source_table_name,channel_id,last_update_time,create_time)
values('unit', 'unit', 'enterprise_data', current_timestamp, current_timestamp);

insert into sym_trigger
(trigger_id,source_table_name,channel_id,last_update_time,create_time)
values('permission', 'permission', 'enterprise_data', current_timestamp, current_timestamp);

insert into sym_trigger
(trigger_id,source_table_name,channel_id,last_update_time,create_time)
values('enterprise', 'enterprise', 'enterprise_data', current_timestamp, current_timestamp);

insert into sym_trigger
(trigger_id,source_table_name,channel_id,last_update_time,create_time)
values('project', 'enterprise', 'enterprise_data', current_timestamp, current_timestamp);

insert into sym_trigger
(trigger_id,source_table_name,channel_id,last_update_time,create_time)
values('fiscal_year', 'fiscal_year', 'enterprise_data', current_timestamp, current_timestamp);

insert into sym_trigger
(trigger_id,source_table_name,channel_id,last_update_time,create_time)
values('account_type', 'account_type', 'enterprise_data', current_timestamp, current_timestamp);

insert into sym_trigger
(trigger_id,source_table_name,channel_id,last_update_time,create_time)
values('account', 'account', 'enterprise_data', current_timestamp, current_timestamp);

insert into sym_trigger 
(trigger_id,source_table_name,channel_id,last_update_time,create_time)
values('cash_box', 'cash_box', 'enterprise_data', current_timestamp, current_timestamp);

insert into sym_trigger 
(trigger_id,source_table_name,channel_id,last_update_time,create_time)
values('cash_box_account_currency', 'cash_box_account_currency', 'enterprise_data', current_timestamp, current_timestamp);

insert into sym_trigger 
(trigger_id,source_table_name,channel_id,last_update_time,create_time)
values('caution_box', 'caution_box', 'enterprise_data', current_timestamp, current_timestamp);

insert into sym_trigger 
(trigger_id,source_table_name,channel_id,last_update_time,create_time)
values('caution_box_account_currency', 'caution_box_account_currency', 'enterprise_data', current_timestamp, current_timestamp);

-- insert into sym_trigger
-- (trigger_id,source_table_name,channel_id,last_update_time,create_time)
-- values('currency_account', 'currency_account', 'enterprise_data', current_timestamp, current_timestamp);

insert into sym_trigger
(trigger_id,source_table_name,channel_id,last_update_time,create_time)
values('inventory_unit', 'inventory_unit', 'enterprise_data', current_timestamp, current_timestamp);

insert into sym_trigger
(trigger_id,source_table_name,channel_id,last_update_time,create_time)
values('inventory_type', 'inventory_type', 'enterprise_data', current_timestamp, current_timestamp);

insert into sym_trigger
(trigger_id,source_table_name,channel_id,last_update_time,create_time)
values('period', 'period', 'enterprise_data', current_timestamp, current_timestamp);

insert into sym_trigger
(trigger_id,source_table_name,channel_id,last_update_time,create_time)
values('transaction_type', 'transaction_type', 'enterprise_data', current_timestamp, current_timestamp);

insert into sym_trigger
(trigger_id,source_table_name,channel_id,last_update_time,create_time)
values('period_total', 'period_total', 'enterprise_data', current_timestamp, current_timestamp);

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
values('sale', 'client_to_master', -1, current_timestamp, current_timestamp);

insert into sym_trigger_router 
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('sale_item', 'client_to_master', -1, current_timestamp, current_timestamp);

insert into sym_trigger_router 
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('cash', 'client_to_master', -1, current_timestamp, current_timestamp);

insert into sym_trigger_router 
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('cash_item', 'client_to_master', -1, current_timestamp, current_timestamp);

insert into sym_trigger_router 
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('posting_journal', 'client_to_master', -1, current_timestamp, current_timestamp);

insert into sym_trigger_router 
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('general_ledger', 'client_to_master', -1, current_timestamp, current_timestamp);

insert into sym_trigger_router 
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('group_invoice', 'client_to_master', -1, current_timestamp, current_timestamp);

insert into sym_trigger_router 
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('group_invoice_item', 'client_to_master', -1, current_timestamp, current_timestamp);

--
-- Shared data links (common to all nodes)
--

-- Safe to sync both ways (UUID)
insert into sym_trigger_router 
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('patient', 'client_to_master', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('patient', 'master_to_client', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router 
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('country', 'client_to_master', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router 
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('country', 'master_to_client', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router 
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('province', 'client_to_master', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router 
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('province', 'master_to_client', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router 
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('sector', 'client_to_master', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router 
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('sector', 'master_to_client', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router 
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('village', 'client_to_master', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router 
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('village', 'master_to_client', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router 
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('price_list', 'client_to_master', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router 
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('price_list', 'master_to_client', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router 
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('price_list_item', 'client_to_master', 100, current_timestamp, current_timestamp);

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
values('patient_group', 'client_to_master', 100, current_timestamp, current_timestamp);

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
values('patient_visit', 'client_to_master', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router 
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('patient_visit', 'master_to_client', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router 
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('assignation_patient', 'client_to_master', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router 
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('assignation_patient', 'master_to_client', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router 
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('credit_note', 'client_to_master', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router 
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('credit_note', 'master_to_client', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router 
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('inventory_group', 'client_to_master', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router 
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('inventory_group', 'master_to_client', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router 
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('inventory', 'client_to_master', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router 
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('inventory', 'master_to_client', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router 
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('inventory_detail', 'client_to_master', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router 
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('inventory_detail', 'master_to_client', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router 
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('inventory_log', 'client_to_master', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router 
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('inventory_log', 'master_to_client', 100, current_timestamp, current_timestamp);

-- Not safe to sync both ways (non UUID)
-- TODO
insert into sym_trigger_router 
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('currency', 'master_to_client', 100, current_timestamp, current_timestamp);

-- FIXME this will be overwritten
insert into sym_trigger_router 
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('exchange_rate', 'client_to_master', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router 
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('exchange_rate', 'master_to_client', 100, current_timestamp, current_timestamp);

-- FIXME conflict 
insert into sym_trigger_router 
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('user', 'client_to_master', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router 
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('user', 'master_to_client', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router 
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('unit', 'master_to_client', 100, current_timestamp, current_timestamp);

-- FIXME conflict
insert into sym_trigger_router 
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('permission', 'client_to_master', 100, current_timestamp, current_timestamp);

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
values('fiscal_year', 'master_to_client', 100, current_timestamp, current_timestamp);

-- FIXME can probably just be a dead trigger
insert into sym_trigger_router 
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('account_type', 'master_to_client', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router 
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('account', 'master_to_client', 100, current_timestamp, current_timestamp);

-- insert into sym_trigger_router 
-- (trigger_id,router_id,initial_load_order,last_update_time,create_time)
-- values('currency_account', 'master_to_client', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router 
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('cash_box', 'master_to_client', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router 
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('cash_box_account_currency', 'master_to_client', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router 
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('caution_box', 'master_to_client', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router 
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('caution_box_account_currency', 'master_to_client', 100, current_timestamp, current_timestamp);

-- FIXME conflict
insert into sym_trigger_router 
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('inventory_unit', 'client_to_master', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router 
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('inventory_unit', 'master_to_client', 100, current_timestamp, current_timestamp);

-- FIXME conflict
insert into sym_trigger_router 
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('inventory_type', 'client_to_master', 100, current_timestamp, current_timestamp);

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
values('period_total', 'master_to_client', 100, current_timestamp, current_timestamp);

-- 
-- Dead triggers (initial data synchronisation)
--

-- TODO
