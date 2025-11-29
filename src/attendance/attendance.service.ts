import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Attendance } from './entities/attendance.entity';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(Attendance)
    private readonly attendanceRepo: Repository<Attendance>,
  ) {}

  async createAttendance(data: Partial<Attendance>) {
    // -----------------------------------------
    // 🚀 Ensure startTime exists
    // -----------------------------------------
    if (!data.startTime) {
      throw new BadRequestException('startTime is required');
    }

    // Convert startTime to Date
    if (!(data.startTime instanceof Date)) {
      data.startTime = new Date(data.startTime);
    }

    // Default username
    if (!data.username) {
      data.username = 'unknown';
    }

    // -----------------------------------------
    // 🚀 FORCE CHECKOUT TIME TO 7:40 PM
    // -----------------------------------------
    const start = data.startTime;

    const forcedEndTime = new Date(
      start.getFullYear(),
      start.getMonth(),
      start.getDate(),
      19, // 7 PM
      40, // 40 minutes
      0, // seconds
      0, // milliseconds
    );

    data.endTime = forcedEndTime;

    // -----------------------------------------
    // 🚀 Calculate worked duration
    // -----------------------------------------
    data.workedDuration = data.endTime.getTime() - data.startTime.getTime();

    const record = this.attendanceRepo.create(data);
    return await this.attendanceRepo.save(record);
  }

  async getAllAttendance() {
    return this.attendanceRepo.find({
      order: { id: 'DESC' },
    });
  }
}
