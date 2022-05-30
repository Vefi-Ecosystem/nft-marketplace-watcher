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
          .get(collection.collectionURI)
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
      result.map(item => {
        return new Promise((resolve, reject) => {
          models.order
            .findAll()
            .then(orders => orders.map(order => order.toJSON()))
            .then(orders =>
              orders.filter(
                order =>
                  order.collection === item.collectionId &&
                  order.network === req.params.network &&
                  order.status === 'ACCEPTED'
              )
            )
            .then(orders => orders.map(order => order.amount))
            .then(orders => {
              models.sale
                .findAll()
                .then(sales => sales.map(sale => sale.toJSON()))
                .then(sales =>
                  sales.filter(
                    sale =>
                      sale.collectionId === item.collectionId &&
                      sale.network === req.params.network &&
                      sale.status === 'FINALIZED'
                  )
                )
                .then(sales => sales.map(sale => sale.price))
                .then(sales => {
                  const allFigures = [...orders].concat([...sales]).sort((a, b) => b - a);
                  resolve({
                    ...item,
                    floorPrice: allFigures[0]
                  });
                })
                .catch(reject);
            })
            .catch(reject);
        });
      })
    );

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

export async function findCollectionByIdAndNetwork(req: ExpressRequestType, res: ExpressResponseType) {
  try {
    const allCollections = await models.collection.findAll();
    let result: any = map(collection => collection.toJSON(), allCollections);

    result = find(
      (collection: any) =>
        collection.network === req.params.network && collection.collectionId === req.params.collectionId,
      result
    );

    if (!result) _throwErrorWithResponseCode('Asset not found', 404);

    const { data: metadata } = await axios.get((result as any).collectionURI, {
      headers: { Accepts: 'application/json' }
    });

    result = { ...(result as any), metadata };

    const orderAmountsByCollection = (await models.order.findAll())
      .map(order => order.toJSON())
      .filter(
        order =>
          order.collection === result.collectionId && order.network === result.network && order.status === 'ACCEPTED'
      )
      .map(order => order.amount);
    const salePricesByCollection = (await models.sale.findAll())
      .map(sale => sale.toJSON())
      .filter(
        sale =>
          sale.collectionId === result.collectionId && sale.network === result.network && sale.STATUS === 'FINALIZED'
      )
      .map(sale => sale.price);

    const floorPrice = [...orderAmountsByCollection].concat([...salePricesByCollection]).sort((a, b) => b - a)[0];
    result = { ...result, floorPrice };

    return _resolveWithCodeAndResponse(res, 200, { result });
  } catch (error: any) {
    return _resolveWithCodeAndResponse(res, error.errorCode || 500, { error: error.message });
  }
}

export async function findCollectionsByOwner(req: ExpressRequestType, res: ExpressResponseType) {
  try {
    const allCollections = await models.collection.findAll();

    let result = map(collection => collection.toJSON(), allCollections);

    const { params, query } = pick(['params', 'query'], req);

    result = filter(
      collection => collection.collectionOwner === params.accountId && collection.network === params.network,
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
      result.map(item => {
        return new Promise((resolve, reject) => {
          models.order
            .findAll()
            .then(orders => orders.map(order => order.toJSON()))
            .then(orders =>
              orders.filter(order => order.collection === item.collectionId && order.network === params.network)
            )
            .then(orders => orders.map(order => order.amount))
            .then(orders => {
              models.sale
                .findAll()
                .then(sales => sales.map(sale => sale.toJSON()))
                .then(sales =>
                  sales.filter(sale => sale.collectionId === item.collectionId && sale.network === params.network)
                )
                .then(sales => sales.map(sale => sale.price))
                .then(sales => {
                  const allFigures = [...orders].concat([...sales]).sort((a, b) => a - b);
                  resolve({
                    ...item,
                    floorPrice: allFigures[0]
                  });
                })
                .catch(reject);
            })
            .catch(reject);
        });
      })
    );

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

    result = await Promise.all(
      result.map(item => {
        return new Promise((resolve, reject) => {
          models.order
            .findAll()
            .then(orders => orders.map(order => order.toJSON()))
            .then(orders => orders.map(order => order.amount))
            .then(orders =>
              orders.filter(order => order.collection === item.collectionId && order.network === params.network)
            )
            .then(orders => {
              models.sale
                .findAll()
                .then(sales => sales.map(sale => sale.toJSON()))

                .then(sales =>
                  sales.filter(sale => sale.collectionId === item.collectionId && sale.network === params.network)
                )
                .then(sales => sales.map(sale => sale.price))
                .then(sales => {
                  const allFigures = [...orders].concat([...sales]).sort((a, b) => a - b);
                  resolve({
                    ...item,
                    floorPrice: allFigures[0]
                  });
                })
                .catch(reject);
            })
            .catch(reject);
        });
      })
    );

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
      .sort((a, b) => b.nfts.length - a.nfts.length);

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

    result = await Promise.all(
      result.map(item => {
        return new Promise((resolve, reject) => {
          models.order
            .findAll()
            .then(orders => orders.map(order => order.toJSON()))

            .then(orders =>
              orders.filter(order => order.collection === item.collectionId && order.network === params.network)
            )
            .then(orders => orders.map(order => order.amount))
            .then(orders => {
              models.sale
                .findAll()
                .then(sales => sales.map(sale => sale.toJSON()))

                .then(sales =>
                  sales.filter(sale => sale.collectionId === item.collectionId && sale.network === params.network)
                )
                .then(sales => sales.map(sale => sale.price))
                .then(sales => {
                  const allFigures = [...orders].concat([...sales]).sort((a, b) => a - b);
                  resolve({
                    ...item,
                    floorPrice: allFigures[0]
                  });
                })
                .catch(reject);
            })
            .catch(reject);
        });
      })
    );

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
