import type { Request as ExpressRequestType, Response as ExpressResponseType } from 'express';
import { filter, map, multiply, find, pick, count, any as anyMatch, divide } from 'ramda';
import axios from 'axios';
import { createClient } from 'redis';
import logger from '../logger';
import { models } from '../db';
import { _resolveWithCodeAndResponse, _throwErrorWithResponseCode } from './common';
import { redisViewsKey } from '../constants';
import https from 'https';
import { arrayify } from '@ethersproject/bytes';
import { verifyMessage } from '@ethersproject/wallet';

const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

export async function getAllNFTsByNetwork(req: ExpressRequestType, res: ExpressResponseType) {
  try {
    const allNFTs = await models.nft.findAll();
    let result = filter(
      (nft: any) => nft.network === req.params.network,
      map(nft => <any>nft.toJSON(), allNFTs)
    );

    result = map(nft => {
      return new Promise(resolve => {
        axios
          .get(nft.tokenURI, { httpsAgent })
          .then(resp => {
            logger('Now querying: %s', nft.tokenURI);

            resolve({
              ...nft,
              metadata: {
                ...resp.data
              }
            });
          })
          .catch(() => resolve(undefined));
      });
    }, result);

    result = await Promise.all(result);

    if (!!req.query.page) {
      const page = parseInt(<string>req.query.page);

      if (!(page > 0)) _throwErrorWithResponseCode('Page number must be greater than 0', 400);

      result = result.slice(multiply(page - 1, 10), multiply(page, 10));
    }

    return _resolveWithCodeAndResponse(res, 200, { result });
  } catch (error: any) {
    return _resolveWithCodeAndResponse(res, error.errorCode || 500, { error: error.message });
  }
}

export async function findNftByIdAndNetwork(req: ExpressRequestType, res: ExpressResponseType) {
  try {
    const allNFTs = await models.nft.findAll();
    let result = map(nft => nft.toJSON(), allNFTs);

    result = find(
      nft =>
        nft.network === req.params.network &&
        nft.tokenId === parseInt(req.params.tokenId) &&
        nft.collectionId === req.params.collectionId,
      result
    );

    if (!result) _throwErrorWithResponseCode('Asset not found', 404);

    const { data: metadata } = await axios.get((result as any).tokenURI, { httpsAgent });
    result = { ...(result as any), metadata };

    return _resolveWithCodeAndResponse(res, 200, { result });
  } catch (error: any) {
    return _resolveWithCodeAndResponse(res, error.errorCode || 500, { error: error.message });
  }
}

export async function findNFTsByCollectionId(req: ExpressRequestType, res: ExpressResponseType) {
  try {
    const allNFTs = await models.nft.findAll();
    let result = map(nft => nft.toJSON(), allNFTs);

    const { params, query } = pick(['params', 'query'], req);

    result = filter(nft => nft.collectionId === params.collectionId && nft.network === params.network, result).map(
      nft => {
        return new Promise(resolve => {
          axios
            .get(nft.tokenURI, { httpsAgent })
            .then(resp => {
              logger('Now querying: %s', nft.tokenURI);

              resolve({
                ...nft,
                metadata: {
                  ...resp.data
                }
              });
            })
            .catch(() => resolve(undefined));
        });
      }
    );

    result = await Promise.all(result);

    if (!!req.query.page) {
      const page = parseInt(<string>req.query.page);

      if (!(page > 0)) _throwErrorWithResponseCode('Page number must be greater than 0', 400);

      result = result.slice(multiply(page - 1, 10), multiply(page, 10));
    }

    return _resolveWithCodeAndResponse(res, 200, { result });
  } catch (error: any) {
    return _resolveWithCodeAndResponse(res, error.errorCode || 500, { error: error.message });
  }
}

export async function findNFTsByOwnerId(req: ExpressRequestType, res: ExpressResponseType) {
  try {
    const allNFTs = await models.nft.findAll();

    let result = map(nft => nft.toJSON(), allNFTs);

    const { params, query } = pick(['params', 'query'], req);

    result = filter(nft => nft.owner === params.accountId && nft.network === params.network, result).map(nft => {
      return new Promise(resolve => {
        axios
          .get(nft.tokenURI, { httpsAgent })
          .then(resp => {
            logger('Now querying: %s', nft.tokenURI);

            resolve({
              ...nft,
              metadata: {
                ...resp.data
              }
            });
          })
          .catch(() => resolve(undefined));
      });
    });

    result = await Promise.all(result);

    if (!!query.page) {
      const page = parseInt(<string>query.page);

      if (!(page > 0)) _throwErrorWithResponseCode('Page number must be greater than 0', 400);

      result = result.slice(multiply(page - 1, 10), multiply(page, 10));
    }

    return _resolveWithCodeAndResponse(res, 200, { result });
  } catch (error: any) {
    return _resolveWithCodeAndResponse(res, error.errorCode || 500, { error: error.message });
  }
}

export async function countAllNFtsByCollection(req: ExpressRequestType, res: ExpressResponseType) {
  try {
    const allNFTs = await models.nft.findAll();
    let result: any = map(item => item.toJSON(), allNFTs);

    result = count((r: any) => r.network === req.params.network && r.collectionId === req.params.collectionId, result);

    return _resolveWithCodeAndResponse(res, 200, { result });
  } catch (error: any) {
    return _resolveWithCodeAndResponse(res, error.errorCode || 500, { error: error.message });
  }
}

export async function getPricePerPeriod(req: ExpressRequestType, res: ExpressResponseType) {
  try {
    const { params, query } = pick(['query', 'params'], req);
    const timeStamp1: number = parseInt((query.fromTime as string) || (Date.now() - 60 * 60 * 1000).toString());
    const timeStamp2: number = parseInt((query.toTime as string) || Date.now().toString());

    const allOrders = await models.order.findAll();
    const allAcceptedOrders = map(item => item.toJSON(), allOrders).filter(
      order =>
        order.status === 'ACCEPTED' &&
        order.collection === params.collectionId &&
        order.tokenId === parseInt(params.tokenId) &&
        order.network === params.network
    );
    const allOrdersWithinTimestamp = allAcceptedOrders
      .filter(order => order.timeStamp >= divide(timeStamp1, 1000) && order.timeStamp <= divide(timeStamp2, 1000))
      .map(order => ({
        timestamp: order.timeStamp,
        price: order.amount
      }));

    const allSales = await models.sale.findAll();
    const allFinalizedSales = map(item => item.toJSON(), allSales).filter(
      sale =>
        sale.status === 'FINALIZED' &&
        sale.collectionId === params.collectionId &&
        sale.tokenId === parseInt(params.tokenId) &&
        sale.network === params.network
    );
    const allSalesWithinTimestamp = allFinalizedSales
      .filter(sale => sale.timeStamp >= divide(timeStamp1, 1000) && sale.timeStamp <= divide(timeStamp2, 1000))
      .map(sale => ({
        timestamp: sale.timeStamp,
        price: sale.price
      }));

    const result = [...allOrdersWithinTimestamp]
      .concat([...allSalesWithinTimestamp])
      .sort((a, b) => a.timestamp - b.timestamp);

    return _resolveWithCodeAndResponse(res, 200, { result });
  } catch (error: any) {
    return _resolveWithCodeAndResponse(res, error.errorCode || 500, { error: error.message });
  }
}

export async function checkItemInSale(req: ExpressRequestType, res: ExpressResponseType) {
  try {
    const allSales = await models.sale.findAll();
    let result: any = allSales.map(item => item.toJSON());
    result = anyMatch(
      (item: any) =>
        item.tokenId === parseInt(req.params.tokenId) &&
        item.collectionId === req.params.collectionId &&
        item.network === req.params.network &&
        item.status === 'ON_GOING',
      result
    );
    return _resolveWithCodeAndResponse(res, 200, { result });
  } catch (error: any) {
    return _resolveWithCodeAndResponse(res, 500, { error: error.message });
  }
}

export async function addNFTToFavorites(req: ExpressRequestType & { account: any }, res: ExpressResponseType) {
  try {
    const { params, account } = pick(['params', 'account'], req);
    const favorites = await models.favorite.findAll();
    const fave = favorites
      .map(f => f.toJSON())
      .find(
        f =>
          f.accountId === account.accountId &&
          f.network === params.network &&
          f.tokenId === parseInt(params.tokenId) &&
          f.collectionId === params.collectionId
      );
    const result = !!fave
      ? fave
      : (
          await models.favorite.addToFavorites({
            accountId: account.accountId,
            network: params.network,
            tokenId: parseInt(params.tokenId),
            collectionId: params.collectionId
          })
        ).toJSON();
    return _resolveWithCodeAndResponse(res, 200, { result });
  } catch (error: any) {
    return _resolveWithCodeAndResponse(res, 500, { error: error.message });
  }
}

export async function getTopSellingNFtsInCollection(req: ExpressRequestType, res: ExpressResponseType) {
  try {
    const { query, params } = pick(['query', 'params'], req);
    const allSales = await models.sale.findAll();
    const allSalesJSON = allSales.map(sale => sale.toJSON());
    let result: any = allSalesJSON
      .filter(
        sale =>
          sale.collectionId === params.collectionId && sale.network === params.network && sale.status === 'ON_GOING'
      )
      .sort((a, b) => b.price - a.price);

    result = await Promise.all(
      result.map(async (sale: any) => {
        const nfts = (await models.nft.findAll()).map(nft => nft.toJSON());
        const nft = nfts.find(
          n => n.tokenId === sale.tokenId && n.collectionId === sale.collectionId && n.network === sale.network
        );
        const metadataRes = await axios.get(nft.tokenURI, { httpsAgent });
        return { ...nft, metadata: metadataRes.data };
      })
    );

    const nfts: Array<any> = [];

    for (const item of result) if (!nfts.map(nft => nft.tokenId).includes(item.tokenId)) nfts.push(item);

    result = nfts;

    if (!!query.page) {
      const page = parseInt(<string>query.page);

      if (!(page > 0)) _throwErrorWithResponseCode('Page number must be greater than 0', 400);

      result = result.slice(multiply(page - 1, 10), multiply(page, 10));
    }

    return _resolveWithCodeAndResponse(res, 200, { result });
  } catch (error: any) {
    return _resolveWithCodeAndResponse(res, error.errorCode || 500, { error: error.message });
  }
}

export async function getNFTsInCollectionByPrice(req: ExpressRequestType, res: ExpressResponseType) {
  try {
    const { params, query } = pick(['params', 'query'], req);
    const allOrders = await models.order.findAll();
    const allAcceptedOrders = map(item => item.toJSON(), allOrders).filter(
      order =>
        order.status === 'ACCEPTED' && order.collection === params.collectionId && order.network === params.network
    );

    const allSales = await models.sale.findAll();
    const allFinalizedSales = map(item => item.toJSON(), allSales).filter(
      sale =>
        sale.status === 'FINALIZED' && sale.collectionId === params.collectionId && sale.network === params.network
    );

    let result: any = [...allAcceptedOrders]
      .map(o => ({
        collectionId: o.collection,
        price: o.amount,
        network: o.network,
        tokenId: o.tokenId
      }))
      .concat(
        [...allFinalizedSales].map(s => ({
          collectionId: s.collectionId,
          price: s.price,
          network: s.network,
          tokenId: s.tokenId
        }))
      )
      .sort((a, b) => b.price - a.price);

    result = await Promise.all(
      result.map(async (item: any) => {
        const nfts = await models.nft.findAll();
        const nftsJson = nfts.map(nft => nft.toJSON());
        const n = nftsJson.find(
          nft => nft.tokenId === item.tokenId && nft.collectionId === item.collectionId && nft.network === item.network
        );
        const metadataRes = await axios.get(n.tokenURI, { httpsAgent });
        return { ...n, metadata: metadataRes.data };
      })
    );

    const nfts: Array<any> = [];

    for (const item of result) if (!nfts.map(nft => nft.tokenId).includes(item.tokenId)) nfts.push(item);

    result = nfts;

    if (!!query.page) {
      const page = parseInt(<string>query.page);

      if (!(page > 0)) _throwErrorWithResponseCode('Page number must be greater than 0', 400);

      result = result.slice(multiply(page - 1, 10), multiply(page, 10));
    }

    return _resolveWithCodeAndResponse(res, 200, { result });
  } catch (error: any) {
    return _resolveWithCodeAndResponse(res, error.errorCode || 500, { error: error.message });
  }
}

export async function getNFTsWithOffersInCollection(req: ExpressRequestType, res: ExpressResponseType) {
  try {
    const { params, query } = pick(['params', 'query'], req);
    const allOrders = await models.order.findAll();
    const allAcceptedOrders = map(item => item.toJSON(), allOrders).filter(
      order =>
        order.status === 'STARTED' && order.collection === params.collectionId && order.network === params.network
    );

    let result: any = [...allAcceptedOrders]
      .map(o => ({
        collectionId: o.collection,
        price: o.amount,
        network: o.network,
        tokenId: o.tokenId
      }))
      .sort((a, b) => b.price - a.price);

    result = await Promise.all(
      result.map(async (item: any) => {
        const nfts = await models.nft.findAll();
        const nftsJson = nfts.map(nft => nft.toJSON());
        const n = nftsJson.find(
          nft => nft.tokenId === item.tokenId && nft.collectionId === item.collectionId && nft.network === item.network
        );
        const metadataRes = await axios.get(n.tokenURI, { httpsAgent });
        return { ...n, metadata: metadataRes.data };
      })
    );

    const nfts: Array<any> = [];

    for (const item of result) if (!nfts.map(nft => nft.tokenId).includes(item.tokenId)) nfts.push(item);

    result = nfts;

    if (!!query.page) {
      const page = parseInt(<string>query.page);

      if (!(page > 0)) _throwErrorWithResponseCode('Page number must be greater than 0', 400);

      result = result.slice(multiply(page - 1, 10), multiply(page, 10));
    }

    return _resolveWithCodeAndResponse(res, 200, { result });
  } catch (error: any) {
    return _resolveWithCodeAndResponse(res, error.errorCode || 500, { error: error.message });
  }
}

export async function getFavoriteNFTsOfUser(req: ExpressRequestType, res: ExpressResponseType) {
  try {
    const { params, query } = pick(['params', 'query'], req);
    const allFavorites = await models.favorite.findAll();
    let result: any = map((item: any) => item.toJSON(), allFavorites).filter(
      favorite => favorite.accountId === params.accountId && favorite.network === params.network
    );

    result = await Promise.all(
      result.map(
        (item: any) =>
          new Promise((resolve, reject) => {
            models.nft.findAll().then(nfts => {
              const nftsJson = nfts.map(nft => nft.toJSON());
              const spec = nftsJson.find(
                s => s.collectionId === item.collectionId && s.network === item.network && s.tokenId === item.tokenId
              );
              axios
                .get(spec.tokenURI, { httpsAgent })
                .then(res => {
                  const metadata = res.data;
                  return { ...spec, metadata };
                })
                .then(nft => {
                  resolve(nft);
                })
                .catch(reject);
            });
          })
      )
    );

    if (!!query.page) {
      const page = parseInt(<string>query.page);

      if (!(page > 0)) _throwErrorWithResponseCode('Page number must be greater than 0', 400);

      result = result.slice(multiply(page - 1, 10), multiply(page, 10));
    }

    return _resolveWithCodeAndResponse(res, 200, { result });
  } catch (error: any) {
    return _resolveWithCodeAndResponse(res, 500, { error: error.message });
  }
}

export async function getAllFavorites(req: ExpressRequestType, res: ExpressResponseType) {
  try {
    const allFavorites = await models.favorite.findAll();
    const result = map(item => item.toJSON(), allFavorites).filter(
      item =>
        item.tokenId === parseInt(req.params.tokenId) &&
        item.collectionId === req.params.collectionId &&
        item.network === req.params.network
    );
    return _resolveWithCodeAndResponse(res, 200, { result });
  } catch (error: any) {
    return _resolveWithCodeAndResponse(res, 500, { error: error.message });
  }
}

export async function removeNFTFromFavorites(req: ExpressRequestType & { account: any }, res: ExpressResponseType) {
  try {
    const { params, account } = pick(['params', 'account'], req);
    const result = await models.favorite.removeFromFavorites({
      where: {
        accountId: account.accountId,
        collectionId: params.collectionId,
        tokenId: parseInt(params.tokenId),
        network: params.network
      }
    });
    return _resolveWithCodeAndResponse(res, 200, { result });
  } catch (error: any) {
    return _resolveWithCodeAndResponse(res, 500, { error: error.message });
  }
}

export async function removeNFTFromCollection(req: ExpressRequestType, res: ExpressResponseType) {
  try {
    const { params, body } = pick(['params', 'body'], req);
    const { messageHash, signature } = body;
    const messageHashBytes = arrayify(messageHash);
    const accountId = verifyMessage(messageHashBytes, signature);
    const allCollections = (await models.collection.findAll()).map(collection => collection.toJSON());
    const collection = allCollections.find(c => c.collectionId === params.collectionId && c.network === params.network);

    if (!collection) _throwErrorWithResponseCode('Collection does not exist', 404);

    if (collection.collectionOwner !== accountId)
      _throwErrorWithResponseCode('Only this collection owner can access this resource', 400);

    const result = await models.nft.deleteNFT({
      where: {
        tokenId: parseInt(params.tokenId),
        collectionId: params.collectionId,
        network: params.network
      }
    });

    await models.sale.deleteSaleItem({
      where: { network: params.network, tokenId: parseInt(params.tokenId), collectionId: params.collectionId }
    });
    await models.order.deleteOrderItem({
      where: { network: params.network, tokenId: parseInt(params.tokenId), collection: params.collectionId }
    });
    await models.favorite.removeFromFavorites({
      where: { network: params.network, tokenId: parseInt(params.tokenId), collectionId: params.collectionId }
    });

    return _resolveWithCodeAndResponse(res, 200, { result });
  } catch (error: any) {
    return _resolveWithCodeAndResponse(res, error.errorCode || 500, { error: error.message });
  }
}

export async function view(req: ExpressRequestType, res: ExpressResponseType) {
  try {
    const redisClient = createClient();
    await redisClient.connect();

    const concatKey = redisViewsKey.concat(
      ':',
      req.params.network,
      ':',
      req.params.collectionId,
      ':',
      req.params.tokenId
    );

    if (await redisClient.exists(concatKey)) {
      const count = await redisClient.get(concatKey);
      const countAsInt = parseInt(count as string);
      await redisClient.set(concatKey, countAsInt + 1);
    } else {
      await redisClient.set(concatKey, 1);
    }

    await redisClient.disconnect();

    return _resolveWithCodeAndResponse(res, 200, { result: 'viewed' });
  } catch (error: any) {
    return _resolveWithCodeAndResponse(res, 500, { error: error.message });
  }
}

export async function countViews(req: ExpressRequestType, res: ExpressResponseType) {
  try {
    const redisClient = createClient();
    await redisClient.connect();

    const concatKey = redisViewsKey.concat(
      ':',
      req.params.network,
      ':',
      req.params.collectionId,
      ':',
      req.params.tokenId
    );
    let result: number = 0;

    if (await redisClient.exists(concatKey)) {
      const count = await redisClient.get(concatKey);
      result = parseInt(count as string);
    }

    await redisClient.disconnect();

    return _resolveWithCodeAndResponse(res, 200, { result });
  } catch (error: any) {
    return _resolveWithCodeAndResponse(res, 500, { error: error.message });
  }
}
