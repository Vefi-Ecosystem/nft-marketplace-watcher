import webpush from './config';
import { find, map, any as anyMatch } from 'ramda';
import { models } from '../db';
import logger from '../logger';

export async function sendNotification(accountId: string, message: { title: string; data: string }) {
  try {
    const allSubs = await models.push.findAllPushSubscriptions();
    const allSubsJSON = map(sub => sub.toJSON(), allSubs);
    const subExists = anyMatch(sub => sub.accountId === accountId, allSubsJSON);

    if (!subExists) return;

    const { endpoint, keys } = find(sub => sub.accountId === accountId, allSubsJSON);

    logger("Now pushing to endpoint [%s], using keys: %s ", endpoint, JSON.stringify(keys, undefined, 2));

    return Promise.resolve(webpush.sendNotification({ endpoint, keys }, JSON.stringify(message)));
  } catch (error: any) {
    throw error;
  }
}
