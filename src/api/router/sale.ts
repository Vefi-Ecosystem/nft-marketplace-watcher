import { Router } from 'express';
import { countAllSuccessfulTradesByCollection, getAllOngoingSales, getAllOngoingSalesByCollection } from '../sale';

const router = Router();

router.get('/:network/allOngoing', getAllOngoingSales);
router.get('/:network/:collectionId/ongoing/byCollection', getAllOngoingSalesByCollection);
router.get('/:network/:collectionId/traded/count', countAllSuccessfulTradesByCollection);

export default router;
