import { JsonRpcProvider, Networkish } from '@ethersproject/providers';
import * as R from 'ramda';

const composeProvider = (url?: string, networkish?: Networkish) => new JsonRpcProvider(url, networkish);
export const buildProvider = R.nAry(2, composeProvider);
