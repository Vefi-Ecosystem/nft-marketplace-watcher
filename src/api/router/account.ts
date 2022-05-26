import { Router } from 'express';
import { createAccount, getAccountById, getAccountFromRequest, signAuthToken } from '../account';
import auth from '../auth';

const router = Router();

router.post('/', createAccount);
router.post('/auth', signAuthToken);
router.get('/', <any>auth, <any>getAccountFromRequest);
router.get('/:accountId', getAccountById);

export default router;
