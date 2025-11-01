// src/attendance/dto/create-attendance.dto.ts
import { IsBoolean, IsNumber, IsOptional } from 'class-validator';

export class CreateAttendanceDto {
  @IsBoolean()
  isCheckedIn: boolean;

  @IsNumber()
  @IsOptional()
  startTime?: number;

  @IsNumber()
  elapsedTime: number;

  @IsBoolean()
  isOnBreak: boolean;

  @IsNumber()
  breakCount: number;

  @IsNumber()
  breakElapsed: number;
}
