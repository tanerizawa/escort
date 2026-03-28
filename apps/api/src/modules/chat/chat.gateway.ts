import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Logger, UseGuards, Injectable } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '@/config/redis.service';
import { PrismaService } from '@/config/prisma.service';
import { ChatService } from './chat.service';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userName?: string;
}

@WebSocketGateway({
  cors: {
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://areton.id',
      'https://admin.areton.id',
    ],
    credentials: true,
  },
  namespace: '/chat',
})
@Injectable()
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly redis: RedisService,
    private readonly prisma: PrismaService,
    private readonly chatService: ChatService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token =
        client.handshake.auth.token ||
        client.handshake.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        this.logger.warn(`Client ${client.id} disconnected: no token`);
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('jwt.accessSecret'),
      });
      client.userId = payload.sub as string;
      client.userName = (payload.firstName as string) || 'User';

      // Track online status in Redis
      await this.redis.set(`user:online:${client.userId}`, client.id, 3600);
      await this.redis.set(`socket:user:${client.id}`, client.userId, 3600);

      this.logger.log(`User ${client.userId} connected (socket: ${client.id})`);

      // Notify contacts about online status
      client.broadcast.emit('user:online', { userId: client.userId });
    } catch {
      this.logger.warn(`Client ${client.id} disconnected: invalid token`);
      client.disconnect();
    }
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      await this.redis.del(`user:online:${client.userId}`);
      await this.redis.del(`socket:user:${client.id}`);

      this.logger.log(`User ${client.userId} disconnected`);

      // Notify contacts about offline status
      client.broadcast.emit('user:offline', { userId: client.userId });
    }
  }

  @SubscribeMessage('join:room')
  async handleJoinRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { bookingId: string },
  ) {
    if (!client.userId) return;

    // Verify user is a participant in this booking
    const booking = await this.prisma.booking.findUnique({
      where: { id: data.bookingId },
      select: { clientId: true, escortId: true, status: true },
    });

    if (!booking || (booking.clientId !== client.userId && booking.escortId !== client.userId)) {
      this.logger.warn(`User ${client.userId} denied access to room booking:${data.bookingId}`);
      client.emit('error', {
        event: 'join:room',
        message: 'Anda tidak memiliki akses ke ruang chat ini',
      });
      return;
    }

    // Only allow chat for active bookings
    if (!['PENDING', 'CONFIRMED', 'ONGOING'].includes(booking.status)) {
      client.emit('error', {
        event: 'join:room',
        message: 'Chat tidak tersedia untuk booking yang sudah selesai atau dibatalkan',
      });
      return;
    }

    const roomId = `booking:${data.bookingId}`;
    await client.join(roomId);

    this.logger.log(`User ${client.userId} joined room ${roomId}`);

    // Notify other users in room
    client.to(roomId).emit('user:joined', {
      userId: client.userId,
      userName: client.userName,
    });

    return { event: 'joined', roomId };
  }

  @SubscribeMessage('leave:room')
  async handleLeaveRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { bookingId: string },
  ) {
    const roomId = `booking:${data.bookingId}`;
    await client.leave(roomId);

    client.to(roomId).emit('user:left', {
      userId: client.userId,
    });
  }

  @SubscribeMessage('send:message')
  async handleSendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { bookingId: string; content: string; type?: string },
  ) {
    if (!client.userId) return;

    try {
      // Save message via service (DB)
      const message = await this.chatService.sendMessage(client.userId, {
        bookingId: data.bookingId,
        content: data.content,
        type: (data.type as any) || 'TEXT',
      });

      const roomId = `booking:${data.bookingId}`;

      // Broadcast to room (including sender for confirmation)
      this.server.to(roomId).emit('new:message', {
        ...message,
        bookingId: data.bookingId,
      });

      return { event: 'message:sent', messageId: message.id };
    } catch (error: any) {
      client.emit('error', {
        event: 'send:message',
        message: error.message || 'Gagal mengirim pesan',
      });
    }
  }

  @SubscribeMessage('typing:start')
  async handleTypingStart(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { bookingId: string },
  ) {
    const roomId = `booking:${data.bookingId}`;
    client.to(roomId).emit('typing:indicator', {
      userId: client.userId,
      userName: client.userName,
      isTyping: true,
    });
  }

  @SubscribeMessage('typing:stop')
  async handleTypingStop(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { bookingId: string },
  ) {
    const roomId = `booking:${data.bookingId}`;
    client.to(roomId).emit('typing:indicator', {
      userId: client.userId,
      userName: client.userName,
      isTyping: false,
    });
  }

  @SubscribeMessage('mark:read')
  async handleMarkRead(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { bookingId: string },
  ) {
    if (!client.userId) return;

    const result = await this.chatService.markAsRead(client.userId, data.bookingId);
    const roomId = `booking:${data.bookingId}`;

    // Notify sender that messages were read
    client.to(roomId).emit('messages:read', {
      bookingId: data.bookingId,
      readBy: client.userId,
      count: result.markedAsRead,
    });

    return result;
  }

  // ---- Utility methods callable from other services ----

  async emitToUser(userId: string, event: string, data: any) {
    const socketId = await this.redis.get(`user:online:${userId}`);
    if (socketId) {
      this.server.to(socketId).emit(event, data);
    }
  }

  async emitToRoom(bookingId: string, event: string, data: any) {
    this.server.to(`booking:${bookingId}`).emit(event, data);
  }

  async isUserOnline(userId: string): Promise<boolean> {
    return this.redis.exists(`user:online:${userId}`);
  }
}
