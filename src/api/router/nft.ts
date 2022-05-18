import { Router } from 'express';
import { findNftByIdAndNetwork, findNFTsByCollectionId, findNFTsByOwnerId, getAllNFTsByNetwork } from '../nft';
import auth from '../auth';

const router = Router();

router.get('/:network/byNetwork', getAllNFTsByNetwork);
router.get('/:network/:collectionId/:tokenId/byId', findNftByIdAndNetwork);
router.get('/:network/:collectionId/byCollection', findNFTsByCollectionId);
router.get('/:network/byOwner', <any>auth, <any>findNFTsByOwnerId);

export default router;
