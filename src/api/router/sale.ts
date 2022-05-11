import { Router } from 'express';
import { getAllOngoingSales, getAllOngoingSalesByCollection } from '../sale';

const router = Router();

router.get('/:network/allOngoing', getAllOngoingSales);
router.get('/:network/:collectionId/ongoing/byCollection', getAllOngoingSalesByCollection);

export default router;
