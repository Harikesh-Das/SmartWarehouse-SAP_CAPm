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

@assert.unique: {orderNo: [orderNo]}
entity SalesOrder : managed {
    key ID                : UUID;
        orderNo           : Integer not null;
        customerId        : String not null;
        status            : Status not null default 'open';
        customerLatitude  : String;
        customerLongitude : String;
}

entity Item : managed {
    key ID         : UUID;
        salesOrder : Association to SalesOrder;
        productId  : String;
        quantity   : Integer;

}

@assert.unique: {warehouseCode: [warehouseCode]}
entity Warehouse : managed {
    key ID                 : UUID;
        warehouseCode      : String;
        warehouseLatitude  : String;
        warehouseLongitude : String;
        item               : Association to Item;
        availableStock     : Integer;
}
