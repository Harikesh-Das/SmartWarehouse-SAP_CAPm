using {smartwarehouse as db} from '../db/schema';

/* Custom Types */
type BestWarehouse : {
    warehouseId : String;
    availableItems: String;
    unavailableItems: String;
};
type BestOtherWarehouse:{
    warehouseIds:String;
    availableItem: String;
}
//-----------------------------------------------------------------------------------------------------------

/* Projections */
service WarehouseService {

    entity SalesOrder     as projection on db.SalesOrder{*,items};

    entity Item           as projection on db.Item;

    entity Warehouse      as projection on db.Warehouse{*,item};


    //-------------------------------------------------------------------

    /* Actions */
    action getBestWarehouse(salesOrderId:UUID) returns BestWarehouse;

    // Below Features Still in development no use for now
    
    // action findUnavailableItems(salesOrderId:UUID) returns many BestOtherWarehouse;

    


}
