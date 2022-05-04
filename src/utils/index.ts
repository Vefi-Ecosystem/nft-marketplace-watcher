import { Signer } from '@ethersproject/abstract-signer';
import { Contract, ContractInterface } from '@ethersproject/contracts';
import { Provider } from '@ethersproject/providers';
import { curry } from 'ramda';
import axios, { AxiosRequestHeaders } from 'axios';

interface JsonRpcRequestBody {
  jsonrpc: '2.0';
  method: string;
  params: Array<any>;
  id: number;
}

export const buildContract = curry(
  (address: string, contractInterface: ContractInterface, signerOrProvider?: Signer | Provider) =>
    new Contract(address, contractInterface, signerOrProvider)
);

export const rpcRequest = curry((url: string, body: JsonRpcRequestBody, headers?: AxiosRequestHeaders) =>
  axios.post(url, body, { headers: { 'Content-Type': 'application/json', ...headers } })
);