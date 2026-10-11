namespace smartwarehouse;

using {managed} from '@sap/cds/common';

/* Custom Datatypes */
type Status : String enum {
    open;
    allocated;

};
//-------------------------------------------------------------------------


/* Entities */


entity SalesOrder : managed {
    key ID                   : UUID;
        orderId              : String not null;
        customerId           : String not null;
        status               : Status not null default 'open';
        customerLatitude     : Decimal not null;
        customerLongitude    : Decimal not null;
        items                : Composition of many Item
                                   on items.salesOrder = $self;
        allocatedWarehouse   : String not null default 'None';
        availableItems       : String not null default 'None';
        unavailableItems     : String not null default 'None';
        /* warehouseSalesOrders : Composition of many WarehouseSalesOrder
                                   on warehouseSalesOrders.salesOrder = $self; */
}

entity Item : managed {
    key ID         : UUID;
        salesOrder : Association to SalesOrder not null;
        itemId     : String not null; // Identifies what product was ordered.
        quantity   : Integer not null;

}

entity Warehouse : managed {
    key ID                 : UUID;
        warehouseId        : String not null;
        warehouseLatitude  : Decimal not null;
        warehouseLongitude : Decimal not null;
        item               : Association to Item not null;
        availableStock     : Integer not null default 0;
}

// Below Features Still in development no use for now

/* entity WarehouseSalesOrder : managed {
    key ID               : UUID;
        wsoId            : String not null;
        buyingWarehouse  : Association to Warehouse not null;
        sellingWarehouse : Association to Warehouse not null;
        salesOrder       : Association to SalesOrder not null;
        status           : Status not null default 'open';
}

entity WarehouseSOItem : managed {
    key ID                  : UUID;
        warehouseSalesOrder : Association to WarehouseSalesOrder not null;
        itemId              : String not null;
        quantity            : Integer not null;
}

entity WarehousePurchaseOrder : managed {
    key ID                  : UUID;
        wpoId               : String not null;
        buyingWarehouse     : Association to Warehouse not null;
        sellingWarehouse    : Association to Warehouse not null;
        warehouseSalesOrder : Association to WarehouseSalesOrder not null;
        status              : Status not null default 'open';

}

entity WarehousePOItem : managed {
    key ID                     : UUID;
        warehousePurchaseOrder : Association to WarehousePurchaseOrder not null;
        itemId                 : String not null;
        quantity               : Integer not null;

} */
