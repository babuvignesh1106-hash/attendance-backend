import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, MoreThanOrEqual, LessThan } from 'typeorm';
import { Attendance } from './entities/attendance.entity';

@Injectable()
export class AttendanceService {
  private readonly logger = new Logger(AttendanceService.name);

  // 24 hours in ms
  private readonly DAY_MS = 24 * 60 * 60 * 1000;

  constructor(
    @InjectRepository(Attendance)
    private readonly repo: Repository<Attendance>,
  ) {}

  // -------------------------
  // Helpers
  // -------------------------
  private entityToPayload(att: Attendance) {
    // Convert Date objects to ISO strings (UTC). Frontend should parse them to local.
    return {
      id: att.id,
      username: att.username,
      startTime: att.startTime ? att.startTime.toISOString() : null,
      endTime: att.endTime ? att.endTime.toISOString() : null,
      workedDuration: att.workedDuration,
      breakCount: att.breakCount,
      totalBreakDuration: att.totalBreakDuration,
      currentBreakStart: att.currentBreakStart
        ? att.currentBreakStart.toISOString()
        : null,
    };
  }

  private findOpenRecord(username: string) {
    return this.repo.findOne({
      where: { username, endTime: IsNull() },
      order: { startTime: 'DESC' },
    });
  }

  // -------------------------
  // Check-in
  // -------------------------
  async checkIn(username: string) {
    if (!username) throw new BadRequestException('Username is required');

    const open = await this.findOpenRecord(username);
    if (open) throw new BadRequestException('Already checked in');

    const record = this.repo.create({
      username,
      startTime: new Date(), // UTC now
      endTime: null,
      workedDuration: 0,
      breakCount: 0,
      totalBreakDuration: 0,
      currentBreakStart: null,
    });

    const saved = await this.repo.save(record);
    return this.entityToPayload(saved);
  }

  // -------------------------
  // Start break
  // -------------------------
  async startBreak(username: string) {
    const record = await this.findOpenRecord(username);
    if (!record) throw new BadRequestException('No active session');
    if (record.currentBreakStart)
      throw new BadRequestException('Break already running');

    record.currentBreakStart = new Date();
    record.breakCount = (record.breakCount || 0) + 1;

    const saved = await this.repo.save(record);
    return this.entityToPayload(saved);
  }

  // -------------------------
  // End break
  // -------------------------
  async endBreak(username: string) {
    const record = await this.findOpenRecord(username);
    if (!record) throw new BadRequestException('No active session');
    if (!record.currentBreakStart)
      throw new BadRequestException('No break active');

    const now = new Date();
    const seconds = Math.round(
      (now.getTime() - record.currentBreakStart.getTime()) / 1000,
    );
    record.totalBreakDuration =
      (record.totalBreakDuration || 0) + Math.max(seconds, 0);
    record.currentBreakStart = null;

    const saved = await this.repo.save(record);
    return this.entityToPayload(saved);
  }

  // -------------------------
  // Check-out
  // -------------------------
  async checkOut(username: string) {
    const record = await this.findOpenRecord(username);
    if (!record) throw new BadRequestException('No active session');

    const now = new Date();

    // If user is on break, close the break and add time
    if (record.currentBreakStart) {
      const seconds = Math.round(
        (now.getTime() - record.currentBreakStart.getTime()) / 1000,
      );
      record.totalBreakDuration =
        (record.totalBreakDuration || 0) + Math.max(seconds, 0);
      record.currentBreakStart = null;
    }

    const workedSeconds = Math.round(
      (now.getTime() - record.startTime.getTime()) / 1000,
    );
    record.endTime = now;
    record.workedDuration = Math.max(
      workedSeconds - (record.totalBreakDuration || 0),
      0,
    );

    const saved = await this.repo.save(record);
    return this.entityToPayload(saved);
  }

  // -------------------------
  // Get all
  // -------------------------
  async getAll() {
    const records = await this.repo.find({ order: { startTime: 'DESC' } });
    return records.map((r) => this.entityToPayload(r));
  }

  // -------------------------
  // Auto-checkout unclosed sessions older than today's IST day
  // -------------------------
  async autoCheckoutUnclosed(): Promise<{ closed: number }> {
    this.logger.log('Running auto checkout...');

    // We'll interpret "older than today's IST start" on the server by converting
    // the current UTC to IST offset logic on the server-side if needed.
    // Simpler: treat "older than 24 hours since start" or compute based on IST offset.
    // Here we'll use IST concept: compute today's IST midnight in UTC to compare.

    const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
    const nowUtc = new Date();
    // get IST time equivalent
    const nowIstMs = nowUtc.getTime() + IST_OFFSET_MS;
    const istMidnightMs = new Date(nowIstMs).setHours(0, 0, 0, 0);
    const istMidnightUtcMs = istMidnightMs - IST_OFFSET_MS;
    const todayStartUtc = new Date(istMidnightUtcMs);

    const openSessions = await this.repo.find({ where: { endTime: IsNull() } });
    let closed = 0;

    for (const r of openSessions) {
      // if session started before today's IST midnight (in UTC terms), we close it at end of that IST day
      if (r.startTime.getTime() < todayStartUtc.getTime()) {
        // end at IST day end (23:59:59.999) in UTC
        const endUtc = new Date(todayStartUtc.getTime() + this.DAY_MS - 1);

        // close active break
        if (r.currentBreakStart) {
          const seconds = Math.round(
            (endUtc.getTime() - r.currentBreakStart.getTime()) / 1000,
          );
          r.totalBreakDuration =
            (r.totalBreakDuration || 0) + Math.max(seconds, 0);
          r.currentBreakStart = null;
        }

        const workedSeconds = Math.round(
          (endUtc.getTime() - r.startTime.getTime()) / 1000,
        );
        r.endTime = endUtc;
        r.workedDuration = Math.max(
          workedSeconds - (r.totalBreakDuration || 0),
          0,
        );

        await this.repo.save(r);
        closed++;
      }
    }

    return { closed };
  }
}
