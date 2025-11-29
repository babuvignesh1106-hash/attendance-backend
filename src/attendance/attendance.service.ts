import { Injectable } from '@nestjs/common';
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
    // Convert timestamps to Date
    if (data.startTime) data.startTime = new Date(data.startTime);
    if (data.endTime) data.endTime = new Date(data.endTime);

    // Generate the next ID manually
    const lastRecord = await this.attendanceRepo
      .createQueryBuilder('attendance')
      .select('MAX(attendance.id)', 'max')
      .getRawOne();

    const nextId = lastRecord?.max ? Number(lastRecord.max) + 1 : 1;
    data.id = nextId;

    // ✅ Ensure username is provided (for backward compatibility)
    if (!data.username) {
      data.username = 'unknown';
    }

    const record = this.attendanceRepo.create(data);
    return this.attendanceRepo.save(record);
  }

  async getAllAttendance() {
    return this.attendanceRepo.find();
  }
}
