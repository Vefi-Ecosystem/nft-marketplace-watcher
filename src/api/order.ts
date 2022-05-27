import axios from 'axios';
import type { Request as ExpressRequestType, Response as ExpressResponseType } from 'express';
import { filter, map, multiply, pick, count } from 'ramda';
import { models } from '../db';
import { _resolveWithCodeAndResponse, _throwErrorWithResponseCode } from './common';

export async function getAllOrdersByNFT(req: ExpressRequestType, res: ExpressResponseType) {
  try {
    const allOrders = await models.order.findAll();
    const allOrdersJSON = map(order => order.toJSON(), allOrders);
    const { params, query } = pick(['params', 'query'], req);
    let result = filter(x => x.tokenId === parseInt(params.tokenId) && x.network === params.network && x.collection === params.collectionId, allOrdersJSON);

    if (!!query.page) {
      const page = parseInt(<string>query.page);

      if (!(page > 0)) _throwErrorWithResponseCode('Page number must be greater than 0', 400);

      result = result.slice(multiply(page - 1, 10), multiply(page, 10));
    } else {
      result = result.slice(0, 10);
    }

    return _resolveWithCodeAndResponse(res, 200, { result });
  } catch (error: any) {
    return _resolveWithCodeAndResponse(res, error.errorCode || 500, { error: error.message });
  }
}

export async function getAllOrdersByCollection(req: ExpressRequestType, res: ExpressResponseType) {
  try {
    const allOrders = await models.order.findAll();
    const allOrdersJSON = map(order => order.toJSON(), allOrders);
    const { params, query } = pick(['params', 'query'], req);
    let result = filter(x => x.collection === params.collection && x.network === params.network, allOrdersJSON);

    if (!!query.page) {
      const page = parseInt(<string>query.page);

      if (!(page > 0)) _throwErrorWithResponseCode('Page number must be greater than 0', 400);

      result = result.slice(multiply(page - 1, 10), multiply(page, 10));
    } else {
      result = result.slice(0, 10);
    }

    return _resolveWithCodeAndResponse(res, 200, { result });
  } catch (error: any) {
    return _resolveWithCodeAndResponse(res, error.errorCode || 500, { error: error.message });
  }
}

export async function countAllOrders(req: ExpressRequestType, res: ExpressResponseType) {
  try {
    const allOrders = await models.order.findAll();
    const allOrdersJSON = map(order => order.toJSON(), allOrders);
    const result = count(item => !!item, allOrdersJSON);
    return _resolveWithCodeAndResponse(res, 200, { result });
  } catch (error: any) {
    return _resolveWithCodeAndResponse(res, 500, { error: error.message });
  }
}

export async function countAllOrdersByNetwork(req: ExpressRequestType, res: ExpressResponseType) {
  try {
    const allOrders = await models.order.findAll();
    const allOrdersJSON = map(order => order.toJSON(), allOrders);
    const { params } = pick(['params'], req);
    const result = count(item => item.network === params.network, allOrdersJSON);
    return _resolveWithCodeAndResponse(res, 200, { result });
  } catch (error: any) {
    return _resolveWithCodeAndResponse(res, 500, { error: error.message });
  }
}

export async function countAllOrdersByCollection(req: ExpressRequestType, res: ExpressResponseType) {
  try {
    const allOrders = await models.order.findAll();
    const allOrdersJSON = map(order => order.toJSON(), allOrders);
    const { params } = pick(['params'], req);
    const result = count(
      item => item.collection === params.collection && item.network === params.network,
      allOrdersJSON
    );
    return _resolveWithCodeAndResponse(res, 200, { result });
  } catch (error: any) {
    return _resolveWithCodeAndResponse(res, 500, { error: error.message });
  }
}

export async function getWatchList(req: ExpressRequestType & { account: any }, res: ExpressResponseType) {
  try {
    const allOrders = await models.order.findAll();
    const allOrdersJSON = map(order => order.toJSON(), allOrders);
    const { params, query, account } = pick(['params', 'query', 'account'], req);
    let result: any = allOrdersJSON.filter(
      order => order.creator === account.accountId && order.network === params.network
    );

    result = await Promise.all(
      result.map((item: any) => {
        return new Promise((resolve, reject) => {
          models.nft
            .findAll()
            .then(nfts => {
              const NFT = nfts
                .map(nft => nft.toJSON())
                .find(
                  nft =>
                    nft.tokenId === item.tokenId && nft.network === item.network && nft.collectionId === item.collection
                );
              axios
                .get(NFT.tokenURI)
                .then(res => {
                  const metadata = res.data;
                  resolve({
                    ...item,
                    nft: { ...NFT, metadata }
                  });
                })
                .catch(() => resolve(undefined));
            })
            .catch(reject);
        });
      })
    );

    if (!!query.page) {
      const page = parseInt(<string>query.page);

      if (!(page > 0)) _throwErrorWithResponseCode('Page number must be greater than 0', 400);

      result = result.slice(multiply(page - 1, 10), multiply(page, 10));
    } else {
      result = result.slice(0, 10);
    }

    return _resolveWithCodeAndResponse(res, 200, { result });
  } catch (error: any) {
    return _resolveWithCodeAndResponse(res, error.errorCode || 500, { error: error.message });
  }
}
