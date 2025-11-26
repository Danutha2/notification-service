import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';

@WebSocketGateway(3005, { namespace: 'notification' })
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(NotificationGateway.name);

  @WebSocketServer()
  server: Server;

  private emailSocketMap: Map<string, Socket> = new Map();

  handleConnection(client: Socket) {
    this.logger.log(`[Connection] Client connected | clientId=${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`[Disconnection] Client disconnected | clientId=${client.id}`);

    let removed = false;
    for (const [email, socket] of this.emailSocketMap.entries()) {
      if (socket.id === client.id) {
        this.emailSocketMap.delete(email);
        this.logger.log(`[Disconnection] Removed mapping | clientId=${client.id}, email=${email}`);
        removed = true;
        break;
      }
    }

    if (!removed) {
      this.logger.warn(`[Disconnection] Client was not registered | clientId=${client.id}`);
    }
  }

  @SubscribeMessage('register-email')
  registerEmail(@MessageBody() data: { email: string }, @ConnectedSocket() client: Socket) {
    const { email } = data;

    if (!email) {
      this.logger.warn(`[RegisterEmail] Attempted registration without email | clientId=${client.id}`);
      return;
    }

    this.emailSocketMap.set(email, client);
    this.logger.log(`[RegisterEmail] Client registered | clientId=${client.id}, email=${email}`);
  }

  sendNotificationToUser(email: string, message: string, fileName?: string) {
    const client = this.emailSocketMap.get(email);
    this.logger.debug(`Client is ${client}`)

    if (!client) {
      this.logger.warn(`[Notification] No active socket for email | email=${email}, message="${message}"`);
      return;
    }

    const notification: Notification = {
      id: new Date().getTime().toString(),
      message,
      timestamp: Date.now(),
      fileName: fileName ?? null, 
    };

    client.emit('notification', notification);

    this.logger.log(
      `[Notification] Sent notification | email=${email}, message="${message}", fileName="${fileName ?? 'N/A'}", notificationId=${notification.id}`,
    );
  }
}

interface Notification {
  id: string;
  message: string;
  timestamp: number;
  fileName?: string | null; 
}
