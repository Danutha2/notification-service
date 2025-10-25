import { Body, Controller, Post } from '@nestjs/common';
import { NotificationGateway } from './notification-gateway';

@Controller('notification')
export class NotificationController {
  constructor(private readonly gateway: NotificationGateway) {}

  @Post('send')
  sendNotification(@Body() data: { email: string; message: string; fileName?: string }) {
    const { email, message, fileName } = data; 
    this.gateway.sendNotificationToUser(email, message, fileName);  }
}
