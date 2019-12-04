const CATALOG_ID = 'Catalog-1';

handlers.buyItem = function(args, context) {
    let result = {};
    result.Error = '';
    const item = findItemFromCatalog(args.itemId);
    if (!item) {
        result.Error = 'Cannot find item';
    } else {
        if (!item.CustomData) {
            result = buyItemWithAlternativePriceOption(result, item);
        } else {
            const parsedCustomData = JSON.parse(item.CustomData);
            if (parsedCustomData.PricesOption === 1) {
                result = buyItemWithRequisitePriceOption(result, item);
            } else {
                result = buyItemWithAlternativePriceOption(result, item);
            }
        }
    }
    return result;
};

handlers.buyItemWithCurrencyId = function(args, context) {
    let result = {};
    result.Error = '';
    const item = findItemFromCatalog(args.itemId);
    if (!item) {
        result.Error = 'Cannot find item';
    } else {
        if (!item.CustomData) {
            result = buyItemWithAlternativePriceOptionWithId(result, item, args.currencyId);
        } else {
            const parsedCustomData = JSON.parse(item.CustomData);
            if (parsedCustomData.PricesOption !== 1) {
                result = buyItemWithAlternativePriceOptionWithId(result, item, args.currencyId);
            } else {
                result.Error = 'Invalid price option';
            }
        }
    }
    return result;
};

function buyItemWithAlternativePriceOptionWithId(result, item, currencyId) {
    const virtualCurrencyPrices = item.VirtualCurrencyPrices;
    const price = virtualCurrencyPrices[currencyId];
    const currency = getVirtualCurrency(currencyId);
    if (currency >= price) {
        // Have enough currency, reduce it, add item and return
        server.SubtractUserVirtualCurrency({
            PlayFabId: currentPlayerId,
            VirtualCurrency: currencyId,
            Amount: price
        });
        server.GrantItemsToUser({
            PlayFabId: currentPlayerId,
            ItemIds: [item.ItemId]
        });
        result.ItemId = [item.ItemId];
        return result;
    }
result.Error = 'Have not enough currency';
return result;
}

function buyItemWithAlternativePriceOption(result, item) {
    const virtualCurrencyPrices = item.VirtualCurrencyPrices;
    for (let currencyId in virtualCurrencyPrices) {
        const price = virtualCurrencyPrices[currencyId];
        const currency = getVirtualCurrency(currencyId);
        if (currency >= price) {
            // Have enough currency, reduce it, add item and return
            server.SubtractUserVirtualCurrency({
                PlayFabId: currentPlayerId,
                VirtualCurrency: currencyId,
                Amount: price
            });
            server.GrantItemsToUser({
                PlayFabId: currentPlayerId,
                ItemIds: [item.ItemId]
            });
            result.ItemId = [item.ItemId];
            return result;
        }
    }
    result.Error = 'Have not enough currency';
    return result;
}

function buyItemWithRequisitePriceOption(result, item) {
    const virtualCurrencyPrices = item.VirtualCurrencyPrices;
    for (let currencyId in virtualCurrencyPrices) {
        const price = virtualCurrencyPrices[currencyId];
        const currency = getVirtualCurrency(currencyId);
        if (currency < price) {
            result.Error = 'Have not enough currency';
            return result;
        }
    }
    // Have enough currencies, reduce them, add item and return
    for (let currencyId in virtualCurrencyPrices) {
        const price = virtualCurrencyPrices[currencyId];
        server.SubtractUserVirtualCurrency({
            PlayFabId: currentPlayerId,
            VirtualCurrency: currencyId,
            Amount: price
        });
    }
    server.GrantItemsToUser({
        PlayFabId: currentPlayerId,
        ItemIds: [item.ItemId]
    });
    result.ItemId = [item.ItemId];
    return result;
}

function findItemFromCatalog(itemId) {
    const catalog = server.GetCatalogItems({
        CatalogVersion: CATALOG_ID
    });
    // Find item by id
    for (let i = 0; i < catalog.Catalog.length; ++i) {
        const item = catalog.Catalog[i];
        if (item.ItemId === itemId) {
            return item;
        }
    }
    return undefined;
}

function getVirtualCurrency(currencyId) {
    const inventory = server.GetUserInventory({
        PlayFabId: currentPlayerId
    });
    return parseInt(inventory.VirtualCurrency[currencyId]);
}
