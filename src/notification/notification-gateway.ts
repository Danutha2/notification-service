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

/**
 * NotificationGateway
 * -----------------------------------
 * Handles real-time notifications for users via WebSocket.
 *
 * Responsibilities:
 * - Manage WebSocket connections and disconnections
 * - Map user emails to their active WebSocket connections
 * - Receive registration requests from clients to register their email
 * - Send notifications to specific users based on their email
 *
 * WebSocket Configuration:
 * - Port: 3005
 * - Namespace: 'notification'
 */
@WebSocketGateway(3005, { namespace: 'notification' })
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(NotificationGateway.name);

  @WebSocketServer()
  server: Server;

  /** Maps user emails to connected WebSocket clients */
  private emailSocketMap: Map<string, Socket> = new Map();

  /**
   * Handles new WebSocket client connections
   *
   * @param client The connected socket client
   */
  handleConnection(client: Socket) {
    this.logger.log(`[Connection] Client connected | clientId=${client.id}`);
  }

  /**
   * Handles client disconnections
   *
   * @param client The disconnected socket client
   */
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

  /**
   * Registers a client's email for receiving notifications
   *
   * @param data Object containing the email to register
   * @param client The connected socket client
   */
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

  /**
   * Sends a real-time notification to a specific user
   *
   * @param email User's registered email to send notification
   * @param message Notification message
   * @param fileName Optional file name associated with the notification
   */
  sendNotificationToUser(email: string, message: string, fileName?: string) {
    const client = this.emailSocketMap.get(email);
    this.logger.debug(`Client is ${client}`);

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

/**
 * Notification
 * -----------------------------------
 * Defines the structure of a notification message sent via WebSocket
 */
interface Notification {
  id: string;
  message: string;
  timestamp: number;
  fileName?: string | null;
}
