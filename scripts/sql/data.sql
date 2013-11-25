use `kpk`;

insert into `enterprise` values 
  (200, 'Kinshasa', 'RDC', 'Test', 0824741022, 1, 57000);

insert into `account` (`enterprise_id`, `id`, `account_txt`, `account_type_id`, `account_category`, `fixed`) values 
  (200, 57000, 0, 'Caisse of Enterprise 200', 1, 300, 0);

insert into `fiscal_year` (`enterprise_id`, `id`, `number_of_months`, `fiscal_year_txt`, `transaction_start_number`, `transaction_stop_number`, `fiscal_year_number`, `start_month`, `start_year`, `previous_fiscal_year`) values 
  ();
