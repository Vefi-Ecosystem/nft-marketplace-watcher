import { Server as SocketServer } from 'socket.io';
import type { Server as HttpServer } from 'https';

export default class BridgeSocket {
  public socketServer: SocketServer;

  constructor(httpServer: HttpServer) {
    this.socketServer = new SocketServer(httpServer, {
      cors: {
        origin: '*'
      }
    });
  }
}
