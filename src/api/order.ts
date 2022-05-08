import type { Request as ExpressRequestType, Response as ExpressResponseType } from 'express';
import { filter, map, multiply, find, pick, count } from 'ramda';
import axios from 'axios';
import logger from '../logger';
import { models } from '../db';
import { _resolveWithCodeAndResponse, _throwErrorWithResponseCode } from './common';

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
