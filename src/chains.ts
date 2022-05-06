import { bscProviderUrl, bscContractAddress } from './env';

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
  }
];

export default chains;
