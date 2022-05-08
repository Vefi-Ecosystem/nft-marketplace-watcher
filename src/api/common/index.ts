import { Response as ExpressResponseType } from 'express';

class ResponseError extends Error {
  public errorCode: number;

  constructor(message: string, errorCode: number) {
    super(message);
    this.errorCode = errorCode;
  }
}

export function _throwErrorWithResponseCode(message: string, code: number) {
  throw new ResponseError(message, code);
}

export function _resolveWithCodeAndResponse(resp: ExpressResponseType, code: number, data: any) {
  return resp.status(code).json(data);
}
