import { Controller, Post, Body, Get } from '@nestjs/common';
import { AttendanceService } from './attendance.service';

@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  // CHECK-IN
  @Post('check-in')
  checkIn(@Body('username') username: string) {
    return this.attendanceService.checkIn(username);
  }

  // CHECK-OUT
  @Post('check-out')
  checkOut(@Body('username') username: string) {
    return this.attendanceService.checkOut(username);
  }

  // GET ALL
  @Get()
  getAll() {
    return this.attendanceService.getAllAttendance();
  }
}
