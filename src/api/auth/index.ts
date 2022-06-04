import { pick } from 'ramda';
import type {
  Request as ExpressRequestType,
  Response as ExpressResponseType,
  NextFunction as ExpressNextType
} from 'express';
import { _resolveWithCodeAndResponse, _throwErrorWithResponseCode } from '../common';
import jwt, { JsonWebTokenError, TokenExpiredError, NotBeforeError } from 'jsonwebtoken';
import { jwtSecret } from '../../env';

export default function (
  req: ExpressRequestType & { account: any },
  res: ExpressResponseType,
  next: ExpressNextType
): any {
  try {
    const {
      headers: { authorization }
    } = pick(['headers'], req);

    if (!authorization) _throwErrorWithResponseCode('Authorization header not present in request', 401);
    if (!authorization?.startsWith('Bearer'))
      _throwErrorWithResponseCode("Authorization header must begin with 'Bearer'.", 401);

    const token = authorization?.substring(7, authorization.length);

    if (!token) _throwErrorWithResponseCode('You must be a registered user to use this feature', 401);

    let authItem: any;

    try {
      authItem = jwt.verify(<string>token, <string>jwtSecret);
    } catch (error: any) {
      if (error instanceof JsonWebTokenError || error instanceof TokenExpiredError || error instanceof NotBeforeError) {
        _throwErrorWithResponseCode(error.message, 401);
      }
      _throwErrorWithResponseCode('Error occured', 401);
    }

    req.account = authItem;
    next();
  } catch (error: any) {
    return _resolveWithCodeAndResponse(res, error.errorCode || 500, { error: error.message });
  }
}
