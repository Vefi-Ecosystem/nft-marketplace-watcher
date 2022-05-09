import { id as hashId } from '@ethersproject/hash';
import { buildProvider } from './utils';
import {
  handleCollectionDeploymentEvent,
  handleMintEvent,
  handleMarketItemCreatedEvent,
  handleMarketItemCancelledEvent,
  handleSaleMadeEvent,
  handleOrderMadeEvent,
  handleOrderEndedEvent,
  handleOrderCancelledEvent,
  handleOrderRejectedEvent
} from './handlers';

const collectionDeployedHash: string = hashId('CollectionDeployed(address,address,uint256,string,string,string)');
const mintHash: string = hashId('Mint(address,uint256,uint256,string,address)');
const marketItemCreatedHash: string = hashId(
  'MarketItemCreated(address,address,uint256,address,uint256,bytes32,uint256)'
);
const marketItemCancelledHash: string = hashId('MarketItemCancelled(bytes32,uint256)');
const saleMadeHash: string = hashId('SaleMade(bytes32,address,address,uint256,address,address,uint256,uint256)');
const orderMadeHash: string = hashId('OrderMade(address,address,address,uint256,address,uint256,bytes32)');
const orderCancelledHash: string = hashId('OrderItemCancelled(bytes32,uint256)');
const orderEndedHash: string = hashId('OrderItemEnded(bytes32,uint256)');
const orderRejectedHash: string = hashId('OrderItemRejected(bytes32, uint256)');

export function handleEvents(url: string, address: string, network: string) {
  const provider = buildProvider(url, undefined);

  provider.on({ address, topics: [collectionDeployedHash] }, handleCollectionDeploymentEvent(network, url));
  provider.on({ address, topics: [mintHash] }, handleMintEvent(network));
  provider.on({ address, topics: [marketItemCreatedHash] }, handleMarketItemCreatedEvent(url, network));
  provider.on({ address, topics: [marketItemCancelledHash] }, handleMarketItemCancelledEvent(network));
  provider.on({ address, topics: [saleMadeHash] }, handleSaleMadeEvent(url, network));
  provider.on({ address, topics: [orderMadeHash] }, handleOrderMadeEvent(url, network));
  provider.on({ address, topics: [orderCancelledHash] }, handleOrderCancelledEvent(network));
  provider.on({ address, topics: [orderEndedHash] }, handleOrderEndedEvent(network));
  provider.on({ address, topics: [orderRejectedHash] }, handleOrderRejectedEvent(network));
}
