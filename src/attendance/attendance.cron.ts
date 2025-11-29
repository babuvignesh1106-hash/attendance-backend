import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AttendanceService } from './attendance.service';

@Injectable()
export class AttendanceCron {
  constructor(private readonly svc: AttendanceService) {}

  // Runs at 00:00 every day server time
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  handleMidnight() {
    return this.svc.autoCheckoutUnclosed();
  }
}
