import { Interface } from '@ethersproject/abi';
import { JsonRpcProvider, Networkish } from '@ethersproject/providers';
import { nAry } from 'ramda';
import ERC20ABI from '../assets/ERC20ABI.json';

const abiInterface = new Interface(ERC20ABI);

const composeProvider = (url?: string, networkish?: Networkish) => new JsonRpcProvider(url, networkish);
export const buildProvider = nAry(2, composeProvider);

const composeDecimals = (address: string, url?: string, networkish?: Networkish): Promise<number> => {
  const provider = buildProvider(url, networkish);
  return new Promise((resolve, reject) => {
    const decimalsHash = abiInterface.getSighash('decimals()');
    provider
      .call({ to: address, data: decimalsHash })
      .then(val => {
        const res = abiInterface.decodeFunctionResult('decimals()', val);
        resolve(res[0]);
      })
      .catch(reject);
  });
};
export const obtainERC20Decimals = nAry(3, composeDecimals);

const composeName = (address: string, url?: string, networkish?: Networkish): Promise<string> => {
  const provider = buildProvider(url, networkish);
  return new Promise((resolve, reject) => {
    const decimalsHash = abiInterface.getSighash('name()');
    provider
      .call({ to: address, data: decimalsHash })
      .then(val => {
        const res = abiInterface.decodeFunctionResult('name()', val);
        resolve(res[0]);
      })
      .catch(reject);
  });
};
export const obtainERC20Name = nAry(3, composeName);
