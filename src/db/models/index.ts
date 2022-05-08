import type { Sequelize } from 'sequelize';
import * as R from 'ramda';
import Account from './account';
import Collection from './collection';
import NFT from './nft';
import Order from './order';
import Sale from './sale';
import PushSubscription from './push';

const composeModels = (s: Sequelize) => ({
  account: new Account(s),
  collection: new Collection(s),
  nft: new NFT(s),
  order: new Order(s),
  sale: new Sale(s),
  push: new PushSubscription(s)
});

export const buildModels = R.nAry(1, composeModels);
