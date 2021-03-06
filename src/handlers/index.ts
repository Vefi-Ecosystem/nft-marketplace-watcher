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
import mail from '../mail';
import { userEmail } from '../env';
import { Networkish } from '@ethersproject/providers';

const collectionAbiInterface = new Interface(deployableCollectionABI);
const marketAbiInterface = new Interface(marketABI);

export function handleCollectionDeploymentEvent(network: string, url: string, networkish?: Networkish) {
  return async function (log: any) {
    try {
      const parsedLog = marketAbiInterface.parseLog(log);
      const {
        args: [_collection, collectionOwner, timestamp, _name, _category, _symbol]
      } = pick(['args'], parsedLog);
      const provider = buildProvider(url, networkish);
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

export function handleMarketItemCreatedEvent(url: string, network: string, networkish?: Networkish) {
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
              Math.pow(10, await obtainERC20Decimals(_currency, url, networkish))
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

export function handleSaleMadeEvent(url: string, network: string, networkish?: Networkish) {
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

      const tokenName = token === AddressZero ? 'Ethers' : await obtainERC20Name(token, url, networkish);
      const readableAmount =
        token === AddressZero
          ? parseFloat(formatEther(amount))
          : divide(
              parseInt(BigNumber.from(amount).toString()),
              Math.pow(10, await obtainERC20Decimals(token, url, networkish))
            );

      await sendNotification(owner, {
        title: 'Sale Made',
        data: `Account ${_buyer} has purchased NFT with ID ${tokenId} for ${readableAmount} ${tokenName}`
      });

      const allAccounts = await models.account.findAll();
      const allAccountsJSON = allAccounts.map(account => account.toJSON());

      const account = allAccountsJSON.find(a => a.accountId === owner);

      if (!!account) {
        // Create mail transport
        const transport = await mail();

        await transport.sendMail({
          from: userEmail,
          to: account.email,
          subject: `Offer made for item with ID ${tokenId} (Vefi NFT marketplace)`,
          html: `<div style="border: 1px solid #dcdcdc; padding: 4px; text-align: center;">
            <div style="display: flex; justify-content: center; align-items: center;">
              <h1 style="text-align: center;">Someone made an offer for your item</h1>
            </div>
            <br/>
            <span>Account ${_buyer} has purchased your item with ID <b>${tokenId}</b> for ${readableAmount} ${tokenName}</span>
          </div>`
        });
      }

      logger('Market item finalized, %d items affected', affectedRecord);
    } catch (error) {
      logger(error);
    }
  };
}

export function handleOrderMadeEvent(url: string, network: string, networkish?: Networkish) {
  return async function (log: any) {
    try {
      const parsedLog = marketAbiInterface.parseLog(log);
      const {
        args: [creator, to, collection, tokenId, bidCurrency, amount, orderId]
      } = pick(['args'], parsedLog);

      const tokenName = bidCurrency === AddressZero ? 'Ethers' : await obtainERC20Name(bidCurrency, url, networkish);
      const readableAmount =
        bidCurrency === AddressZero
          ? parseFloat(formatEther(amount))
          : divide(
              parseInt(BigNumber.from(amount).toString()),
              Math.pow(10, await obtainERC20Decimals(bidCurrency, url, networkish))
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
        timeStamp: Math.floor(divide(Date.now(), 1000))
      });

      const storedOrderJSON = storedOrder.toJSON();
      const allNFTs = (await models.nft.findAll()).map(nft => nft.toJSON());
      const NFT = allNFTs.find(
        n =>
          n.collectionId === storedOrderJSON.collection &&
          n.network === storedOrderJSON.network &&
          n.tokenId === storedOrderJSON.tokenId
      );

      const allAccounts = await models.account.findAll();
      const allAccountsJSON = allAccounts.map(account => account.toJSON());

      const account = allAccountsJSON.find(a => a.accountId === NFT.owner);

      await sendNotification(account.accountId, {
        title: 'New order',
        data: `Account ${creator} is offering ${readableAmount} ${tokenName} for NFT with ID ${tokenId}`
      });

      if (!!account) {
        // Create mail transport
        const transport = await mail();

        await transport.sendMail({
          from: userEmail,
          to: account.email,
          subject: `Offer made for item with ID ${tokenId} (Vefi NFT marketplace)`,
          html: `<div style="border: 1px solid #dcdcdc; padding: 4px; text-align: center;">
            <div style="display: flex; justify-content: center; align-items: center;">
              <h1 style="text-align: center;">Someone made an offer for your item</h1>
            </div>
            <br/>
            <span>Account ${creator} has offered ${readableAmount} ${tokenName} for your asset with ID <b>${tokenId}</b></span>
          </div>`
        });
      }

      logger('New offer made: %s', JSON.stringify(storedOrder.toJSON(), undefined, 2));
    } catch (error) {
      logger(error);
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

      await sendNotification(order.creator, {
        title: 'Offer accepted',
        data: `Account ${NFT.owner} has accepted your offer for ${NFT.tokenId}`
      });

      const allAccounts = await models.account.findAll();
      const allAccountsJSON = allAccounts.map(account => account.toJSON());

      const account = allAccountsJSON.find(a => a.accountId === order.creator);

      if (!!account) {
        // Create mail transport
        const transport = await mail();

        await transport.sendMail({
          from: userEmail,
          to: account.email,
          subject: `Offer accepted for token with ID ${NFT.tokenId} (Vefi NFT marketplace)`,
          html: `<div style="border: 1px solid #dcdcdc; padding: 4px; text-align: center;">
            <div style="display: flex; justify-content: center; align-items: center;">
              <h1 style="text-align: center;">Your offer was accepted</h1>
            </div>
            <br/>
            <span>Account ${NFT.owner} has accepted your offer for asset with ID <b>${NFT.tokenId}</b></span>
          </div>`
        });
      }

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
