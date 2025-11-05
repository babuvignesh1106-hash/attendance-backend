import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LeaveRequest } from './entities/leave-request.entity';
import { LeaveBalance } from './entities/leave-balance.entity';
import { CreateLeaveDto } from './dto/create-leave.dto';
import { UpdateLeaveDto } from './dto/update-leave.dto';

@Injectable()
export class LeavesService {
  constructor(
    @InjectRepository(LeaveRequest)
    private leaveRequestRepo: Repository<LeaveRequest>,
    @InjectRepository(LeaveBalance)
    private leaveBalanceRepo: Repository<LeaveBalance>,
  ) {}

  // Get or create default leave balance
  async getBalance(name: string): Promise<LeaveBalance> {
    let balance = await this.leaveBalanceRepo.findOne({ where: { name } });
    if (!balance) {
      balance = this.leaveBalanceRepo.create({
        name,
        sickLeave: 6,
        personalLeave: 6,
        earnedLeave: 12,
        maternityLeave: 0,
      });
      await this.leaveBalanceRepo.save(balance);
    }
    return balance;
  }

  // Create a leave request and deduct from balance safely
  async create(createLeaveDto: CreateLeaveDto) {
    const { name, leaveType, fromDate, toDate } = createLeaveDto;

    const days =
      Math.ceil(
        (new Date(toDate).getTime() - new Date(fromDate).getTime()) /
          (1000 * 60 * 60 * 24),
      ) + 1;

    const balance = await this.getBalance(name);

    let errorMessage: string | null = null;

    switch (leaveType) {
      case 'Sick Leave':
        if (days > balance.sickLeave)
          errorMessage = `Not enough Sick Leave. You have ${balance.sickLeave} days remaining.`;
        else balance.sickLeave -= days;
        break;

      case 'Personal Leave':
        if (days > balance.personalLeave)
          errorMessage = `Not enough Personal Leave. You have ${balance.personalLeave} days remaining.`;
        else balance.personalLeave -= days;
        break;

      case 'Earned Leave':
        if (days > balance.earnedLeave)
          errorMessage = `Not enough Earned Leave. You have ${balance.earnedLeave} days remaining.`;
        else balance.earnedLeave -= days;
        break;

      case 'Maternity Leave':
        if (days > balance.maternityLeave)
          errorMessage = `Not enough Maternity Leave. You have ${balance.maternityLeave} days remaining.`;
        else balance.maternityLeave -= days;
        break;

      default:
        errorMessage = 'Invalid leave type.';
    }

    if (errorMessage) {
      return { message: errorMessage, balance };
    }

    await this.leaveBalanceRepo.save(balance);

    const leave = this.leaveRequestRepo.create({
      ...createLeaveDto,
      status: 'Pending',
      submittedAt: new Date(), // <-- added
    });

    const savedLeave = await this.leaveRequestRepo.save(leave);

    return {
      message: 'Leave request created successfully.',
      leave: savedLeave,
      balance,
    };
  }

  // Get all leave requests
  async findAll() {
    return this.leaveRequestRepo.find();
  }

  // Update leave request (status or reason)
  async update(id: number, updateLeaveDto: UpdateLeaveDto) {
    const leave = await this.leaveRequestRepo.findOne({ where: { id } });
    if (!leave) return null;

    Object.assign(leave, updateLeaveDto);
    return await this.leaveRequestRepo.save(leave);
  }
}
