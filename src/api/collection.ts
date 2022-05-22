import type { Request as ExpressRequestType, Response as ExpressResponseType } from 'express';
import { filter, map, multiply, find, pick } from 'ramda';
import axios from 'axios';
import logger from '../logger';
import { models } from '../db';
import { _resolveWithCodeAndResponse, _throwErrorWithResponseCode } from './common';

export async function getAllCollectionsByNetwork(req: ExpressRequestType, res: ExpressResponseType) {
  try {
    const allCollections = await models.collection.findAll();
    let result = filter(
      (collection: any) => collection.network === req.params.network,
      map(collection => <any>collection.toJSON(), allCollections)
    );

    result = map(collection => {
      return new Promise(resolve => {
        axios
          .get(collection.collectionURI, { headers: { Accepts: 'application/json' } })
          .then(resp => {
            logger('Now querying: %s', collection.collectionURI);

            resolve({
              ...collection,
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
                .filter(order => order.network === req.params.network && order.collection === x.collection)
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

export async function findCollectionByIdAndNetwork(req: ExpressRequestType, res: ExpressResponseType) {
  try {
    const allCollections = await models.collection.findAll();
    let result = map(collection => collection.toJSON(), allCollections);

    result = find(
      collection => collection.network === req.params.network && collection.collectionId === req.params.collectionId,
      result
    );

    if (!result) _throwErrorWithResponseCode('Asset not found', 404);

    const { data: metadata } = await axios.get((result as any).collectionURI, {
      headers: { Accepts: 'application/json' }
    });
    result = { ...(result as any), metadata };

    return _resolveWithCodeAndResponse(res, 200, { result });
  } catch (error: any) {
    return _resolveWithCodeAndResponse(res, error.errorCode || 500, { error: error.message });
  }
}

export async function findCollectionsByOwner(
  req: ExpressRequestType & { accountId: string },
  res: ExpressResponseType
) {
  try {
    const allCollections = await models.collection.findAll();

    let result = map(collection => collection.toJSON(), allCollections);

    const { params, query, accountId } = pick(['params', 'query', 'accountId'], req);

    result = filter(
      collection => collection.collectionOwner === accountId && collection.network === params.network,
      result
    ).map(collection => {
      return new Promise(resolve => {
        axios
          .get(collection.collectionURI, { headers: { Accepts: 'application/json' } })
          .then(resp => {
            logger('Now querying: %s', collection.collectionURI);

            resolve({
              ...collection,
              metadata: {
                ...resp.data
              }
            });
          })
          .catch(() => resolve(undefined));
      });
    });

    result = await Promise.all(result);
    result = await Promise.all(
      map(x => {
        return new Promise((resolve, reject) => {
          models.order
            .findAll()
            .then(m =>
              m
                .map(order => order.toJSON())
                .filter(order => order.network === req.params.network && order.collection === x.collection)
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

export async function findTopSellingCollections(req: ExpressRequestType, res: ExpressResponseType) {
  try {
    const allCollections = await models.collection.findAll();
    const { query, params } = pick(['query', 'params'], req);
    let result = map(item => item.toJSON(), allCollections);

    result = result.filter(i => i.network === params.network);
    result = (
      await Promise.all(
        map(async item => {
          return {
            ...item,
            sales: (await models.sale.findAll())
              .map(i => i.toJSON())
              .filter(val => val.collectionId === item.collectionId && val.status === 'ON_GOING')
          };
        }, result)
      )
    )
      .filter(item => item.sales.length > 0)
      .sort((a, b) => a.sales.length - b.sales.length);

    result = await Promise.all(
      result.map(collection => {
        return new Promise(resolve => {
          axios
            .get(collection.collectionURI)
            .then(res => {
              resolve({
                ...collection,
                metadata: res.data
              });
            })
            .catch(() => resolve(undefined));
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

export async function findCollectionsByNumberOfItems(req: ExpressRequestType, res: ExpressResponseType) {
  try {
    const allCollections = await models.collection.findAll();
    const { query, params } = pick(['query', 'params'], req);
    let result = map(item => item.toJSON(), allCollections);
    result = result.filter(i => i.network === params.network);

    result = (
      await Promise.all(
        map(async item => {
          return {
            ...item,
            nfts: (await models.nft.findAll())
              .map(i => i.toJSON())
              .filter(val => val.collectionId === item.collectionId)
          };
        }, result)
      )
    )
      .filter(item => item.nfts.length > 0)
      .sort((a, b) => a.nfts.length - b.nfts.length);

    result = await Promise.all(
      result.map(collection => {
        return new Promise(resolve => {
          axios
            .get(collection.collectionURI)
            .then(res => {
              resolve({
                ...collection,
                metadata: res.data
              });
            })
            .catch(() => resolve(undefined));
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
