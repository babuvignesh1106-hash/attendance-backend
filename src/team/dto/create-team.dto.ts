// src/team/dto/create-team.dto.ts
import {
  IsString,
  IsArray,
  ArrayMinSize,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class MemberDto {
  @IsString()
  name: string;
}

export class CreateTeamDto {
  @IsString()
  name: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => MemberDto)
  members: MemberDto[];
}
