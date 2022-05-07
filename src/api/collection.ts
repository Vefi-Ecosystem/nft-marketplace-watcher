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

    if (!!result) _throwErrorWithResponseCode('Asset not found', 404);

    const { data: metadata } = await axios.get((result as any).collectionURI, {
      headers: { Accepts: 'application/json' }
    });
    result = { ...(result as any), metadata };

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

    result = filter(collection => collection.collectionOwner === params.owner, result).map(collection => {
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
