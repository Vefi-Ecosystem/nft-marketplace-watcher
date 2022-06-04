import { any as anyMatch, toLower } from 'ramda';
import { arrayify } from '@ethersproject/bytes';
import { verifyMessage } from '@ethersproject/wallet';
import { models } from '../db';
import type { Server as HttpServer } from 'https';
import BridgeSocket from './socket';
import logger from '../logger';

export const initializeBridgeSocket = (server: HttpServer) => {
  const bridgeSocket = new BridgeSocket(server);

  bridgeSocket.socketServer.on('connection', socket => {
    socket.on('bridge', async args => {
      try {
        const { collectionId, tokenId, network, signature, owner, messageHash, bridgeRequestBody } = JSON.parse(args);
        const messageHashBytes = arrayify(messageHash);
        const recoveredAddress = verifyMessage(messageHashBytes, signature);

        // Check if NFT exists
        const allNFTs = await models.nft.findAll();
        const allNFTsJSON = allNFTs.map(model => model.toJSON());
        const nftExists = anyMatch(
          nft =>
            nft.tokenId === parseInt(bridgeRequestBody.native.tokenId) &&
            toLower(nft.collectionId) === toLower(bridgeRequestBody.native.contract) &&
            nft.network === network,
          allNFTsJSON
        );

        if (recoveredAddress === owner && nftExists) {
          // Delete all associated items upon bridging because they possibly have been bridged to a collection that isn't recorded
          await models.nft.deleteNFT({ where: { owner, network, tokenId, collectionId } });
          await models.sale.deleteSaleItem({ where: { network, tokenId, collectionId } });
          await models.order.deleteOrderItem({ where: { network, tokenId, collection: collectionId } });
          bridgeSocket.socketServer.emit('bridged', JSON.stringify({ message: 'NFT bridged' }));
        }
      } catch (error: any) {
        logger(error.message);
      }
    });
    logger('Socket with id %s connected', socket.id);
  });
  logger('Bridge socket initialized');
};
