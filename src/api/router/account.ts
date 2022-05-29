import { Router } from 'express';
import { createAccount, getAccountById, getAccountFromRequest, signAuthToken, updateAccount } from '../account';
import auth from '../auth';

const router = Router();

router.post('/', createAccount);
router.post('/auth', signAuthToken);
router.get('/', <any>auth, <any>getAccountFromRequest);
router.get('/:accountId', getAccountById);
router.patch('/', <any>auth, <any>updateAccount);

export default router;
