import { Router } from 'express';
import {
  findCollectionsByOwner,
  findCollectionByIdAndNetwork,
  getAllCollectionsByNetwork,
  findTopSellingCollections,
  findCollectionsByNumberOfItems
} from '../collection';
import auth from '../auth';

const router = Router();

router.get('/:network/byOwner', <any>auth, <any>findCollectionsByOwner);
router.get('/:network/:collectionId/byNetwork', findCollectionByIdAndNetwork);
router.get('/:network/all', getAllCollectionsByNetwork);
router.get('/:network/topSelling', findTopSellingCollections);
router.get('/:network/assets', findCollectionsByNumberOfItems);

export default router;
