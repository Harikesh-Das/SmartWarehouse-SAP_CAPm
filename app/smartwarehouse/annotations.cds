using WarehouseService from '../../srv/warehouse-service';



// Sales order annotations

annotate WarehouseService.SalesOrder with @UI.SelectionFields: [
    orderId,
    customerId,
    status,
    allocatedWarehouse
];


annotate WarehouseService.SalesOrder with @UI.HeaderInfo: {
    TypeName       : 'Sales Order',
    TypeNamePlural : 'Sales Orders',
    Title          : { Value: orderId },
    Description    : { Value: customerId }
};


annotate WarehouseService.SalesOrder with @UI.LineItem: [
    {
        Value : orderId,
        Label : 'Order ID'
    },
    {
        Value : customerId,
        Label : 'Customer ID'
    },
    {
        Value: allocatedWarehouse,
        Label: 'allocated Warehouse'
    },
    {
        Value : status,
        Label : 'Status'
    }
];


annotate WarehouseService.SalesOrder with @UI.Identification: [
    {
        Value : orderId,
        Label : 'Order ID'
    },
    {
        Value : customerId,
        Label : 'Cust ID'
    },
    {
        Value : status,
        Label : 'Order Status'
    },
    {
        Value : allocatedWarehouse,
        Label : 'Allocated Warehouse'
    },
    {
        Value: customerLatitude,
        Label:'Customer Latitude'
    },
    {
        Value:customerLongitude,
        Label: 'Customer Longitude'
    }
];


annotate WarehouseService.SalesOrder with @UI.Facets: [

    {
        $Type  : 'UI.ReferenceFacet',
        ID     : 'GeneralInfo',
        Label  : 'Sales Order Details',
        Target : '@UI.Identification'
    },

    {
        $Type  : 'UI.ReferenceFacet',
        ID     : 'Items',
        Label  : 'Items in the Sales Order',
        Target : 'items/@UI.LineItem'
    }
];



// Items annotations


annotate WarehouseService.Item with @UI.LineItem: [
    {
        Value : itemId,
        Label : 'Item ID'
    },
    {
        Value : quantity,
        Label : 'Quantity'
    }
];


annotate WarehouseService.Item with @UI.HeaderInfo: {
    TypeName       : 'Item',
    TypeNamePlural : 'Items',
    Title          : {
        Value : itemId
    }
};


annotate WarehouseService.Item with @UI.Identification: [
    {
        Value : itemId,
        Label : 'Item ID'
    },
    {
        Value : quantity,
        Label : 'Quantity'
    }
];


annotate WarehouseService.Item with @UI.Facets: [
    {
        $Type  : 'UI.ReferenceFacet',
        ID     : 'ItemDetails',
        Label  : 'Item Information',
        Target : '@UI.FieldGroup#ItemInformation'
    }
];


annotate WarehouseService.Item with @UI.FieldGroup #ItemInformation: {
    Data: [
        {
            Value : itemId,
            Label : 'Item ID'
        },
        {
            Value : quantity,
            Label : 'Quantity'
        }
    ]
};