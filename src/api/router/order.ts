import { Router } from 'express';
import auth from '../auth';
import {
  countAllOrdersByCollection,
  countAllOrdersByNetwork,
  getAllOrdersByCollection,
  getAllOrdersByNFT,
  getWatchList
} from '../order';

const router = Router();

router.get('/:network/:collectionId/:tokenId/byNFT', getAllOrdersByNFT);
router.get('/:network/:collection/byCollection', getAllOrdersByCollection);
router.get('/:network/countAll', countAllOrdersByNetwork);
router.get('/:network/:collection/countAllbyCollection', countAllOrdersByCollection);
router.get('/:network/watchlist', <any>auth, <any>getWatchList);

export default router;
