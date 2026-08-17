namespace smartwarehouse;

using {managed} from '@sap/cds/common';

/* Custom Datatypes */
type Status : String enum {
    open;
    allocated;
    completed;
    cancelled
};
//-------------------------------------------------------------------------


/* Entities */


entity SalesOrder : managed {
    key ID                : UUID;
        orderId           : String not null;
        customerId : String not null;
        status            : Status not null default 'open';
        customerLatitude  : Decimal not null;
        customerLongitude : Decimal not null;
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
