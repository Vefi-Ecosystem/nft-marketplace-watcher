import type { Request as ExpressRequestType, Response as ExpressResponseType } from 'express';
import { map, pick, any as anyMatch } from 'ramda';
import { models } from '../db';
import { _resolveWithCodeAndResponse, _throwErrorWithResponseCode } from './common';
import { vapidPublicKey } from '../env';

export async function subscribeForPush(req: ExpressRequestType & { account: any }, res: ExpressResponseType) {
  try {
    const { body, account } = pick(['body', 'account'], req);
    const allPushSub = await models.push.findAllPushSubscriptions();
    const allPushSubJSON = map(push => push.toJSON(), allPushSub);
    const exists = anyMatch(push => push.accountId === account.accountId, allPushSubJSON);
    let result: any;

    if (exists) {
      result = await models.push.updatePushSubscription(
        {
          endpoint: body.endpoint,
          keys: body.keys
        },
        { where: { accountId: account.accountId } }
      );
    } else {
      result = await models.push.addPushSubscription({ ...body, accountId: account.accountId });
      result = result.toJSON();
    }
    return _resolveWithCodeAndResponse(res, 200, { result });
  } catch (error: any) {
    return _resolveWithCodeAndResponse(res, 500, { error: error.message });
  }
}

export async function cancelPushSubscription(req: ExpressRequestType & { account: any }, res: ExpressResponseType) {
  try {
    await models.push.deletePushSubscription({ where: { accountId: req.account.accountId } });
    return _resolveWithCodeAndResponse(res, 200, { result: 'DONE' });
  } catch (error: any) {
    return _resolveWithCodeAndResponse(res, 500, { error: error.message });
  }
}

export async function getPublicKey(req: ExpressRequestType, res: ExpressResponseType) {
  try {
    return _resolveWithCodeAndResponse(res, 200, { result: vapidPublicKey });
  } catch (error: any) {
    return _resolveWithCodeAndResponse(res, 500, { error: error.message });
  }
}
