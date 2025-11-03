import { IsNotEmpty, IsString } from 'class-validator';

export class CreateLeaveDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  leaveType: string;

  @IsString()
  @IsNotEmpty()
  fromDate: string;

  @IsString()
  @IsNotEmpty()
  toDate: string;

  @IsString()
  @IsNotEmpty()
  reason: string;
}
