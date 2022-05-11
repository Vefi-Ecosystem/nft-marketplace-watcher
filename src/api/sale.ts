import type { Request as ExpressRequestType, Response as ExpressResponseType } from 'express';
import { filter, map, multiply, pick } from 'ramda';
import axios from 'axios';
import { models } from '../db';
import { _resolveWithCodeAndResponse, _throwErrorWithResponseCode } from './common';

export async function getAllOngoingSales(req: ExpressRequestType, res: ExpressResponseType) {
  try {
    const allSales = await models.sale.findAll();
    const allSalesJSON = map(x => x.toJSON(), allSales);
    const { params, query } = pick(['params', 'query'], req);
    let result: any[] = filter(x => x.network === params.network && x.status === 'ON_GOING', allSalesJSON).map(item => {
      return new Promise(resolve => {
        models.nft
          .findAll()
          .then(nfts => {
            const nft = nfts
              .map(nft => nft.toJSON())
              .find(nft => nft.network === params.network && nft.tokenId === item.tokenId);
            axios
              .get(nft.tokenURI, { headers: { Accepts: 'application/json' } })
              .then(metadata => {
                resolve({
                  ...item,
                  nft: { ...nft, metadata }
                });
              })
              .catch(() => resolve(undefined));
          })
          .catch(() => resolve(undefined));
      });
    });

    result = await Promise.all(result);

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

export async function getAllOngoingSalesByCollection(req: ExpressRequestType, res: ExpressResponseType) {
  try {
    const allSales = await models.sale.findAll();
    const allSalesJSON = map(x => x.toJSON(), allSales);
    const { params, query } = pick(['params', 'query'], req);
    let result: any[] = filter(
      x => x.network === params.network && x.status === 'ON_GOING' && x.collectionId === params.collectionId,
      allSalesJSON
    ).map(item => {
      return new Promise(resolve => {
        models.nft
          .findAll()
          .then(nfts => {
            const nft = nfts
              .map(nft => nft.toJSON())
              .find(nft => nft.network === params.network && nft.tokenId === item.tokenId);
            axios
              .get(nft.tokenURI, { headers: { Accepts: 'application/json' } })
              .then(metadata => {
                resolve({
                  ...item,
                  nft: { ...nft, metadata }
                });
              })
              .catch(() => resolve(undefined));
          })
          .catch(() => resolve(undefined));
      });
    });

    result = await Promise.all(result);

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
