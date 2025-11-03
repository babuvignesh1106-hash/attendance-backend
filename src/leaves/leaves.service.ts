import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Leave } from './entities/leave.entity';
import { CreateLeaveDto } from './dto/create-leave.dto';

@Injectable()
export class LeavesService {
  constructor(
    @InjectRepository(Leave)
    private readonly leaveRepository: Repository<Leave>,
  ) {}

  async create(createLeaveDto: CreateLeaveDto): Promise<Leave> {
    const newLeave = this.leaveRepository.create({
      ...createLeaveDto,
      status: 'Pending',
    });
    return await this.leaveRepository.save(newLeave);
  }

  async findAll(): Promise<Leave[]> {
    return await this.leaveRepository.find();
  }
}
