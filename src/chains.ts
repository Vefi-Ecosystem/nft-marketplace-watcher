import { bscProviderUrl, bscContractAddress, polygonProviderUrl, polygonContractAddress } from './env';

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
  }
];

export default chains;
