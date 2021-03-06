import type { Request as ExpressRequestType, Response as ExpressResponseType } from 'express';
import { verifyMessage } from '@ethersproject/wallet';
import { arrayify } from '@ethersproject/bytes';
import { map, find, pick, any as anyMatch } from 'ramda';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import { models } from '../db';
import { _resolveWithCodeAndResponse, _throwErrorWithResponseCode } from './common';
import { jwtSecret, verifierAddress } from '../env';
import https from 'https';

const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

export async function createAccount(req: ExpressRequestType, res: ExpressResponseType) {
  try {
    let result: any;
    const allAccounts = map(account => account.toJSON(), await models.account.findAll());
    const { body } = pick(['body'], req);
    const messageHashBytes = arrayify(body.messageHash);
    const accountId = verifyMessage(messageHashBytes, body.signature);
    const exists = anyMatch(account => account.accountId === accountId, allAccounts);

    if (exists) {
      result = find(account => account.accountId === accountId, allAccounts);
      const token = jwt.sign(result, <string>jwtSecret, { noTimestamp: true });
      result = { ...result, token };
      return _resolveWithCodeAndResponse(res, 200, { result });
    }

    result = (
      await models.account.addAccount({
        email: body.email,
        name: body.name,
        metadataURI: body.metadataURI,
        accountId
      })
    ).toJSON();
    const token = jwt.sign(result, <string>jwtSecret, { noTimestamp: true });
    result = { ...result, token };
    return _resolveWithCodeAndResponse(res, 201, { result });
  } catch (error: any) {
    return _resolveWithCodeAndResponse(res, 500, { error: error.message });
  }
}

export async function signAuthToken(req: ExpressRequestType, res: ExpressResponseType) {
  try {
    let result: any;
    const allAccounts = map(account => account.toJSON(), await models.account.findAll());
    const { body } = pick(['body'], req);
    const messageHashBytes = arrayify(body.messageHash);
    const accountId = verifyMessage(messageHashBytes, body.signature);

    const exists = anyMatch(account => account.accountId === accountId, allAccounts);

    if (!exists) {
      result = { accountId, name: null, email: null };

      const token = jwt.sign(result, <string>jwtSecret, { noTimestamp: true });
      result = { ...result, token };
      return _resolveWithCodeAndResponse(res, 200, { result });
    }

    result = find(account => account.accountId === accountId, allAccounts);

    const token = jwt.sign(result, <string>jwtSecret, { noTimestamp: true });
    result = { ...result, token };
    return _resolveWithCodeAndResponse(res, 200, { result });
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
      const metadata = await axios.get(result.metadataURI, { httpsAgent });

      result = { ...result, metadata: { ...metadata.data } };
    }

    return _resolveWithCodeAndResponse(res, 200, { result });
  } catch (error: any) {
    return _resolveWithCodeAndResponse(res, 500, { error: error.message });
  }
}

export async function getAccountById(req: ExpressRequestType, res: ExpressResponseType) {
  try {
    const allAccounts = map(account => account.toJSON(), await models.account.findAll());
    const exists = anyMatch(acc => acc.accountId === req.params.accountId, allAccounts);
    let result: any;

    if (!exists) {
      result = { accountId: req.params.accountId, name: null, email: null };
    } else {
      result = find(acc => acc.accountId === req.params.accountId, allAccounts);
    }
    if (!!result.metadataURI) {
      const metadata = await axios.get(result.metadataURI, { httpsAgent });

      result = { ...result, metadata: { ...metadata.data } };
    }

    return _resolveWithCodeAndResponse(res, 200, { result });
  } catch (error: any) {
    return _resolveWithCodeAndResponse(res, 500, { error: error.message });
  }
}

export async function updateAccount(req: ExpressRequestType & { account: any }, res: ExpressResponseType) {
  try {
    const { body, account } = pick(['params', 'body', 'account'], req);
    const result = await models.account.updateAccount(body, { where: { accountId: account.accountId } });
    return _resolveWithCodeAndResponse(res, 200, { result });
  } catch (error: any) {
    return _resolveWithCodeAndResponse(res, 500, { error: error.message });
  }
}

export async function setVerificationStatus(
  req: ExpressRequestType & { signature: string; messageHash: string },
  res: ExpressResponseType
) {
  try {
    const { signature, messageHash, body } = pick(['signature', 'messageHash', 'body'], req);
    const messageHashBytes = arrayify(messageHash);
    const address = verifyMessage(messageHashBytes, signature);

    if (address.toLowerCase() !== verifierAddress?.toLowerCase()) {
      _throwErrorWithResponseCode('NotAuthorizedToVerify', 400);
    }

    const result = await models.account.updateAccount(
      {
        isVerified: body.isVerified
      },
      {
        where: {
          accountId: body.accountId
        }
      }
    );

    return _resolveWithCodeAndResponse(res, 200, { result });
  } catch (error: any) {
    return _resolveWithCodeAndResponse(res, error.errorCode || 500, { error: error.message });
  }
}
