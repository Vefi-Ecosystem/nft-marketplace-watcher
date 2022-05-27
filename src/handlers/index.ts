import { BigNumber } from '@ethersproject/bignumber';
import { Interface } from '@ethersproject/abi';
import { AddressZero } from '@ethersproject/constants';
import { formatEther } from '@ethersproject/units';
import { find, map, pick, divide } from 'ramda';
import { buildProvider, obtainERC20Decimals, obtainERC20Name } from '../utils';
import { models } from '../db';
import logger from '../logger';
import deployableCollectionABI from '../assets/DeployableCollectionABI.json';
import marketABI from '../assets/MarketplaceABI.json';
import { sendNotification } from '../push';

const collectionAbiInterface = new Interface(deployableCollectionABI);
const marketAbiInterface = new Interface(marketABI);

export function handleCollectionDeploymentEvent(network: string, url: string) {
  return async function (log: any) {
    try {
      const parsedLog = marketAbiInterface.parseLog(log);
      const {
        args: [_collection, collectionOwner, timestamp, _name, _category, _symbol]
      } = pick(['args'], parsedLog);
      const provider = buildProvider(url, undefined);
      const data = collectionAbiInterface.getSighash('_collectionURI()');
      const collectionURICallResult = await provider.call({ to: _collection, data });
      const [collectionURI] = collectionAbiInterface.decodeFunctionResult('_collectionURI()', collectionURICallResult);
      const storedCollection = await models.collection.addCollection({
        collectionName: _name,
        collectionOwner,
        collectionId: _collection,
        collectionSymbol: _symbol,
        collectionCategory: _category,
        timeStamp: BigNumber.from(timestamp).toNumber(),
        collectionURI,
        network
      });

      logger('New collection created: %s', JSON.stringify(storedCollection.toJSON(), undefined, 2));
    } catch (error) {
      logger(error);
    }
  };
}

export function handleMintEvent(network: string) {
  return async function (log: any) {
    try {
      const parsedLog = marketAbiInterface.parseLog(log);
      const {
        args: [_collection, _tokenId, timestamp, _tokenURI, owner]
      } = pick(['args'], parsedLog);
      const storedNFT = await models.nft.saveNFT({
        owner,
        network,
        collectionId: _collection,
        tokenId: _tokenId,
        tokenURI: _tokenURI,
        timeStamp: timestamp
      });

      logger('New token minted: %s', JSON.stringify(storedNFT.toJSON(), undefined, 2));
    } catch (error) {
      logger(error);
    }
  };
}

export function handleMarketItemCreatedEvent(url: string, network: string) {
  return async function (log: any) {
    try {
      const parsedLog = marketAbiInterface.parseLog(log);
      const {
        args: [_creator, _collection, _tokenId, _currency, _price, _marketItemId, timestamp]
      } = pick(['args'], parsedLog);

      const readableAmount =
        _currency === AddressZero
          ? parseFloat(formatEther(_price))
          : divide(
              parseInt(BigNumber.from(_price).toString()),
              Math.pow(10, await obtainERC20Decimals(_currency, url, undefined))
            );

      const storedSaleItem = await models.sale.addSaleItem({
        marketId: _marketItemId,
        creator: _creator,
        collectionId: _collection,
        tokenId: _tokenId,
        currency: _currency,
        timeStamp: timestamp,
        status: 'ON_GOING',
        price: readableAmount,
        network
      });

      logger('New market item created: %s', JSON.stringify(storedSaleItem.toJSON(), undefined, 2));
    } catch (error) {
      logger(error);
    }
  };
}

export function handleMarketItemCancelledEvent(network: string) {
  return async function (log: any) {
    try {
      const parsedLog = marketAbiInterface.parseLog(log);
      const {
        args: [marketId, timestamp]
      } = pick(['args'], parsedLog);
      const affectedRecord = await models.sale.updateSaleItem(
        { status: 'CANCELLED', timeStamp: timestamp },
        { where: { marketId, network } }
      );

      logger('Market item cancelled, %d items affected ', affectedRecord);
    } catch (error) {
      logger(error);
    }
  };
}

export function handleSaleMadeEvent(url: string, network: string) {
  return async function (log: any) {
    try {
      const parsedLog = marketAbiInterface.parseLog(log);
      const {
        args: [marketId, owner, _buyer, tokenId, collectionId, token, amount, timestamp]
      } = pick(['args'], parsedLog);

      const affectedRecord = await models.sale.updateSaleItem(
        { status: 'FINALIZED', timeStamp: timestamp },
        { where: { marketId, network } }
      );
      await models.nft.updateNFT(
        {
          owner: _buyer
        },
        { where: { tokenId, network, collectionId } }
      );

      const tokenName = token === AddressZero ? 'Ethers' : await obtainERC20Name(token, url, undefined);
      const readableAmount =
        token === AddressZero
          ? parseFloat(formatEther(amount))
          : divide(
              parseInt(BigNumber.from(amount).toString()),
              Math.pow(10, await obtainERC20Decimals(token, url, undefined))
            );

      await sendNotification(owner, {
        title: 'Sale Made',
        data: `Account ${_buyer} has purchased NFT with ID ${tokenId} for ${readableAmount} ${tokenName}`
      });

      logger('Market item finalized, %d items affected', affectedRecord);
    } catch (error) {
      logger(error);
    }
  };
}

export function handleOrderMadeEvent(url: string, network: string) {
  return async function (log: any) {
    try {
      const parsedLog = marketAbiInterface.parseLog(log);
      const {
        args: [creator, to, collection, tokenId, bidCurrency, amount, orderId]
      } = pick(['args'], parsedLog);

      const tokenName = bidCurrency === AddressZero ? 'Ethers' : await obtainERC20Name(bidCurrency, url, undefined);
      const readableAmount =
        bidCurrency === AddressZero
          ? parseFloat(formatEther(amount))
          : divide(
              parseInt(BigNumber.from(amount).toString()),
              Math.pow(10, await obtainERC20Decimals(bidCurrency, url, undefined))
            );

      const storedOrder = await models.order.addOrder({
        creator,
        to,
        collection,
        orderId,
        bidCurrency,
        amount: readableAmount,
        tokenId,
        status: 'STARTED',
        network,
        timeStamp: divide(Date.now(), 1000)
      });

      await sendNotification(bidCurrency, {
        title: 'New order',
        data: `Account ${creator} is offering ${readableAmount} ${tokenName} for NFT with ID ${tokenId}`
      });

      logger('New offer made: %s', JSON.stringify(storedOrder.toJSON(), undefined, 2));
    } catch (error: any) {
      logger(error.message);
    }
  };
}

export function handleOrderEndedEvent(network: string) {
  return async function (log: any) {
    try {
      const parsedLog = marketAbiInterface.parseLog(log);
      const {
        args: [orderId, timestamp]
      } = pick(['args'], parsedLog);
      const affectedCount = await models.order.updateOrderItem(
        { status: 'ACCEPTED', timeStamp: timestamp },
        { where: { orderId, network } }
      );

      let allOrders: any[] = await models.order.findAll();
      allOrders = map(order => order.toJSON(), allOrders);

      const order = find(or => or.orderId === orderId && or.network === network, allOrders);

      const NFT = find(
        (nft: any) => order.tokenId === nft.tokenId && nft.network === network && nft.collectionId === order.collection,
        map(nft => nft.toJSON(), await models.nft.findAll())
      );

      await models.nft.updateNFT(
        { owner: order.creator },
        { where: { tokenId: NFT.tokenId, network, collectionId: NFT.collectionId } }
      );

      logger('Order updated. Rows affected: %d', affectedCount);
    } catch (error) {
      logger(error);
    }
  };
}

export function handleOrderCancelledEvent(network: string) {
  return async function (log: any) {
    try {
      const parsedLog = marketAbiInterface.parseLog(log);
      const {
        args: [orderId, timestamp]
      } = pick(['args'], parsedLog);
      const affectedCount = await models.order.updateOrderItem(
        { status: 'CANCELLED', timeStamp: timestamp },
        { where: { orderId, network } }
      );

      logger('Order updated. Rows affected: %d', affectedCount);
    } catch (error) {
      logger(error);
    }
  };
}

export function handleOrderRejectedEvent(network: string) {
  return async function (log: any) {
    try {
      const parsedLog = marketAbiInterface.parseLog(log);
      const {
        args: [orderId, timestamp]
      } = pick(['args'], parsedLog);
      const affectedCount = await models.order.updateOrderItem(
        { status: 'REJECTED', timeStamp: timestamp },
        { where: { orderId, network } }
      );

      logger('Order updated. Rows affected: %d', affectedCount);
    } catch (error) {
      logger(error);
    }
  };
}
