import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Attendance } from './entities/attendance.entity';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(Attendance)
    private readonly attendanceRepo: Repository<Attendance>,
  ) {}

  // CHECK-IN
  async checkIn(username: string) {
    const openRecord = await this.attendanceRepo.findOne({
      where: { username, endTime: IsNull() },
    });

    if (openRecord) {
      throw new BadRequestException('You already have an active attendance.');
    }

    const newRecord = this.attendanceRepo.create({
      username,
      startTime: new Date(),
      breakCount: 0,
      totalBreakDuration: 0,
      workedDuration: 0,
    });

    return await this.attendanceRepo.save(newRecord);
  }

  // CHECK-OUT (FORCED TIME)
  async checkOut(username: string) {
    const lastRecord = await this.attendanceRepo.findOne({
      where: { username, endTime: IsNull() },
      order: { id: 'DESC' },
    });

    if (!lastRecord) {
      throw new BadRequestException('No active attendance found to check out.');
    }

    const start = lastRecord.startTime;

    // FORCED TO 7:47 PM
    const forcedEndTime = new Date(
      start.getFullYear(),
      start.getMonth(),
      start.getDate(),
      19,
      54,
      0,
      0,
    );

    lastRecord.endTime = forcedEndTime;

    lastRecord.workedDuration =
      forcedEndTime.getTime() - lastRecord.startTime.getTime();

    return await this.attendanceRepo.save(lastRecord);
  }

  async getAllAttendance() {
    return this.attendanceRepo.find({ order: { id: 'DESC' } });
  }
}
