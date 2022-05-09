import { Router } from 'express';
import accountRouter from './account';
import collectionRouter from './collection';
import nftRouter from './nft';
import orderRouter from './order';
import pushRouter from './push';
import saleRouter from './sale';

const router = Router();

router.use('/account', accountRouter);
router.use('/collection', collectionRouter);
router.use('/nft', nftRouter);
router.use('/order', orderRouter);
router.use('/push', pushRouter);
router.use('sale', saleRouter);

export default router;
