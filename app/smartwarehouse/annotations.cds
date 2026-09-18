using WarehouseService from '../../srv/warehouse-service';

annotate WarehouseService.SalesOrder with @UI.HeaderInfo: {
    TypeName      : 'Sales Order',
    TypeNamePlural: 'Sales Orders',
    Title         : {Value: orderId},
    Description   : {Value: customerId} 
};

annotate WarehouseService.SalesOrder with @UI.Identification: [
    {Value: orderId, Label: 'Order ID'},
    {Value: customerId, Label: 'Cust ID'},
    {Value: status, Label: 'Order Status'},
    {Value: customerLatitude, Label: 'Customer Latitude'}
];

annotate WarehouseService.Item with @UI.LineItem: [
    {Value: itemId},
    {Value: quantity},
    
];

annotate WarehouseService.SalesOrder with @UI.Facets: [
    {
        $Type : 'UI.ReferenceFacet',
        ID    : 'GeneralInfo',
        Label : 'Sales Order Details',
        Target: '@UI.Identification'
    },
    {
        $Type : 'UI.ReferenceFacet',
        ID    : 'Items',
        Label : 'Items in the Sales Order',
        Target: 'items/@UI.LineItem'
    }
];

annotate WarehouseService.Item with @UI.HeaderInfo: {
    TypeName      : 'Item',
    TypeNamePlural: 'Items',
    Title         : {Value: itemId}
};

annotate WarehouseService.Item with @UI.Identification: [
    {Value: itemId},
    {Value: quantity}
];

annotate WarehouseService.Item with @UI.Facets: [{
    $Type : 'UI.ReferenceFacet',
    ID    : 'ItemDetails',
    Label : 'Item Details',
    Target: '@UI.Identification'
}];
