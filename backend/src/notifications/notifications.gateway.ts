import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';

@WebSocketGateway({
  cors: { origin: '*', credentials: true },
  namespace: '/ws/notifications',
  transports: ['websocket', 'polling'],
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);
  private readonly userSockets = new Map<string, Set<string>>();

  constructor(private configService: ConfigService) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '') ||
        (client.handshake.query?.token as string);

      if (!token) {
        this.logger.warn(`WS client ${client.id} rejected: no token`);
        client.disconnect(true);
        return;
      }

      const secret = this.configService.get<string>('JWT_SECRET', 'changeme');
      const payload = jwt.verify(token, secret) as { sub: string; role?: string };
      const userId = payload.sub;

      (client as any).userId = userId;

      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId)!.add(client.id);

      client.join(`user:${userId}`);
      this.logger.log(`WS connected: user=${userId} socket=${client.id}`);

      client.emit('connected', { userId, socketId: client.id });
    } catch (err) {
      this.logger.warn(`WS client ${client.id} rejected: invalid token`);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    const userId = (client as any).userId;
    if (userId) {
      const sockets = this.userSockets.get(userId);
      if (sockets) {
        sockets.delete(client.id);
        if (sockets.size === 0) this.userSockets.delete(userId);
      }
      this.logger.log(`WS disconnected: user=${userId} socket=${client.id}`);
    }
  }

  @SubscribeMessage('ping')
  handlePing(client: Socket) {
    client.emit('pong', { ts: Date.now() });
  }

  /** Emit a new notification to a specific user (called from NotificationsService) */
  emitToUser(userId: string, event: string, payload: any) {
    this.server.to(`user:${userId}`).emit(event, payload);
  }

  /** Emit to all connected clients (admin broadcasts) */
  emitToAll(event: string, payload: any) {
    this.server.emit(event, payload);
  }

  /** Get count of connected sockets for a user */
  getConnectionCount(userId: string): number {
    return this.userSockets.get(userId)?.size ?? 0;
  }

  /** Get total connected clients */
  getTotalConnections(): number {
    let total = 0;
    for (const sockets of this.userSockets.values()) {
      total += sockets.size;
    }
    return total;
  }
}
