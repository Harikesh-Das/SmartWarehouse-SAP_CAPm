import cds from '@sap/cds';


/* OSRM Helper Function */
async function getWarehouseDistances(customerLat, customerLon, warehouses) {

    const coordinates = [
        `${customerLon},${customerLat}`,
        ...warehouses.map(w =>
            `${w.warehouseLongitude},${w.warehouseLatitude}`
        )
    ].join(';');

    const url =
        `https://router.project-osrm.org/table/v1/driving/${coordinates}` +
        `?sources=0&destinations=${warehouses.map((_, i) => i + 1).join(';')}` +
        `&annotations=distance`;

    let response;

    try {
        response = await fetch(url);
    } catch (error) {
        throw new Error('OSRM service is unavailable');
    }

    if (!response.ok) {
        throw new Error('OSRM service returned an error');
    }

    const data = await response.json();

    if (
        !data.distances ||
        !data.distances[0] ||
        data.distances[0].length !== warehouses.length
    ) {
        throw new Error('OSRM did not return valid distances');
    }

    const distances = data.distances[0];

    const results = warehouses.map((w, i) => ({
        warehouseId: w.warehouseId,
        distance: distances[i]
    }));

    results.sort((a, b) => a.distance - b.distance);

    return results;
}
//-----------------------------------------------------------------------------

export default cds.service.impl(function () {

    /* Accessing Entities */
    const { SalesOrder, Item, Warehouse } = this.entities;
    //-------------------------------------------------------------------------------------------------------
    
    /* Event Handlers */

    // Get best warehouse handler
    this.on('getBestWarehouse', async (req) => {

        const tx = cds.tx(req);
        const { salesOrderId } = req.data;


        // Validate SalesOrder
        const salesOrder = await tx.run(
            SELECT.one.from(SalesOrder)
                .where({ ID: salesOrderId })
        );

        if (!salesOrder) {
            return req.reject(
                404,
                `SalesOrder:${salesOrderId} not found`
            );
        }


        // Get all items of the SalesOrder
        const items = await tx.run(
            SELECT.from(Item)
                .where({ salesOrder_ID: salesOrderId })
        );

        if (items.length === 0) {
            return req.reject(
                404,
                `No items found for SalesOrder:${salesOrderId}`
            );
        }


        // Get all warehouse stock rows
        const warehouseRows = await tx.run(
            SELECT.from(Warehouse)
        );

        if (warehouseRows.length === 0) {
            return req.reject(
                404,
                `No warehouse stock found`
            );
        }


        // Find how many SalesOrder items each warehouse can supply
        const warehouseMap = new Map();

        for (const row of warehouseRows) {

            if (!warehouseMap.has(row.warehouseId)) {
                warehouseMap.set(row.warehouseId, {
                    warehouseId: row.warehouseId,
                    warehouseLatitude: row.warehouseLatitude,
                    warehouseLongitude: row.warehouseLongitude,
                    rows: []
                });
            }

            warehouseMap.get(row.warehouseId).rows.push(row);
        }


        const candidates = [];

        for (const warehouse of warehouseMap.values()) {

            const availableItems = [];

            for (const item of items) {

                const stockRow = warehouse.rows.find(
                    row => row.item_ID === item.ID
                );

                if (
                    stockRow &&
                    stockRow.availableStock >= item.quantity
                ) {
                    availableItems.push({
                        item,
                        stockRow
                    });
                }
            }

            candidates.push({
                ...warehouse,
                availableItems,
                coverage: availableItems.length
            });
        }


        // Find maximum item coverage
        const maxCoverage = Math.max(
            ...candidates.map(w => w.coverage)
        );

        const bestCandidates = candidates.filter(
            w => w.coverage === maxCoverage
        );


        if (maxCoverage === 0) {
            return req.reject(
                400,
                `No warehouse has sufficient stock for any item`
            );
        }


        // OSRM distance for warehouses with maximum coverage
        let distances;

        try {
            distances = await getWarehouseDistances(
                salesOrder.customerLatitude,
                salesOrder.customerLongitude,
                bestCandidates
            );
        } catch (error) {
            return req.reject(500, error.message);
        }


        // Find nearest among maximum coverage warehouses
        distances.sort(
            (a, b) => a.distance - b.distance
        );

        const nearest = distances[0];

        const selectedWarehouse = bestCandidates.find(
            w => w.warehouseId === nearest.warehouseId
        );


        // Allocate available items
        const availableItemIds = [];
        const unavailableItemIds = [];

        for (const item of items) {

            const allocation = selectedWarehouse.availableItems.find(
                x => x.item.ID === item.ID
            );

            if (!allocation) {
                unavailableItemIds.push(item.itemId);
                continue;
            }

            // Required quantity comes from the Item itself
            const newStock =
                allocation.stockRow.availableStock - item.quantity;

            if (newStock < 0) {
                unavailableItemIds.push(item.itemId);
                continue;
            }

            // Update stock
            await tx.run(
                UPDATE(Warehouse)
                    .set({
                        availableStock: newStock
                    })
                    .where({
                        ID: allocation.stockRow.ID
                    })
            );

            // Delete stock row when it reaches 0
            if (newStock === 0) {
                await tx.run(
                    DELETE.from(Warehouse)
                        .where({
                            ID: allocation.stockRow.ID
                        })
                );
            }

            availableItemIds.push(item.itemId);
        } 


        // Return result
        return {
            warehouseId: nearest.warehouseId,
            availableItems: availableItemIds.join(','),
            unavailableItems: unavailableItemIds.join(',')
        };
    });
});