import { Module } from '@nestjs/common';
import { NotificationGateway } from './notification-gateway';
import { NotificationController } from './notification.controller';
import { BullModule } from '@nestjs/bullmq';

@Module({

  providers: [NotificationGateway],
  controllers: [NotificationController]
})
export class NotificationModule {
    

}
