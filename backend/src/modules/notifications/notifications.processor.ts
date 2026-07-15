import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job } from 'bullmq';
import * as nodemailer from 'nodemailer';
import { NOTIFICATIONS_QUEUE } from './notifications.service';
import { NotificationJob } from './notifications.types';

@Processor(NOTIFICATIONS_QUEUE)
export class NotificationsProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationsProcessor.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly config: ConfigService) {
    super();
    this.transporter = nodemailer.createTransport({
      host: config.get<string>('smtp.host'),
      port: config.get<number>('smtp.port'),
      auth: config.get<string>('smtp.user')
        ? { user: config.get('smtp.user'), pass: config.get('smtp.pass') }
        : undefined,
    });
  }

  async process(job: Job<NotificationJob>): Promise<void> {
    const { channel, to, subject, body, tenantId } = job.data;
    this.logger.log(`Processing ${channel} notification [tenant:${tenantId}] → ${to}`);

    if (channel === 'EMAIL') {
      await this.transporter.sendMail({
        from: this.config.get<string>('smtp.from'),
        to,
        subject: subject ?? 'HMS Notification',
        text: body,
      });
      this.logger.log(`Email sent to ${to}`);
    } else if (channel === 'SMS') {
      // Pluggable: replace with Twilio/AWS SNS provider
      this.logger.log(`[SMS STUB] Would send SMS to ${to}: ${body}`);
    }
  }
}
