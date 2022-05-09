import { Router } from 'express';
import {
  countAllOrdersByCollection,
  countAllOrdersByNetwork,
  getAllOrdersByCollection,
  getAllOrdersByNFT
} from '../order';

const router = Router();

router.get('/:network/:tokenId/byNFT', getAllOrdersByNFT);
router.get('/:network/:collection/byCollection', getAllOrdersByCollection);
router.get('/:network/countAll', countAllOrdersByNetwork);
router.get('/:network/:collection/countAllbyCollection', countAllOrdersByCollection);

export default router;
