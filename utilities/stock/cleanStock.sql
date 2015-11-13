delete from consumption_service where consumption_uuid in (select uuid from consumption JOIN stock on consumption.tracking_number = stock.tracking_number where stock.purchase_order_uuid is null);

delete from consumption_patient where consumption_uuid in (select uuid from consumption JOIN stock on consumption.tracking_number = stock.tracking_number where stock.purchase_order_uuid is null);

delete from consumption where tracking_number in (select tracking_number from stock where purchase_order_uuid is null);

delete from movement where tracking_number in (select tracking_number from stock where stock.purchase_order_uuid is null);

delete from stock where purchase_order_uuid is null;
