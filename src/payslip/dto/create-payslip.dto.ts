import { IsString, IsNumber, IsOptional, IsDateString } from 'class-validator';

export class CreatePayslipDto {
  @IsString()
  employeeId: string;

  @IsString()
  employeeName: string;

  @IsString()
  designation: string;

  @IsNumber()
  salary: number;

  @IsString()
  panCard: string;

  @IsDateString()
  dateOfJoining: string;

  @IsOptional()
  @IsNumber()
  bonus?: number;

  @IsString()
  month: string;

  @IsNumber()
  year: number;
}
