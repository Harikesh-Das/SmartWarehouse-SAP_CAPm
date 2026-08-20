using {smartwarehouse as db} from '../db/schema';

/* Custom Types */
type BestWarehouse : {
    warehouseId : String;
    availableItems: String;
    unavailableItems: String;
};
//-----------------------------------------------------------------------------------------------------------

/* Projections */
service WarehouseService {

    entity SalesOrder     as projection on db.SalesOrder{*,items};

    entity Item           as projection on db.Item;

    entity Warehouse      as projection on db.Warehouse;


    //-------------------------------------------------------------------

    /* Actions */
    action getBestWarehouse(salesOrderId:UUID) returns BestWarehouse;
}
