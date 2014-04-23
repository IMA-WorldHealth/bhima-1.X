#Inventory 

* Reduction of stock 
  * Module/ point of entry / exit at pharmacy, and smaller pharmaciecs.
    Movement from pharmacy to services like surgery, pediatrics etc.
  * Pharmacy directly to patients etc. Keeping track of stock 
* Movement of money from stock, COGS and sale. Price of purchase should factor 
in cost of transport and labour etc. Given a sale, money moves from balance to 
expense (losing assets), money is charged to debitor and assigned to sale 
account.
* Business logic for stock entry, depreciation and exit. 

##Modules

###Current Modules

1. Registering Stock 
  * Creating inventory group
  * Creating inventory units
2. Update Stock 
3. Register Suppliers (creditors)
  * Create creditor groups (accounts)
4. Price Report
5. Purchase order
  * Register employees
6. Primary cash module to pay purchase orders

###Required Modules

1. Stock Entry 
2. Stock Exit; Movement vs. Loss
3. Warehouse management 
4. Quote for purchase
5. Depreciation 
  * Seperation of physical and stock inventory
6. Sell excess/ expiring stock to vendors
7. Monitor stock expiration / usage, report on low quantities and expiration
8. Purchase based on standard deviation metrics

##Database 

|Inventory          |
---------------------
|code               |
|description        |
|inventory_group    |
|unit_id            |
|volume             |
|weight             |
|stock_min          |
|stock_max          |

|Inventory Items    |
---------------------
|inventory_id       |
|purchase_price     |
|expiration_date    |
|purchase_date      |
|lot_number         |
|entry_date         |
|purchase_order_uuid|
|quantity           |
|tracking_number    |
|receipt_id         |

|Inventory Group    | 
---------------------
|code               | 
|name               | 
|account_id         |

|Inventory Unit     |
---------------------
|name               |
|value              |

|Inventory Type     |
---------------------
|text               |

|Stock Movement?    | 
---------------------
|document_id        |
|direction (type)   |
|lot number         |
|date               |
|quantity           |
|tracking_number    |
|warehouse_id       |
|document_id        |
|amount             |
|direction (ent|exi)|
|?destination       |

|?Warehouse         |
---------------------

|?Pharmacy          |
---------------------
