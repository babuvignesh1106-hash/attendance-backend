import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AttendanceService } from './attendance.service';

@Injectable()
export class AttendanceCron {
  constructor(private readonly svc: AttendanceService) {}

  @Cron('1 0 * * *', {
    timeZone: 'Asia/Kolkata',
  })
  async handleMidnight() {
    console.log('Auto checkout running at', new Date().toISOString());
    await this.svc.autoCheckoutUnclosed();
  }
}
