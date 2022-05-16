import type { Request as ExpressRequestType, Response as ExpressResponseType } from 'express';
import { filter, map, multiply, find, pick } from 'ramda';
import axios from 'axios';
import logger from '../logger';
import { models } from '../db';
import { _resolveWithCodeAndResponse, _throwErrorWithResponseCode } from './common';

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
          .get(nft.tokenURI, { headers: { Accepts: 'application/json' } })
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
    result = await Promise.all(
      map(x => {
        return new Promise((resolve, reject) => {
          models.order
            .findAll()
            .then(m =>
              m
                .map(order => order.toJSON())
                .filter(order => order.network === req.params.network && order.tokenId === x.tokenId)
                .sort((a, b) => a.amount - b.amount)
            )
            .then(async val => {
              let topBuyers: any[] = [];

              for (const order of val) {
                const buyer = (
                  await Promise.all(
                    (
                      await models.account.findAll()
                    )
                      .map(acc => acc.toJSON())
                      .map(async acc => {
                        const metadataResp = await axios.get(acc.metadataURI);
                        return { ...acc, metadata: metadataResp.data };
                      })
                  )
                ).find(acc => acc.accountId === order.creator);
                topBuyers = [...topBuyers, buyer];
              }
              return Promise.resolve(topBuyers);
            })
            .then(topBuyers => {
              resolve({
                ...x,
                topBuyers
              });
            })
            .catch(reject);
        });
      }, result)
    );

    if (!!req.query.page) {
      const page = parseInt(<string>req.query.page);

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

export async function findNftByIdAndNetwork(req: ExpressRequestType, res: ExpressResponseType) {
  try {
    const allNFTs = await models.nft.findAll();
    let result = map(nft => nft.toJSON(), allNFTs);

    result = find(nft => nft.network === req.params.network && nft.tokenId === parseInt(req.params.tokenId), result);

    if (!!result) _throwErrorWithResponseCode('Asset not found', 404);

    const { data: metadata } = await axios.get((result as any).tokenURI, { headers: { Accepts: 'application/json' } });
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
            .get(nft.tokenURI, { headers: { Accepts: 'application/json' } })
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
    result = await Promise.all(
      map(x => {
        return new Promise((resolve, reject) => {
          models.order
            .findAll()
            .then(m =>
              m
                .map(order => order.toJSON())
                .filter(order => order.network === req.params.network && order.tokenId === x.tokenId)
                .sort((a, b) => a.amount - b.amount)
            )
            .then(async val => {
              let topBuyers: any[] = [];

              for (const order of val) {
                const buyer = (
                  await Promise.all(
                    (
                      await models.account.findAll()
                    )
                      .map(acc => acc.toJSON())
                      .map(async acc => {
                        const metadataResp = await axios.get(acc.metadataURI);
                        return { ...acc, metadata: metadataResp.data };
                      })
                  )
                ).find(acc => acc.accountId === order.creator);
                topBuyers = [...topBuyers, buyer];
              }
              return Promise.resolve(topBuyers);
            })
            .then(topBuyers => {
              resolve({
                ...x,
                topBuyers
              });
            })
            .catch(reject);
        });
      }, result)
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

export async function findNFTsByOwnerId(req: ExpressRequestType & { accountId: string }, res: ExpressResponseType) {
  try {
    const allNFTs = await models.nft.findAll();

    let result = map(nft => nft.toJSON(), allNFTs);

    const { params, query, accountId } = pick(['params', 'query', 'accountId'], req);

    result = filter(nft => nft.owner === accountId && nft.network === params.network, result).map(nft => {
      return new Promise(resolve => {
        axios
          .get(nft.tokenURI, { headers: { Accepts: 'application/json' } })
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
    } else {
      result = result.slice(0, 10);
    }

    return _resolveWithCodeAndResponse(res, 200, { result });
  } catch (error: any) {
    return _resolveWithCodeAndResponse(res, error.errorCode || 500, { error: error.message });
  }
}
