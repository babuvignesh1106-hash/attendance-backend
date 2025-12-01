import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, IsNull } from 'typeorm';
import { Attendance } from './entities/attendance.entity';

@Injectable()
export class AttendanceService {
  private readonly logger = new Logger(AttendanceService.name);

  // IST Offset (+5:30)
  private readonly IST_OFFSET = 5.5 * 60 * 60 * 1000;
  private readonly DAY_MS = 24 * 60 * 60 * 1000;

  constructor(
    @InjectRepository(Attendance)
    private readonly repo: Repository<Attendance>,
  ) {}

  // -----------------------------
  // TIME HELPERS
  // -----------------------------

  private istDayStartToUTC(date = new Date()): Date {
    const istMs = date.getTime() + this.IST_OFFSET;
    const istDate = new Date(istMs);
    istDate.setHours(0, 0, 0, 0);

    const utcMs = istDate.getTime() - this.IST_OFFSET;
    return new Date(utcMs);
  }

  private istDayEndToUTC(date = new Date()): Date {
    const startUtc = this.istDayStartToUTC(date);
    return new Date(startUtc.getTime() + this.DAY_MS - 1);
  }

  private toIST(date: Date): Date {
    return new Date(date.getTime() + this.IST_OFFSET);
  }

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

  // -----------------------------
  // SESSION HELPERS
  // -----------------------------

  /** Get the latest OPEN session (endTime is null) */
  private async findOpenRecord(username: string): Promise<Attendance | null> {
    return this.repo.findOne({
      where: { username, endTime: IsNull() },
      order: { startTime: 'DESC' },
    });
  }

  /** Get today’s session(s) — raw DB data */
  private async findTodayRaw(username: string): Promise<Attendance[]> {
    const start = this.istDayStartToUTC();
    const end = this.istDayEndToUTC();

    return this.repo.find({
      where: { username, startTime: Between(start, end) },
      order: { startTime: 'ASC' },
    });
  }

  // -----------------------------
  // CHECK-IN
  // -----------------------------

  async checkIn(username: string): Promise<Attendance> {
    if (!username) throw new BadRequestException('Username is required');

    // allow multiple check-ins, but not overlapping sessions
    const open = await this.findOpenRecord(username);
    if (open) {
      throw new BadRequestException(
        'You must check out before checking in again',
      );
    }

    const record = await this.repo.save(
      this.repo.create({
        username,
        startTime: new Date(), // UTC now
        endTime: null,
        workedDuration: 0,
        breakCount: 0,
        totalBreakDuration: 0,
        currentBreakStart: null,
      }),
    );

    return this.convertToIST(record);
  }

  // -----------------------------
  // BREAK START
  // -----------------------------

  async startBreak(username: string): Promise<Attendance> {
    const record = await this.findOpenRecord(username);
    if (!record) throw new BadRequestException('No active session found');

    if (record.currentBreakStart)
      throw new BadRequestException('Break already running');

    record.currentBreakStart = new Date();
    record.breakCount += 1;

    return this.convertToIST(await this.repo.save(record));
  }

  // -----------------------------
  // BREAK END
  // -----------------------------

  async endBreak(username: string): Promise<Attendance> {
    const record = await this.findOpenRecord(username);
    if (!record) throw new BadRequestException('No active session found');

    if (!record.currentBreakStart)
      throw new BadRequestException('No active break');

    const now = new Date();
    const breakSeconds = Math.round(
      (now.getTime() - record.currentBreakStart.getTime()) / 1000,
    );

    record.totalBreakDuration += breakSeconds > 0 ? breakSeconds : 0;
    record.currentBreakStart = null;

    return this.convertToIST(await this.repo.save(record));
  }

  // -----------------------------
  // CHECK-OUT
  // -----------------------------

  async checkOut(username: string): Promise<Attendance> {
    const record = await this.findOpenRecord(username);
    if (!record) throw new BadRequestException('No active session found');

    const now = new Date();

    // Close break if running
    if (record.currentBreakStart) {
      const breakSeconds = Math.round(
        (now.getTime() - record.currentBreakStart.getTime()) / 1000,
      );
      record.totalBreakDuration += breakSeconds > 0 ? breakSeconds : 0;
      record.currentBreakStart = null;
    }

    const rawWorked = Math.round(
      (now.getTime() - record.startTime.getTime()) / 1000,
    );

    record.endTime = now;
    record.workedDuration =
      rawWorked - record.totalBreakDuration > 0
        ? rawWorked - record.totalBreakDuration
        : 0;

    return this.convertToIST(await this.repo.save(record));
  }

  // -----------------------------
  // GET ALL
  // -----------------------------

  async getAll(): Promise<Attendance[]> {
    const records = await this.repo.find({ order: { startTime: 'DESC' } });
    return records.map((r) => this.convertToIST(r));
  }

  // -----------------------------
  // AUTO CHECK-OUT (CRON)
  // -----------------------------

  async autoCheckoutUnclosed(): Promise<{ closed: number }> {
    this.logger.log('Running auto-checkout...');

    const openSessions = await this.repo.find({
      where: { endTime: IsNull() },
    });

    const todayStartUtc = this.istDayStartToUTC();

    let count = 0;

    for (const r of openSessions) {
      // Calculate IST day start of this record
      const recordIstStartDayMs =
        Math.floor((r.startTime.getTime() + this.IST_OFFSET) / this.DAY_MS) *
          this.DAY_MS -
        this.IST_OFFSET;

      const recordStartUtc = new Date(recordIstStartDayMs);

      // if record started BEFORE today → auto close
      if (recordStartUtc.getTime() < todayStartUtc.getTime()) {
        const endUtc = new Date(recordStartUtc.getTime() + this.DAY_MS - 1);

        // close break if running
        if (r.currentBreakStart) {
          const breakSeconds = Math.round(
            (endUtc.getTime() - r.currentBreakStart.getTime()) / 1000,
          );
          r.totalBreakDuration += breakSeconds > 0 ? breakSeconds : 0;
          r.currentBreakStart = null;
        }

        const rawWorked = Math.round(
          (endUtc.getTime() - r.startTime.getTime()) / 1000,
        );

        r.endTime = endUtc;
        r.workedDuration =
          rawWorked - r.totalBreakDuration > 0
            ? rawWorked - r.totalBreakDuration
            : 0;

        await this.repo.save(r);
        count++;
      }
    }

    this.logger.log(`Auto-checked-out ${count} sessions`);
    return { closed: count };
  }
}
