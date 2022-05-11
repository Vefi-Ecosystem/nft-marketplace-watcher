import { Router } from 'express';
import { findCollectionsByOwner, findCollectionByIdAndNetwork, getAllCollectionsByNetwork } from '../collection';
import auth from '../auth';

const router = Router();

router.get('/:network/byOwner', <any>auth, <any>findCollectionsByOwner);
router.get('/:network/:collectionId/byNetwork', findCollectionByIdAndNetwork);
router.get('/:network/all', getAllCollectionsByNetwork);

export default router;
