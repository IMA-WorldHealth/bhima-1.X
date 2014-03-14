
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
values('enterprise_data', 1, 100000, 1, 'Common data to every node');

insert into sym_channel
(channel_id, processing_order, max_batch_size, enabled, description)
values('transactional', 1, 100000, 1, 'Transactional data');

--
-- Triggers
--
insert into sym_trigger
(trigger_id,source_table_name,channel_id,last_update_time,create_time)
values('patient', 'patient', 'enterprise_data', current_timestamp, current_timestamp);

insert into sym_trigger
(trigger_id,source_table_name,channel_id,last_update_time,create_time)
values('sale', 'sale', 'transactional', current_timestamp, current_timestamp);

insert into sym_trigger
(trigger_id,source_table_name,channel_id,last_update_time,create_time)
values('sale_item', 'sale_item', 'transactional', current_timestamp, current_timestamp);

insert into sym_trigger
(trigger_id,source_table_name,channel_id,last_update_time,create_time)
values('village', 'village', 'enterprise_data', current_timestamp, current_timestamp);


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

insert into sym_trigger_router
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('patient', 'master_to_client', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router 
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('patient', 'client_to_master', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router 
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('village', 'client_to_master', 100, current_timestamp, current_timestamp);

insert into sym_trigger_router 
(trigger_id,router_id,initial_load_order,last_update_time,create_time)
values('village', 'master_to_client', 100, current_timestamp, current_timestamp);


-- insert into sym_trigger_router 
-- (trigger_id,router_id,initial_load_order,last_update_time,create_time)
-- values('transactional', 'client_to_master', 100, current_timestamp, current_timestamp);
