import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, IsNull } from 'typeorm';
import { Attendance } from './entities/attendance.entity';

@Injectable()
export class AttendanceService {
  private readonly logger = new Logger(AttendanceService.name);

  private readonly IST_OFFSET = 5.5 * 60 * 60 * 1000;
  private readonly DAY_MS = 24 * 60 * 60 * 1000;

  constructor(
    @InjectRepository(Attendance)
    private readonly repo: Repository<Attendance>,
  ) {}

  // ---------------------------------------
  // HELPERS
  // ---------------------------------------

  /** Convert UTC Date → IST string WITHOUT TIMEZONE (important!) */
  private toISTString(date: Date | null): string | null {
    if (!date) return null;

    return new Date(date.getTime() + this.IST_OFFSET)
      .toISOString()
      .replace('Z', ''); // remove timezone to prevent React conversion
  }

  /** Convert entity to IST string-safe version */
  private wrap(att: Attendance) {
    return {
      ...att,
      startTime: this.toISTString(att.startTime),
      endTime: this.toISTString(att.endTime),
      currentBreakStart: this.toISTString(att.currentBreakStart),
    };
  }

  /** IST day start → UTC */
  private istDayStartToUTC(date = new Date()): Date {
    const istMs = date.getTime() + this.IST_OFFSET;
    const istDate = new Date(istMs);
    istDate.setHours(0, 0, 0, 0);
    return new Date(istDate.getTime() - this.IST_OFFSET);
  }

  /** IST day end → UTC */
  private istDayEndToUTC(date = new Date()): Date {
    const start = this.istDayStartToUTC(date);
    return new Date(start.getTime() + this.DAY_MS - 1);
  }

  /** Find latest open record (endTime = null) */
  private findOpenRecord(username: string) {
    return this.repo.findOne({
      where: { username, endTime: IsNull() },
      order: { startTime: 'DESC' },
    });
  }

  // ---------------------------------------
  // CHECK-IN
  // ---------------------------------------

  async checkIn(username: string) {
    if (!username) throw new BadRequestException('Username is required');

    const open = await this.findOpenRecord(username);
    if (open) throw new BadRequestException('Already checked in');

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

    return this.wrap(record);
  }

  // ---------------------------------------
  // BREAK START
  // ---------------------------------------

  async startBreak(username: string) {
    const record = await this.findOpenRecord(username);
    if (!record) throw new BadRequestException('No active session');
    if (record.currentBreakStart)
      throw new BadRequestException('Break already running');

    record.currentBreakStart = new Date();
    record.breakCount += 1;

    return this.wrap(await this.repo.save(record));
  }

  // ---------------------------------------
  // BREAK END
  // ---------------------------------------

  async endBreak(username: string) {
    const record = await this.findOpenRecord(username);
    if (!record) throw new BadRequestException('No active session');
    if (!record.currentBreakStart)
      throw new BadRequestException('No break active');

    const now = new Date();
    const seconds = Math.round(
      (now.getTime() - record.currentBreakStart.getTime()) / 1000,
    );

    record.totalBreakDuration += Math.max(seconds, 0);
    record.currentBreakStart = null;

    return this.wrap(await this.repo.save(record));
  }

  // ---------------------------------------
  // CHECK-OUT
  // ---------------------------------------

  async checkOut(username: string) {
    const record = await this.findOpenRecord(username);
    if (!record) throw new BadRequestException('No active session');

    const now = new Date();

    if (record.currentBreakStart) {
      const seconds = Math.round(
        (now.getTime() - record.currentBreakStart.getTime()) / 1000,
      );
      record.totalBreakDuration += Math.max(seconds, 0);
      record.currentBreakStart = null;
    }

    const workedSeconds = Math.round(
      (now.getTime() - record.startTime.getTime()) / 1000,
    );

    record.endTime = now;
    record.workedDuration = Math.max(
      workedSeconds - record.totalBreakDuration,
      0,
    );

    return this.wrap(await this.repo.save(record));
  }

  // ---------------------------------------
  // GET ALL
  // ---------------------------------------

  async getAll() {
    const records = await this.repo.find({ order: { startTime: 'DESC' } });
    return records.map((r) => this.wrap(r));
  }

  // ---------------------------------------
  // AUTO CLOSE OLD SESSIONS
  // ---------------------------------------

  async autoCheckoutUnclosed(): Promise<{ closed: number }> {
    this.logger.log('Running auto checkout...');

    const openSessions = await this.repo.find({
      where: { endTime: IsNull() },
    });

    const todayStartUtc = this.istDayStartToUTC();
    let closed = 0;

    for (const r of openSessions) {
      const sessionDay =
        Math.floor((r.startTime.getTime() + this.IST_OFFSET) / this.DAY_MS) *
          this.DAY_MS -
        this.IST_OFFSET;

      const sessionStartUTC = new Date(sessionDay);

      if (sessionStartUTC.getTime() < todayStartUtc.getTime()) {
        const endUTC = new Date(sessionStartUTC.getTime() + this.DAY_MS - 1);

        if (r.currentBreakStart) {
          const seconds = Math.round(
            (endUTC.getTime() - r.currentBreakStart.getTime()) / 1000,
          );
          r.totalBreakDuration += Math.max(seconds, 0);
          r.currentBreakStart = null;
        }

        const worked = Math.round(
          (endUTC.getTime() - r.startTime.getTime()) / 1000,
        );

        r.endTime = endUTC;
        r.workedDuration = Math.max(worked - r.totalBreakDuration, 0);

        await this.repo.save(r);
        closed++;
      }
    }

    return { closed };
  }
}
