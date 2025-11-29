import { Controller, Post, Body, Get } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { Attendance } from './entities/attendance.entity';

@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  // ✅ POST endpoint to create attendance
  @Post()
  create(@Body() attendanceData: Partial<Attendance>) {
    return this.attendanceService.createAttendance(attendanceData);
  }

  // ✅ GET endpoint to fetch all attendance records
  @Get()
  getAll() {
    return this.attendanceService.getAllAttendance();
  }
}
