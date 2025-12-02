import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateAttendanceDto {
  @IsString()
  username: string;

  @IsOptional()
  @IsBoolean()
  isCheckedIn?: boolean;

  @IsOptional()
  @IsBoolean()
  isOnBreak?: boolean;

  // If client insists on sending these, server will accept but normally server computes them
  @IsOptional()
  @IsNumber()
  startTime?: number;

  @IsOptional()
  @IsNumber()
  elapsedTime?: number;

  @IsOptional()
  @IsNumber()
  breakCount?: number;

  @IsOptional()
  @IsNumber()
  breakElapsed?: number;
}
