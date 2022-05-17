import type { Request as ExpressRequestType, Response as ExpressResponseType } from 'express';
import { map, find, pick, any as anyMatch } from 'ramda';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import { models } from '../db';
import { _resolveWithCodeAndResponse } from './common';
import { jwtSecret } from '../env';

export async function createAccount(req: ExpressRequestType, res: ExpressResponseType) {
  try {
    let result: any;
    const allAccounts = map(account => account.toJSON(), await models.account.findAll());
    const { body } = pick(['body'], req);
    const exists = anyMatch(account => account.accountId === body.accountId, allAccounts);

    if (exists) {
      result = find(account => account.accountId === body.accountId, allAccounts);
      const token = jwt.sign(result, <string>jwtSecret, { noTimestamp: true });
      return _resolveWithCodeAndResponse(res, 200, { ...result, token });
    }

    result = (await models.account.addAccount(body)).toJSON();
    const token = jwt.sign(result, <string>jwtSecret, { noTimestamp: true });
    return _resolveWithCodeAndResponse(res, 201, { ...result, token });
  } catch (error: any) {
    return _resolveWithCodeAndResponse(res, 500, { error: error.message });
  }
}

export async function signAuthToken(req: ExpressRequestType, res: ExpressResponseType) {
  try {
    let result: any;
    const allAccounts = map(account => account.toJSON(), await models.account.findAll());
    const { body } = pick(['body'], req);

    const exists = anyMatch(account => account.accountId === body.accountId, allAccounts);

    if (!exists) {
      result = { accountId: body.accountId, name: null, email: null };

      const token = jwt.sign(result, <string>jwtSecret, { noTimestamp: true });
      return _resolveWithCodeAndResponse(res, 200, { ...result, token });
    }

    result = find(account => account.accountId === body.accountId, allAccounts);

    const token = jwt.sign(result, <string>jwtSecret, { noTimestamp: true });
    return _resolveWithCodeAndResponse(res, 200, { ...result, token });
  } catch (error: any) {
    return _resolveWithCodeAndResponse(res, 500, { error: error.message });
  }
}

export async function getAccountFromRequest(req: ExpressRequestType & { account: any }, res: ExpressResponseType) {
  try {
    const allAccounts = map(account => account.toJSON(), await models.account.findAll());
    const { account } = pick(['account'], req);
    const exists = anyMatch(acc => acc.accountId === account.accountId, allAccounts);
    let result: any;

    if (!exists) {
      result = { accountId: account.accountId, name: null, email: null };
    } else {
      result = find(acc => acc.accountId === account.accountId, allAccounts);
    }

    if (!!result.metadataURI) {
      const metadata = await axios.get(result.metadataURI, { headers: { Accepts: 'application/json' } });

      result = { ...result, metadata: { ...metadata.data } };
    }

    return _resolveWithCodeAndResponse(res, 200, { result });
  } catch (error: any) {
    return _resolveWithCodeAndResponse(res, error.errorCode || 500, { error: error.message });
  }
}
