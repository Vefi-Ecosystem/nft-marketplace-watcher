import webpush from './config';
import { find, map, any as anyMatch } from 'ramda';
import { models } from '../db';

export async function sendNotification(accountId: string, message: string) {
  try {
    const allSubs = await models.push.findAllPushSubscriptions();
    const allSubsJSON = map(sub => sub.toJSON(), allSubs);
    const subExists = anyMatch(sub => sub.accountId === accountId, allSubsJSON);

    if (!subExists) return;

    const { endpoint, keys } = find(sub => sub.accountId === accountId, allSubsJSON);

    return Promise.resolve(webpush.sendNotification({ endpoint, keys: JSON.parse(keys) }, message));
  } catch (error: any) {
    throw error;
  }
}
