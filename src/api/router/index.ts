import { Router } from 'express';
import accountRouter from './account';

const router = Router();

router.use('/account', accountRouter);

export default router;
