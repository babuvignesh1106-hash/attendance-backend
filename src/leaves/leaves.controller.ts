import { Controller, Post, Get, Body } from '@nestjs/common';
import { LeavesService } from './leaves.service';
import { CreateLeaveDto } from './dto/create-leave.dto';

@Controller('leaves')
export class LeavesController {
  constructor(private readonly leavesService: LeavesService) {}

  @Post()
  create(@Body() createLeaveDto: CreateLeaveDto) {
    return this.leavesService.create(createLeaveDto);
  }

  @Get()
  findAll() {
    return this.leavesService.findAll();
  }
}
