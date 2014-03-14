------------------------------------------------------------------------------
-- Configuration for enterprise IMCK
------------------------------------------------------------------------------

-- TODO patient channel is proof of concept, channels should encompass shared and transactional data
-- TODO tshikaji / pax relationship shouldn't be hardcoded - master -> clients in general

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
values('patient_channel', 1, 100000, 1, 'Synchronising patients among enterprise nodes');

-- insert into sym_channel 
-- (channel_id, processing_order, max_batch_size, enabled, description)
-- values('item', 1, 100000, 1, 'Item and pricing data');

insert into sym_trigger
(trigger_id,source_table_name,channel_id,last_update_time,create_time)
values('patient', 'patient', 'patient_channel', current_timestamp, current_timestamp);

--
-- Triggers
--
-- insert into sym_trigger 
-- (trigger_id,source_table_name,channel_id,last_update_time,create_time)
-- values('item_selling_price','item_selling_price','item',current_timestamp,current_timestamp);
--
-- insert into sym_trigger 
-- (trigger_id,source_table_name,channel_id,last_update_time,create_time)
-- values('item','item','item',current_timestamp,current_timestamp);
--
-- insert into sym_trigger 
-- (trigger_id,source_table_name,channel_id,last_update_time,create_time)
-- values('sale_transaction','sale_transaction','sale_transaction',current_timestamp,current_timestamp);
--
-- insert into sym_trigger 
-- (trigger_id,source_table_name,channel_id,last_update_time,create_time)
-- values('sale_return_line_item','sale_return_line_item','sale_transaction',current_timestamp,current_timestamp);
--
-- insert into sym_trigger 
-- (trigger_id,source_table_name,channel_id,last_update_time,create_time)
-- values('sale_tender_line_item','sale_tender_line_item','sale_transaction',current_timestamp,current_timestamp);
--
-- -- Example of a `dead` trigger, which is used to only sync the table during initial load
-- insert into sym_trigger 
-- (trigger_id,source_table_name,channel_id, sync_on_insert, sync_on_update, sync_on_delete, last_update_time,create_time)
-- values('sale_transaction_dead','sale_transaction','sale_transaction',0,0,0,current_timestamp,current_timestamp);

--
-- Routers
--

-- In this example, two routers pass everything all the time, and a third router
-- passes information to the specific store mentioned in the column 'store'

insert into sym_router 
(router_id,source_node_group_id,target_node_group_id,router_type,create_time,last_update_time)
values('master_to_client', 'master', 'client', 'default',current_timestamp, current_timestamp);

insert into sym_router 
(router_id,source_node_group_id,target_node_group_id,router_type,create_time,last_update_time)
values('client_to_master', 'client', 'master', 'default',current_timestamp, current_timestamp);

-- insert into sym_router 
-- (router_id,source_node_group_id,target_node_group_id,router_type,router_expression,create_time,last_update_time)
-- values('corp_2_one_store', 'corp', 'store', 'column','STORE_ID=:EXTERNAL_ID or OLD_STORE_ID=:EXTERNAL_ID',current_timestamp, current_timestamp);

--
-- Trigger Router Links
--

insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('patient', 'master_to_client', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router 
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('patient', 'client_to_master', 100, current_timestamp, current_timestamp);
--
-- insert into sym_trigger_router 
-- (trigger_id,router_id,initial_load_order,last_update_time,create_time)
-- values('item','corp_2_store', 100, current_timestamp, current_timestamp);
--
-- insert into sym_trigger_router 
-- (trigger_id,router_id,initial_load_order,initial_load_select,last_update_time,create_time)
-- values('item_selling_price','corp_2_one_store',100,'`store_id`=''$(externalId)''',current_timestamp,current_timestamp);
--
-- insert into sym_trigger_router 
-- (trigger_id,router_id,initial_load_order,last_update_time,create_time)
-- values('sale_transaction','store_2_corp', 200, current_timestamp, current_timestamp);
--
-- insert into sym_trigger_router 
-- (trigger_id,router_id,initial_load_order,last_update_time,create_time)
-- values('sale_return_line_item','store_2_corp', 200, current_timestamp, current_timestamp);
--
-- insert into sym_trigger_router 
-- (trigger_id,router_id,initial_load_order,last_update_time,create_time)
-- values('sale_tender_line_item','store_2_corp', 200, current_timestamp, current_timestamp);
--
-- -- Example of a 'dead' trigger, which is used to only sync the table during initial load
-- insert into sym_trigger_router 
-- (trigger_id,router_id,initial_load_order,last_update_time,create_time)
-- values('sale_transaction_dead','store_2_corp', 200, current_timestamp, current_timestamp);
