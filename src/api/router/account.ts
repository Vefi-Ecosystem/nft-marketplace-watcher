import { keccak256 } from '@ethersproject/solidity';
import { id as hash } from '@ethersproject/hash';
import { Router } from 'express';
import {
  createAccount,
  getAccountById,
  getAccountFromRequest,
  setVerificationStatus,
  signAuthToken,
  updateAccount
} from '../account';
import auth from '../auth';

const router = Router();

router.post('/', createAccount);
router.post('/auth', signAuthToken);
router.get('/', <any>auth, <any>getAccountFromRequest);
router.get('/:accountId', getAccountById);
router.patch('/', <any>auth, <any>updateAccount);
router.patch(
  '/updateVerification',
  (req: any, res, next) => {
    const { body } = req;
    const messageHash = keccak256(['bytes32'], [hash('verifyArtist')]);
    req.signature = body.signature;
    req.messageHash = messageHash;
    next();
  },
  <any>setVerificationStatus
);

export default router;
