import { id as hashId } from '@ethersproject/hash';
import { buildProvider } from './utils';
import { providerUrl, contractAddress } from './env';

const provider = buildProvider(providerUrl, undefined);

export function handleEvents() {
  provider.on({ address: contractAddress, topics: [hashId('CollectionDeployed')] }, console.log);
}
