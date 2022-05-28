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
  getNFTsInCollectionByPrice,
  getNFTsWithOffersInCollection,
  getPricePerPeriod,
  getTopSellingNFtsInCollection,
  removeNFTFromFavorites,
  view
} from '../nft';
import auth from '../auth';

const router = Router();

router.get('/:network/byNetwork', getAllNFTsByNetwork);
router.get('/:network/:collectionId/:tokenId/byId', findNftByIdAndNetwork);
router.get('/:network/:collectionId/byCollection', findNFTsByCollectionId);
router.get('/:network/:accountId/byOwner', findNFTsByOwnerId);
router.get('/:network/:collectionId/count', countAllNFtsByCollection);
router.get('/:network/:collectionId/:tokenId/prices', getPricePerPeriod);
router.get('/:network/:collectionId/:tokenId/isOnSale', checkItemInSale);
router.post('/:network/:collectionId/:tokenId/addToFavorites', <any>auth, <any>addNFTToFavorites);
router.get('/:network/:accountId/getFavorites', getFavoriteNFTsOfUser);
router.get('/:network/:collectionId/:tokenId/getAllFavorites', getAllFavorites);
router.delete('/:network/:collectionId/:tokenId/removeFromFavorites', <any>auth, <any>removeNFTFromFavorites);
router.post('/:network/:collectionId/:tokenId/view', <any>auth, view);
router.get('/:network/:collectionId/:tokenId/countViews', countViews);
router.get('/:network/:collectionId/topSelling', getTopSellingNFtsInCollection);
router.get('/:network/:collectionId/price', getNFTsInCollectionByPrice);
router.get('/:network/:collectionId/hasOffers', getNFTsWithOffersInCollection);

export default router;
