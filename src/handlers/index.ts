import { Interface } from '@ethersproject/abi';
import { find, map, pick } from 'ramda';
import { buildProvider } from '../utils';
import { models } from '../db';
import logger from '../logger';
import marketABI from '../assets/MarketplaceABI.json';

const abiInterface = new Interface(marketABI);

export function handleCollectionDeploymentEvent(network: string, url: string) {
  return async function (log: any) {
    try {
      const parsedLog = abiInterface.parseLog(log);
      const {
        args: [_collection, timestamp, _name, _category, _symbol]
      } = pick(['args'], parsedLog);
      const provider = buildProvider(url, undefined);
      const data = abiInterface.getSighash('_collectionOwner()');
      const ownerCallResult = await provider.call({ to: _collection, data });
      const data2 = abiInterface.getSighash('_collectionURI()');
      const collectionURICallResult = await provider.call({ to: _collection, data: data2 });
      const [collectionOwner] = abiInterface.decodeFunctionResult('_collectionOwner()', ownerCallResult);
      const [collectionURI] = abiInterface.decodeFunctionResult('_collectionURI()', collectionURICallResult);
      const storedCollection = await models.collection.addCollection({
        collectionName: _name,
        collectionOwner,
        collectionId: _collection,
        collectionSymbol: _symbol,
        collectionCategory: _category,
        timeStamp: timestamp,
        collectionURI,
        network
      });

      logger('New collection created: %s', JSON.stringify(storedCollection.toJSON(), undefined, 2));
    } catch (error) {
      logger(error);
    }
  };
}

export function handleMintEvent(network: string) {
  return async function (log: any) {
    try {
      const parsedLog = abiInterface.parseLog(log);
      const {
        args: [_collection, _tokenId, timestamp, _tokenURI, owner]
      } = pick(['args'], parsedLog);
      const storedNFT = await models.nft.saveNFT({
        owner,
        network,
        collectionId: _collection,
        tokenId: _tokenId,
        tokenURI: _tokenURI,
        timeStamp: timestamp
      });

      logger('New token minted: %s', JSON.stringify(storedNFT.toJSON(), undefined, 2));
    } catch (error) {
      logger(error);
    }
  };
}

export function handleMarketItemCreatedEvent(network: string) {
  return async function (log: any) {
    try {
      const parsedLog = abiInterface.parseLog(log);
      const {
        args: [_creator, _collection, _tokenId, _currency, _price, _marketItemId, timestamp]
      } = pick(['args'], parsedLog);
      const storedSaleItem = await models.sale.addSaleItem({
        marketId: _marketItemId,
        creator: _creator,
        collectionId: _collection,
        tokenId: _tokenId,
        currency: _currency,
        timeStamp: timestamp,
        status: 'ON_GOING',
        price: _price,
        network
      });

      logger('New market item created: %s', JSON.stringify(storedSaleItem.toJSON(), undefined, 2));
    } catch (error) {
      logger(error);
    }
  };
}

export function handleMarketItemCancelledEvent(network: string) {
  return async function (log: any) {
    try {
      const parsedLog = abiInterface.parseLog(log);
      const {
        args: [marketId, timestamp]
      } = pick(['args'], parsedLog);
      const affectedRecord = await models.sale.updateSaleItem(
        { status: 'CANCELLED', timeStamp: timestamp },
        { where: { marketId, network } }
      );

      logger('Market item cancelled, %d items affected ', affectedRecord);
    } catch (error) {
      logger(error);
    }
  };
}

export function handleSaleMadeEvent(network: string) {
  return async function (log: any) {
    try {
      const parsedLog = abiInterface.parseLog(log);
      const {
        args: [marketId, , _buyer, tokenId, , , timestamp]
      } = pick(['args'], parsedLog);

      const affectedRecord = await models.sale.updateSaleItem(
        { status: 'FINALIZED', timeStamp: timestamp },
        { where: { marketId, network } }
      );
      await models.nft.updateNFT(
        {
          owner: _buyer
        },
        { where: { tokenId, network } }
      );

      logger('Market item finalized, %d items affected', affectedRecord);
    } catch (error) {
      logger(error);
    }
  };
}

export function handleOrderMadeEvent(network: string) {
  return async function (log: any) {
    try {
      const parsedLog = abiInterface.parseLog(log);
      const {
        args: [creator, to, collection, tokenId, bidCurrency, amount, orderId]
      } = pick(['args'], parsedLog);
      const storedOrder = await models.order.addOrder({
        creator,
        to,
        collection,
        orderId,
        bidCurrency,
        amount,
        tokenId,
        status: 'STARTED',
        network
      });

      logger('New offer made: %s', JSON.stringify(storedOrder.toJSON(), undefined, 2));
    } catch (error) {
      logger(error);
    }
  };
}

export function handleOrderEndedEvent(network: string) {
  return async function (log: any) {
    try {
      const parsedLog = abiInterface.parseLog(log);
      const {
        args: [orderId, timestamp]
      } = pick(['args'], parsedLog);
      const affectedCount = await models.order.updateOrderItem(
        { status: 'ACCEPTED', timeStamp: timestamp },
        { where: { orderId, network } }
      );

      let allOrders: any[] = await models.order.findAll();
      allOrders = map(order => order.toJSON(), allOrders);

      const order = find(or => or.orderId === orderId && or.network === network, allOrders);

      const NFT = find(
        (nft: any) => order.tokenId === nft.tokenId && nft.network === network,
        map(nft => nft.toJSON(), await models.nft.findAll())
      );

      await models.nft.updateNFT({ owner: order.creator }, { where: { tokenId: NFT.tokenId, network } });

      logger('Order updated. Rows affected: %d', affectedCount);
    } catch (error) {
      logger(error);
    }
  };
}

export function handleOrderCancelledEvent(network: string) {
  return async function (log: any) {
    try {
      const parsedLog = abiInterface.parseLog(log);
      const {
        args: [orderId, timestamp]
      } = pick(['args'], parsedLog);
      const affectedCount = await models.order.updateOrderItem(
        { status: 'CANCELLED', timeStamp: timestamp },
        { where: { orderId, network } }
      );

      logger('Order updated. Rows affected: %d', affectedCount);
    } catch (error) {
      logger(error);
    }
  };
}

export function handleOrderRejectedEvent(network: string) {
  return async function (log: any) {
    try {
      const parsedLog = abiInterface.parseLog(log);
      const {
        args: [orderId, timestamp]
      } = pick(['args'], parsedLog);
      const affectedCount = await models.order.updateOrderItem(
        { status: 'REJECTED', timeStamp: timestamp },
        { where: { orderId, network } }
      );

      logger('Order updated. Rows affected: %d', affectedCount);
    } catch (error) {
      logger(error);
    }
  };
}
