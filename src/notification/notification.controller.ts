import { Body, Controller, Post } from '@nestjs/common';
import { NotificationGateway } from './notification-gateway';

/**
 * NotificationController
 * -----------------------------------
 * Exposes HTTP endpoints to interact with the Notification system.
 *
 * Responsibilities:
 * - Send notifications to specific users via the NotificationGateway
 *
 * Base Route: /notification
 */
@Controller('notification')
export class NotificationController {
  constructor(private readonly gateway: NotificationGateway) {}

  /**
   * Send a notification to a specific user
   *
   * Endpoint: POST /notification/send
   *
   * @param data Object containing:
   *   - email: User's registered email to receive the notification
   *   - message: Notification message content
   *   - fileName (optional): Associated file name if any
   *
   * This method delegates the notification sending to the NotificationGateway.
   */
  @Post('send')
  sendNotification(@Body() data: { email: string; message: string; fileName?: string }) {
    const { email, message, fileName } = data; 
    this.gateway.sendNotificationToUser(email, message, fileName);
  }
}
