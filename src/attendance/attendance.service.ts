import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
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

  private wrap(att: Attendance) {
    return att;
  }

  private validateUsername(username: string) {
    if (!username || !username.trim()) {
      throw new BadRequestException('Username required');
    }
  }

  /** Convert IST day start to UTC */
  private istDayStartToUTC(date = new Date()): Date {
    const istMs = date.getTime() + this.IST_OFFSET;
    const istDate = new Date(istMs);
    istDate.setHours(0, 0, 0, 0);
    return new Date(istDate.getTime() - this.IST_OFFSET);
  }

  /** Convert IST day end to UTC */
  private istDayEndToUTC(date = new Date()): Date {
    const start = this.istDayStartToUTC(date);
    return new Date(start.getTime() + this.DAY_MS - 1);
  }

  /** Find active session */
  private async findOpenRecord(username: string) {
    return this.repo.findOne({
      where: { username, endTime: IsNull() },
      order: { startTime: 'DESC' },
    });
  }

  // ---------------------------------------
  // CHECK IN
  // ---------------------------------------

  async checkIn(username: string) {
    try {
      this.validateUsername(username);

      const open = await this.findOpenRecord(username);

      if (open) {
        throw new BadRequestException('Already checked in');
      }

      const record = this.repo.create({
        username,
        startTime: new Date(),
        endTime: null,
        workedDuration: 0,
        breakCount: 0,
        totalBreakDuration: 0,
        currentBreakStart: null,
      });

      const saved = await this.repo.save(record);

      return this.wrap(saved);
    } catch (error) {
      this.logger.error('CHECK-IN ERROR', error);
      throw error;
    }
  }

  // ---------------------------------------
  // START BREAK
  // ---------------------------------------

  async startBreak(username: string) {
    try {
      this.validateUsername(username);

      const record = await this.findOpenRecord(username);

      if (!record) {
        throw new BadRequestException('No active session');
      }

      if (record.currentBreakStart) {
        throw new BadRequestException('Break already running');
      }

      record.currentBreakStart = new Date();
      record.breakCount += 1;

      return this.wrap(await this.repo.save(record));
    } catch (error) {
      this.logger.error('START BREAK ERROR', error);
      throw error;
    }
  }

  // ---------------------------------------
  // END BREAK
  // ---------------------------------------

  async endBreak(username: string) {
    try {
      this.validateUsername(username);

      const record = await this.findOpenRecord(username);

      if (!record) {
        throw new BadRequestException('No active session');
      }

      if (!record.currentBreakStart) {
        throw new BadRequestException('No break running');
      }

      const now = new Date();

      const seconds = Math.round(
        (now.getTime() - record.currentBreakStart.getTime()) / 1000,
      );

      record.totalBreakDuration += Math.max(seconds, 0);
      record.currentBreakStart = null;

      return this.wrap(await this.repo.save(record));
    } catch (error) {
      this.logger.error('END BREAK ERROR', error);
      throw error;
    }
  }

  // ---------------------------------------
  // CHECK OUT
  // ---------------------------------------

  async checkOut(username: string) {
    try {
      this.validateUsername(username);

      const record = await this.findOpenRecord(username);

      if (!record) {
        throw new BadRequestException('No active session');
      }

      const now = new Date();

      // close running break
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
    } catch (error) {
      this.logger.error('CHECK-OUT ERROR', error);
      throw error;
    }
  }

  // ---------------------------------------
  // GET ALL
  // ---------------------------------------

  async getAll() {
    try {
      const records = await this.repo.find({
        order: { startTime: 'DESC' },
      });

      return records.map((r) => this.wrap(r));
    } catch (error) {
      this.logger.error('FETCH ATTENDANCE ERROR', error);
      throw error;
    }
  }

  // ---------------------------------------
  // AUTO CHECKOUT (MIDNIGHT IST)
  // ---------------------------------------

  async autoCheckoutUnclosed(): Promise<{ closed: number }> {
    try {
      this.logger.log('Running auto checkout...');

      const openSessions = await this.repo.find({
        where: { endTime: IsNull() },
      });

      const todayStartUtc = this.istDayStartToUTC();

      let closed = 0;

      for (const r of openSessions) {
        const sessionDayStartUtc = this.istDayStartToUTC(r.startTime);

        if (sessionDayStartUtc < todayStartUtc) {
          const sessionDayEndUtc = this.istDayEndToUTC(r.startTime);

          if (r.currentBreakStart) {
            const seconds = Math.round(
              (sessionDayEndUtc.getTime() - r.currentBreakStart.getTime()) /
                1000,
            );

            r.totalBreakDuration += Math.max(seconds, 0);
            r.currentBreakStart = null;
          }

          const workedSeconds = Math.round(
            (sessionDayEndUtc.getTime() - r.startTime.getTime()) / 1000,
          );

          r.endTime = sessionDayEndUtc;

          r.workedDuration = Math.max(workedSeconds - r.totalBreakDuration, 0);

          await this.repo.save(r);

          closed++;
        }
      }

      return { closed };
    } catch (error) {
      this.logger.error('AUTO CHECKOUT ERROR', error);
      throw error;
    }
  }
}
