import {
  bscProviderUrl,
  bscContractAddress,
  polygonProviderUrl,
  polygonContractAddress,
  ethereumProviderUrl,
  ethereumContractAddress
} from './env';

interface NetworkInterface {
  url?: string;
  contractAddress?: string;
  name: string;
}

const chains: Array<NetworkInterface> = [
  {
    url: bscProviderUrl,
    contractAddress: bscContractAddress,
    name: 'smartchain'
  },
  {
    url: polygonProviderUrl,
    contractAddress: polygonContractAddress,
    name: 'polygon'
  },
  {
    url: ethereumProviderUrl,
    contractAddress: ethereumContractAddress,
    name: 'ethereum'
  }
];

export default chains;
