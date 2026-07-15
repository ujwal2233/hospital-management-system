import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';
import { NotificationJob } from './notifications.types';

export const NOTIFICATIONS_QUEUE = 'notifications';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectQueue(NOTIFICATIONS_QUEUE) private readonly queue: Queue<NotificationJob>,
  ) {}

  async enqueue(job: NotificationJob): Promise<void> {
    await this.queue.add(job.channel, job, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 50 },
    });
    this.logger.debug(`Enqueued ${job.channel} notification to ${job.to}`);
  }
}
