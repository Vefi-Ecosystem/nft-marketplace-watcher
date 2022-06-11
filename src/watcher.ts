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
import { Networkish } from '@ethersproject/providers';

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

export function handleEvents(url: string, address: string, network: string, networkish?: Networkish) {
  const provider = buildProvider(url, networkish);

  provider.on({ address, topics: [collectionDeployedHash] }, handleCollectionDeploymentEvent(network, url, networkish));
  provider.on({ address, topics: [mintHash] }, handleMintEvent(network));
  provider.on({ address, topics: [marketItemCreatedHash] }, handleMarketItemCreatedEvent(url, network, networkish));
  provider.on({ address, topics: [marketItemCancelledHash] }, handleMarketItemCancelledEvent(network));
  provider.on({ address, topics: [saleMadeHash] }, handleSaleMadeEvent(url, network, networkish));
  provider.on({ address, topics: [orderMadeHash] }, handleOrderMadeEvent(url, network, networkish));
  provider.on({ address, topics: [orderCancelledHash] }, handleOrderCancelledEvent(network));
  provider.on({ address, topics: [orderEndedHash] }, handleOrderEndedEvent(network));
  provider.on({ address, topics: [orderRejectedHash] }, handleOrderRejectedEvent(network));
}
