import type { Request as ExpressRequestType, Response as ExpressResponseType } from 'express';
import { filter, map, multiply } from 'ramda';
import logger from '../logger';
import { models } from '../db';

export async function getAllNFTsByNetwork(req: ExpressRequestType, res: ExpressResponseType) {
  try {
    const allNFTs = await models.nft.findAll();
    let result = filter(
      (nft: any) => nft.network === req.params.network,
      map(nft => <any>nft.toJSON(), allNFTs)
    );

    if (!!req.query.page) {
      const page = parseInt(<string>req.query.page);

      if (!(page > 0)) throw new Error('Page index must begin at 1');

      result = result.slice(multiply(page - 1, 10), multiply(page, 10));
    } else {
      result = result.slice(0, 10);
    }

    return res.status(200).json({ result });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
