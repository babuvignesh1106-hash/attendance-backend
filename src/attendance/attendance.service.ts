import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Attendance } from './entities/attendance.entity';

@Injectable()
export class AttendanceService {
  private readonly logger = new Logger(AttendanceService.name);

  constructor(
    @InjectRepository(Attendance)
    private readonly repo: Repository<Attendance>,
  ) {}

  /** Find the latest active attendance session for a user */
  private async findActiveSession(
    username: string,
  ): Promise<Attendance | null> {
    return this.repo.findOne({
      where: { username, endTime: IsNull() },
      order: { startTime: 'DESC' },
    });
  }

  /** Check-in (allows multiple per day) */
  async checkIn(username: string): Promise<Attendance> {
    if (!username) throw new BadRequestException('Username is required');

    // Simply create new session (no restriction)
    const record = this.repo.create({
      username,
      startTime: new Date(),
      endTime: null,
      workedDuration: 0,
      breakCount: 0,
      totalBreakDuration: 0,
      currentBreakStart: null,
    });

    return this.repo.save(record);
  }

  /** Start a break for the active session */
  async startBreak(username: string): Promise<Attendance> {
    const record = await this.findActiveSession(username);
    if (!record) throw new BadRequestException('No active check-in session');

    if (record.currentBreakStart)
      throw new BadRequestException('Break already started');

    record.currentBreakStart = new Date();
    record.breakCount += 1;

    return this.repo.save(record);
  }

  /** End break */
  async endBreak(username: string): Promise<Attendance> {
    const record = await this.findActiveSession(username);
    if (!record) throw new BadRequestException('No active check-in session');

    if (!record.currentBreakStart)
      throw new BadRequestException('No active break to end');

    const now = new Date();
    const breakSeconds = Math.round(
      (now.getTime() - record.currentBreakStart.getTime()) / 1000,
    );

    record.totalBreakDuration += breakSeconds;
    record.currentBreakStart = null;

    return this.repo.save(record);
  }

  /** Check-out the latest active session */
  async checkOut(username: string): Promise<Attendance> {
    const record = await this.findActiveSession(username);
    if (!record) throw new BadRequestException('No active check-in session');

    const now = new Date();

    // Auto-close break if active
    if (record.currentBreakStart) {
      const breakSeconds = Math.round(
        (now.getTime() - record.currentBreakStart.getTime()) / 1000,
      );
      record.totalBreakDuration += breakSeconds;
      record.currentBreakStart = null;
    }

    const rawWorkedSeconds = Math.round(
      (now.getTime() - record.startTime.getTime()) / 1000,
    );

    record.endTime = now;
    record.workedDuration = rawWorkedSeconds - record.totalBreakDuration;

    return this.repo.save(record);
  }

  /** Get all attendance records */
  async getAll(): Promise<Attendance[]> {
    return this.repo.find({ order: { startTime: 'DESC' } });
  }

  /** Auto-checkout all unclosed sessions from previous days */
  async autoCheckoutUnclosed(): Promise<{ closed: number }> {
    this.logger.log('Running auto-checkout cron');

    const openRecords = await this.repo.find({
      where: { endTime: IsNull() },
    });

    const ops: Promise<Attendance>[] = [];

    for (const r of openRecords) {
      const start = new Date(r.startTime);
      const startDay = new Date(start);
      startDay.setHours(0, 0, 0, 0);

      const now = new Date();
      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);

      if (startDay.getTime() < todayStart.getTime()) {
        const end = new Date(start);
        end.setHours(23, 59, 59, 999);

        if (r.currentBreakStart) {
          const breakSeconds = Math.round(
            (end.getTime() - r.currentBreakStart.getTime()) / 1000,
          );
          r.totalBreakDuration += breakSeconds;
          r.currentBreakStart = null;
        }

        const rawWorkedSeconds = Math.round(
          (end.getTime() - r.startTime.getTime()) / 1000,
        );

        r.endTime = end;
        r.workedDuration = rawWorkedSeconds - r.totalBreakDuration;

        ops.push(this.repo.save(r));
      }
    }

    await Promise.all(ops);
    this.logger.log(`Auto-checked-out ${ops.length} records`);

    return { closed: ops.length };
  }
}
