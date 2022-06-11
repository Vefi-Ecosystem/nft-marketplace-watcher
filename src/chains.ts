interface NetworkInterface {
  url: string;
  contractAddress: string;
  name: string;
}

const chains: Array<NetworkInterface> = [
  {
    url: 'https://bsc-dataseed1.binance.org',
    contractAddress: '0x6ad3c20D6B29E363617aBE5f6473E029300b0f73',
    name: 'smartchain'
  },
  {
    url: 'https://polygon-rpc.com/',
    contractAddress: '0x6269b4705FCdBAbF81D4636e33c2100f757A05ac',
    name: 'polygon'
  },
  {
    url: 'https://mainnet-rpc.brisescan.com',
    contractAddress: '0xA1FcA451AF5782d6A25582DAc5AF77B867a5bcC9',
    name: 'bitgert'
  },
  {
    url: 'https://api-para.clover.finance',
    contractAddress: '0x64FAF984Bf60dE19e24238521814cA98574E3b00',
    name: 'clover'
  },
  {
    url: 'https://api.avax.network/ext/bc/C/rpc',
    contractAddress: '0xb562b09Bc2317D18a82FD415B7Fb33540Db7e723',
    name: 'avalanche'
  },
  {
    url: 'https://mainnet.telos.net/evm',
    contractAddress: '0x64FAF984Bf60dE19e24238521814cA98574E3b00',
    name: 'telos'
  }
];

export default chains;
