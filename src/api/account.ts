import type { Request as ExpressRequestType, Response as ExpressResponseType } from 'express';
import { map, find, pick, any as anyMatch } from 'ramda';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import { models } from '../db';
import { _resolveWithCodeAndResponse, _throwErrorWithResponseCode } from './common';
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

export async function getAccountFromRequest(req: ExpressRequestType & { accountId: string }, res: ExpressResponseType) {
  try {
    const allAccounts = map(account => account.toJSON(), await models.account.findAll());
    const { accountId } = pick(['accountId'], req);
    const exists = anyMatch(account => account.accoundId === accountId, allAccounts);

    if (!exists) _throwErrorWithResponseCode('Account not found', 404);

    let result = find(account => account.accountId === accountId, allAccounts);
    const metadata = await axios.get(result.metadataURI, { headers: { Accepts: 'application/json' } });

    result = { ...result, metadata: { ...metadata.data } };
    return _resolveWithCodeAndResponse(res, 200, { result });
  } catch (error: any) {
    return _resolveWithCodeAndResponse(res, error.errorCode || 500, { error: error.message });
  }
}
