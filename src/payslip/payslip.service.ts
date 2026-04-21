import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { Payslip } from './payslip.entity';
import { CreatePayslipDto } from './dto/create-payslip.dto';
 
@Injectable()
export class PayslipService {
  constructor(
    @InjectRepository(Payslip)
    private payslipRepo: Repository<Payslip>,
  ) {}
 
  private monthMap: Record<string, number> = {
    january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
    july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
  };
 
  private normalizeMonth(month: string) {
    return month?.trim().toLowerCase();
  }

  // ===================== YTD SUMMARY =====================
  private async getPreviousYTDSummary(employeeId: number, financialYear: string, excludeId?: number) {
    const query: any = { employeeId, financialYear };
    if (excludeId) query.id = Not(excludeId);

    const records = await this.payslipRepo.find({ where: query });

    const totals = {
      basic: 0, hra: 0, conv: 0, med: 0, spec: 0, other: 0, bonus: 0, net: 0,
    };

    records.forEach(p => {
      totals.basic += Number(p.basicPay || 0);
      totals.hra += Number(p.hra || 0);
      totals.conv += Number(p.conveyance || 0);
      totals.med += Number(p.medicalAllowance || 0);
      totals.spec += Number(p.specialAllowance || 0);
      totals.other += Number(p.otherAllowance || 0);
      totals.bonus += Number(p.bonus || 0);
      totals.net += Number(p.netSalary || 0);
    });

    return totals;
  }
 
  private calculateSalary(salary: number, payableDays: number, paidDays: number, bonus: number = 0) {
    const basicFull = Math.round(salary * 0.5);
    const hraFull = Math.round(basicFull * 0.5);
    let conveyanceFull = 1600;
    let medicalFull = 1250;
 
    let totalFixed = basicFull + hraFull + conveyanceFull + medicalFull;
    let excess = Math.max(0, totalFixed - salary);
 
    const reduceMedical = Math.min(medicalFull, excess);
    medicalFull -= reduceMedical;
    excess -= reduceMedical;
 
    const reduceConveyance = Math.min(conveyanceFull, excess);
    conveyanceFull -= reduceConveyance;
 
    const specialFull = Math.max(0, salary - (basicFull + hraFull + conveyanceFull + medicalFull));
    const ratio = payableDays > 0 ? paidDays / payableDays : 0;
 
    const basicPay = Math.round(basicFull * ratio);
    const hra = Math.round(hraFull * ratio);
    const conveyance = Math.round(conveyanceFull * ratio);
    const medicalAllowance = Math.round(medicalFull * ratio);
    const specialAllowance = Math.round(specialFull * ratio);
    const safeBonus = Number(bonus) > 0 ? Number(bonus) : 0;
    const grossSalary = basicPay + hra + conveyance + medicalAllowance + specialAllowance + safeBonus;
 
    return {
      basicPay, hra, conveyance, medicalAllowance, specialAllowance,
      otherAllowance: 0, bonus: safeBonus, grossSalary, netSalary: grossSalary,
    };
  }
 
  // ===================== CREATE (FIXED LOGIC) =====================
  async create(dto: CreatePayslipDto) {
    const salary = Number(dto.salary);
    const payableDays = Number(dto.payableDays);
    const paidDays = Number(dto.paidDays);
    const bonus = Number(dto.bonus ?? 0);
 
    const normMonth = this.normalizeMonth(dto.month);
    const monthNumber = this.monthMap[normMonth];
    if (!monthNumber) throw new BadRequestException('Invalid month');
 
    const financialYear = monthNumber >= 4 ? `${dto.year}-${dto.year + 1}` : `${dto.year - 1}-${dto.year}`;
 
    // 1. DELETE ANY OLD DUPLICATE FOR THIS MONTH (To fix the doubling issue)
    await this.payslipRepo.delete({ 
      employeeId: dto.employeeId, 
      month: dto.month, 
      year: dto.year 
    });
 
    const salaryData = this.calculateSalary(salary, payableDays, paidDays, bonus);
    
    // 2. Fetch totals from PREVIOUS months only
    const prev = await this.getPreviousYTDSummary(dto.employeeId, financialYear);

    const payslip = this.payslipRepo.create({
      ...dto,
      financialYear,
      ...salaryData,
      ytdBasicPay: prev.basic + salaryData.basicPay,
      ytdHra: prev.hra + salaryData.hra,
      ytdConveyance: prev.conv + salaryData.conveyance,
      ytdMedicalAllowance: prev.med + salaryData.medicalAllowance,
      ytdSpecialAllowance: prev.spec + salaryData.specialAllowance,
      ytdOtherAllowance: prev.other + salaryData.otherAllowance,
      ytdBonus: prev.bonus + salaryData.bonus,
      ytdNetSalary: prev.net + salaryData.netSalary,
    });
 
    return this.payslipRepo.save(payslip);
  }
 
  async update(id: number, updateData: Partial<CreatePayslipDto>) {
    const payslip = await this.findOne(id);
    const salary = Number(updateData.salary ?? payslip.salary);
    const payableDays = Number(updateData.payableDays ?? payslip.payableDays);
    const paidDays = Number(updateData.paidDays ?? payslip.paidDays);
    const month = updateData.month ?? payslip.month;
    const year = Number(updateData.year ?? payslip.year);
    const bonus = updateData.bonus !== undefined ? Number(updateData.bonus) : Number(payslip.bonus ?? 0);
 
    const monthNumber = this.monthMap[this.normalizeMonth(month)];
    const financialYear = monthNumber >= 4 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
 
    const salaryData = this.calculateSalary(salary, payableDays, paidDays, bonus);
    const prev = await this.getPreviousYTDSummary(payslip.employeeId, financialYear, id);

    Object.assign(payslip, {
      ...updateData,
      financialYear,
      ...salaryData,
      ytdBasicPay: prev.basic + salaryData.basicPay,
      ytdHra: prev.hra + salaryData.hra,
      ytdConveyance: prev.conv + salaryData.conveyance,
      ytdMedicalAllowance: prev.med + salaryData.medicalAllowance,
      ytdSpecialAllowance: prev.spec + salaryData.specialAllowance,
      ytdOtherAllowance: prev.other + salaryData.otherAllowance,
      ytdBonus: prev.bonus + salaryData.bonus,
      ytdNetSalary: prev.net + salaryData.netSalary,
    });
 
    return this.payslipRepo.save(payslip);
  }
 
  findAll() {
    return this.payslipRepo.find({ order: { createdAt: 'DESC' } });
  }
 
  async findOne(id: number) {
    const payslip = await this.payslipRepo.findOne({ where: { id } });
    if (!payslip) throw new NotFoundException(`Payslip #${id} not found`);
    return payslip;
  }
 
  async remove(id: number) {
    const payslip = await this.findOne(id);
    return this.payslipRepo.remove(payslip);
  }
}
