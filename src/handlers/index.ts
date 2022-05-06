import { Interface } from '@ethersproject/abi';
import { pick } from 'ramda';
import { buildProvider } from '../utils';
import { models } from '../db';
import marketABI from '../assets/MarketplaceABI.json';

const abiInterface = new Interface(marketABI);

export function handleCollectionDeploymentEvent(network: string, url: string) {
  return async function (log: any) {
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
  };
}
