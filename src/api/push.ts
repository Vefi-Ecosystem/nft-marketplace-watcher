import type { Request as ExpressRequestType, Response as ExpressResponseType } from 'express';
import { map, pick, any as anyMatch } from 'ramda';
import { models } from '../db';
import { _resolveWithCodeAndResponse, _throwErrorWithResponseCode } from './common';

export async function subscribeForPush(req: ExpressRequestType, res: ExpressResponseType) {
  try {
    const { body } = pick(['body'], req);
    const allPushSub = await models.push.findAllPushSubscriptions();
    const allPushSubJSON = map(push => push.toJSON(), allPushSub);
    const exists = anyMatch(push => push.accountId === body.accountId, allPushSubJSON);
    let result: any;

    if (exists) {
      result = await models.push.updatePushSubscription(
        {
          endpoint: body.endpoint,
          keys: body.keys
        },
        { where: { accountId: body.accountId } }
      );
    } else {
      result = await models.push.addPushSubscription(body);
      result = result.toJSON();
    }
    return _resolveWithCodeAndResponse(res, 200, { result });
  } catch (error: any) {
    return _resolveWithCodeAndResponse(res, 500, { error: error.message });
  }
}

export async function cancelPushSubscription() {}
