import { id as hashId } from '@ethersproject/hash';
import { buildProvider } from './utils';
import { providerUrl, contractAddress } from './env';

const provider = buildProvider(providerUrl, undefined);

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

export function handleEvents() {
  provider.on({ address: contractAddress, topics: [collectionDeployedHash] }, console.log);
  provider.on({ address: contractAddress, topics: [mintHash] }, console.log);
  provider.on({ address: contractAddress, topics: [marketItemCreatedHash] }, console.log);
  provider.on({ address: contractAddress, topics: [marketItemCancelledHash] }, console.log);
  provider.on({ address: contractAddress, topics: [saleMadeHash] }, console.log);
  provider.on({ address: contractAddress, topics: [orderMadeHash] }, console.log);
  provider.on({ address: contractAddress, topics: [orderCancelledHash] }, console.log);
  provider.on({ address: contractAddress, topics: [orderEndedHash] }, console.log);
  provider.on({ address: contractAddress, topics: [orderRejectedHash] }, console.log);
}
