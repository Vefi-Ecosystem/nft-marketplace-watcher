import { Router } from 'express';
import { subscribeForPush, cancelPushSubscription, getPublicKey } from '../push';
import auth from '../auth';

const router = Router();

router.post('/subscribe', <any>auth, <any>subscribeForPush);
router.delete('/cancel', <any>auth, <any>cancelPushSubscription);
router.get('/getPublicKey', getPublicKey);

export default router;
