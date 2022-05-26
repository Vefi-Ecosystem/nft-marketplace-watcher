import { Router } from 'express';
import {
  addNFTToFavorites,
  checkItemInSale,
  countAllNFtsByCollection,
  countViews,
  findNftByIdAndNetwork,
  findNFTsByCollectionId,
  findNFTsByOwnerId,
  getAllFavorites,
  getAllNFTsByNetwork,
  getFavoriteNFTsOfUser,
  getPricePerPeriod,
  removeNFTFromFavorites,
  view
} from '../nft';
import auth from '../auth';

const router = Router();

router.get('/:network/byNetwork', getAllNFTsByNetwork);
router.get('/:network/:collectionId/:tokenId/byId', findNftByIdAndNetwork);
router.get('/:network/:collectionId/byCollection', findNFTsByCollectionId);
router.get('/:network/byOwner', <any>auth, <any>findNFTsByOwnerId);
router.get('/:network/:collectionId/count', countAllNFtsByCollection);
router.get('/:network/:collectionId/:tokenId/prices', getPricePerPeriod);
router.get('/:network/:collectionId/:tokenId/isOnSale', checkItemInSale);
router.post('/:network/:collectionId/:tokenId/addToFavorites', <any>auth, <any>addNFTToFavorites);
router.get('/:network/:accountId/getFavorites', getFavoriteNFTsOfUser);
router.get('/:network/:collectionId/:tokenId/getAllFavorites', getAllFavorites);
router.delete('/:network/:collectionId/:tokenId/removeFromFavorites', <any>auth, <any>removeNFTFromFavorites);
router.post('/:network/:collectionId/:tokenId/view', <any>auth, view);
router.get('/:network/:collectionId/:tokenId/countViews', countViews);

export default router;
