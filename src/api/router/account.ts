import { Router } from 'express';
import { createAccount, getAccountFromRequest } from '../account';
import auth from '../auth';

const router = Router();

router.post('/', createAccount);
router.get('/', <any>auth, <any>getAccountFromRequest);

export default router;
