import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payslip } from './payslip.entity';
import { CreatePayslipDto } from './dto/create-payslip.dto';

@Injectable()
export class PayslipService {
  constructor(
    @InjectRepository(Payslip)
    private payslipRepo: Repository<Payslip>,
  ) {}

  // ✅ CREATE
  async create(dto: CreatePayslipDto) {
    const payslip = this.payslipRepo.create(dto);
    return this.payslipRepo.save(payslip);
  }

  // ✅ GET ALL
  findAll() {
    return this.payslipRepo.find();
  }

  // ✅ GET BY ID
  async findOne(id: number) {
    const payslip = await this.payslipRepo.findOne({ where: { id } });
    if (!payslip) throw new NotFoundException(`Payslip #${id} not found`);
    return payslip;
  }

  // ✅ UPDATE (PUT)
  async update(id: number, updateData: Partial<CreatePayslipDto>) {
    const payslip = await this.findOne(id);
    Object.assign(payslip, updateData);
    return this.payslipRepo.save(payslip);
  }

  // ✅ DELETE
  async remove(id: number) {
    const payslip = await this.findOne(id);
    return this.payslipRepo.remove(payslip);
  }
}
