import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, IsNull } from 'typeorm';
import { Attendance } from './entities/attendance.entity';

@Injectable()
export class AttendanceService {
  private readonly logger = new Logger(AttendanceService.name);
  private readonly IST_OFFSET = 5.5 * 60 * 60 * 1000; // +5:30

  constructor(
    @InjectRepository(Attendance)
    private readonly repo: Repository<Attendance>,
  ) {}

  private startOfDay(date = new Date()): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  private endOfDay(date = new Date()): Date {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
  }

  /** Convert UTC → IST for API response */
  private toIST(date: Date): Date {
    return new Date(date.getTime() + this.IST_OFFSET);
  }

  /** Convert Record for API output */
  private convertToIST(att: Attendance): Attendance {
    return {
      ...att,
      startTime: this.toIST(att.startTime),
      endTime: att.endTime ? this.toIST(att.endTime) : null,
      currentBreakStart: att.currentBreakStart
        ? this.toIST(att.currentBreakStart)
        : null,
    };
  }

  /** Find today's raw UTC record (NO IST conversion here!) */
  private async findTodayRaw(username: string): Promise<Attendance | null> {
    const start = this.startOfDay();
    const end = this.endOfDay();
    return this.repo.findOne({
      where: { username, startTime: Between(start, end) },
    });
  }

  /** Check-in */
  async checkIn(username: string): Promise<Attendance> {
    if (!username) throw new BadRequestException('Username is required');

    const existing = await this.findTodayRaw(username);
    if (existing) throw new BadRequestException('Already checked in today');

    const record = await this.repo.save(
      this.repo.create({
        username,
        startTime: new Date(), // UTC
        endTime: null,
        workedDuration: 0,
        breakCount: 0,
        totalBreakDuration: 0,
        currentBreakStart: null,
      }),
    );

    return this.convertToIST(record);
  }

  /** Start break */
  async startBreak(username: string): Promise<Attendance> {
    const record = await this.findTodayRaw(username);
    if (!record) throw new BadRequestException('No check-in found today');
    if (record.currentBreakStart)
      throw new BadRequestException('Break already started');

    record.currentBreakStart = new Date(); // UTC
    record.breakCount += 1;

    return this.convertToIST(await this.repo.save(record));
  }

  /** End break */
  async endBreak(username: string): Promise<Attendance> {
    const record = await this.findTodayRaw(username);
    if (!record) throw new BadRequestException('No check-in found today');

    if (!record.currentBreakStart)
      throw new BadRequestException('No active break');

    const now = new Date(); // UTC

    const breakSeconds = Math.round(
      (now.getTime() - record.currentBreakStart.getTime()) / 1000,
    );

    record.totalBreakDuration += breakSeconds;
    record.currentBreakStart = null;

    return this.convertToIST(await this.repo.save(record));
  }

  /** Check-out */
  async checkOut(username: string): Promise<Attendance> {
    const record = await this.findTodayRaw(username);
    if (!record) throw new BadRequestException('Not checked in today');
    if (record.endTime) throw new BadRequestException('Already checked out');

    const now = new Date(); // UTC

    // Auto close break if open
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

    return this.convertToIST(await this.repo.save(record));
  }

  /** Get all attendance records (converted to IST) */
  async getAll(): Promise<Attendance[]> {
    const records = await this.repo.find({ order: { startTime: 'DESC' } });
    return records.map((r) => this.convertToIST(r));
  }

  /** Auto checkout previous days */
  async autoCheckoutUnclosed(): Promise<{ closed: number }> {
    this.logger.log('Running auto-checkout cron');

    const openRecords = await this.repo.find({ where: { endTime: IsNull() } });
    const ops: Promise<Attendance>[] = [];

    const todayStart = this.startOfDay();

    for (const r of openRecords) {
      const recordStartDay = this.startOfDay(r.startTime);

      if (recordStartDay.getTime() < todayStart.getTime()) {
        const end = this.endOfDay(r.startTime);

        // Close open break
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
