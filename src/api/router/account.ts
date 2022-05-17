import { Router } from 'express';
import { createAccount, getAccountFromRequest, signAuthToken } from '../account';
import auth from '../auth';

const router = Router();

router.post('/', createAccount);
router.post('/auth', signAuthToken);
router.get('/', <any>auth, <any>getAccountFromRequest);

export default router;
