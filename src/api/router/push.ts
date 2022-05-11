import { Router } from 'express';
import { subscribeForPush, cancelPushSubscription } from '../push';
import auth from '../auth';

const router = Router();

router.post('/subscribe', <any>auth, <any>subscribeForPush);
router.delete('/cancel', <any>auth, <any>cancelPushSubscription);

export default router;
