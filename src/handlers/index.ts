import { Interface } from '@ethersproject/abi';
import { pick } from 'ramda';
import { buildProvider } from '../utils';
import { models } from '../db';
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
      const data2 = abiInterface.getSighash('_imageURI()');
      const imageURICallResult = await provider.call({ to: _collection, data: data2 });
      const [collectionOwner] = abiInterface.decodeFunctionResult('_collectionOwner()', ownerCallResult);
      const [collectionImage] = abiInterface.decodeFunctionResult('_imageURI()', imageURICallResult);
      const storedCollection = await models.collection.addCollection({
        collectionName: _name,
        collectionOwner,
        collectionId: _collection,
        collectionSymbol: _symbol,
        collectionCategory: _category,
        timeStamp: timestamp,
        collectionImage,
        network
      });

      console.log('New collection created: %s', JSON.stringify(storedCollection.toJSON(), undefined, 2));
    } catch (error) {
      console.log(error);
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

      console.log('New token minted: %s', JSON.stringify(storedNFT.toJSON(), undefined, 2));
    } catch (error) {
      console.log(error);
    }
  };
}

export function handleMarketItemCreatedEvent(network: string) {
  return async function (log: any) {
    try {
      const parsedLog = abiInterface.parseLog(log);
      const {
        args: [_creator, _collection, _tokenId, _currency, _PriceInEther, _marketItemId, timestamp]
      } = pick(['args'], parsedLog);
      const storedSaleItem = await models.sale.addSaleItem({
        marketId: _marketItemId,
        creator: _creator,
        collectionId: _collection,
        tokenId: _tokenId,
        currency: _currency,
        timeStamp: timestamp,
        status: 'ON_GOING',
        network
      });

      console.log('New market item created: %s', JSON.stringify(storedSaleItem.toJSON(), undefined, 2));
    } catch (error) {
      console.log(error);
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

      console.log('Market item cancelled, %d items affected ', affectedRecord);
    } catch (error) {
      console.log(error);
    }
  };
}

export function handleSaleMadeEvent(network: string) {
  return async function (log: any) {
    try {
      const parsedLog = abiInterface.parseLog(log);
      const {
        args: [marketId, _seller, , , , , timestamp]
      } = pick(['args'], parsedLog);
      const affectedRecord = await models.sale.updateSaleItem(
        { status: 'FINALIZED', timeStamp: timestamp },
        { where: { marketId, network } }
      );

      console.log('Market item finalized, %d items affected', affectedRecord);
    } catch (error) {
      console.log(error);
    }
  };
}
