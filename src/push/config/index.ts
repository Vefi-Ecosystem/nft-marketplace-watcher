import webpush from 'web-push';
import { vapidPrivateKey, vapidPublicKey } from '../../env';

webpush.setVapidDetails('mailto:info@vefinetwork.org', <string>vapidPublicKey, <string>vapidPrivateKey);

export default webpush;
