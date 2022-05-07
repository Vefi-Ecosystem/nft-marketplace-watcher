import type { Request as ExpressRequestType, Response as ExpressResponseType } from 'express';
import { filter, map, multiply, find, pick, any as anyMatch } from 'ramda';
import axios from 'axios';
import logger from '../logger';
import { models } from '../db';
import { _resolveWithCodeAndResponse, _throwErrorWithResponseCode } from './common';

export async function createAccount(req: ExpressRequestType, res: ExpressResponseType) {
  try {
    let result: any;
    const allAccounts = map(account => account.toJSON(), await models.account.findAll());
    const { body } = pick(['body'], req);
    const exists = anyMatch(account => account.accountId === body.accountId, allAccounts);

    if (exists) {
      result = find(account => account.accountId === body.accountId, allAccounts);
      return _resolveWithCodeAndResponse(res, 200, { result });
    }

    result = (await models.account.addAccount(body)).toJSON();
    return _resolveWithCodeAndResponse(res, 201, { result });
  } catch (error: any) {
    _resolveWithCodeAndResponse(res, 500, { error: error.message });
  }
}
