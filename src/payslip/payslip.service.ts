import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
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

  private monthMap: Record<string, number> = {
    january: 1,
    february: 2,
    march: 3,
    april: 4,
    may: 5,
    june: 6,
    july: 7,
    august: 8,
    september: 9,
    october: 10,
    november: 11,
    december: 12,
  };

  private normalizeMonth(month: string) {
    return month?.trim().toLowerCase();
  }

  // ===================== PREVIOUS YTD =====================
  private async getPreviousYTDSummary(
    employeeId: string,
    financialYear: string,
    currentMonthNumber: number,
    excludeId?: number,
  ) {
    const records = await this.payslipRepo.find({
      where: { employeeId, financialYear },
    });

    const totals = {
      basic: 0,
      hra: 0,
      conv: 0,
      med: 0,
      spec: 0,
      other: 0,
      bonus: 0,
      net: 0,
    };

    records.forEach((p) => {
      const monthNum = this.monthMap[this.normalizeMonth(p.month)];

      if (monthNum < currentMonthNumber && p.id !== excludeId) {
        totals.basic += Number(p.basicPay || 0);
        totals.hra += Number(p.hra || 0);
        totals.conv += Number(p.conveyance || 0);
        totals.med += Number(p.medicalAllowance || 0);
        totals.spec += Number(p.specialAllowance || 0);
        totals.other += Number(p.otherAllowance || 0);
        totals.bonus += Number(p.bonus || 0);
        totals.net += Number(p.netSalary || 0);
      }
    });

    return totals;
  }

  // ===================== PROJECTED YTD =====================
  private async getProjectedYTD(employeeId: string, financialYear: string) {
    const records = await this.payslipRepo.find({
      where: { employeeId, financialYear },
    });

    const totals = {
      basic: 0,
      hra: 0,
      conv: 0,
      med: 0,
      spec: 0,
      other: 0,
      bonus: 0,
      net: 0,
    };

    records.forEach((p) => {
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

  // ===================== RECALCULATE ALL =====================
  private async recalculateAll(employeeId: string, financialYear: string) {
    const records = await this.payslipRepo.find({
      where: { employeeId, financialYear },
    });

    records.sort((a, b) => {
      const m1 = this.monthMap[this.normalizeMonth(a.month)];
      const m2 = this.monthMap[this.normalizeMonth(b.month)];
      return m1 - m2;
    });

    const running = {
      basic: 0,
      hra: 0,
      conv: 0,
      med: 0,
      spec: 0,
      other: 0,
      bonus: 0,
      net: 0,
    };

    for (const p of records) {
      // running YTD
      running.basic += Number(p.basicPay || 0);
      running.hra += Number(p.hra || 0);
      running.conv += Number(p.conveyance || 0);
      running.med += Number(p.medicalAllowance || 0);
      running.spec += Number(p.specialAllowance || 0);
      running.other += Number(p.otherAllowance || 0);
      running.bonus += Number(p.bonus || 0);
      running.net += Number(p.netSalary || 0);

      // projected total (all months)
      const projected = await this.getProjectedYTD(employeeId, financialYear);

      Object.assign(p, {
        ytdBasicPay: running.basic,
        ytdHra: running.hra,
        ytdConveyance: running.conv,
        ytdMedicalAllowance: running.med,
        ytdSpecialAllowance: running.spec,
        ytdOtherAllowance: running.other,
        ytdBonus: running.bonus,
        ytdNetSalary: running.net,

        projectedYtdBasicPay: projected.basic,
        projectedYtdHra: projected.hra,
        projectedYtdConveyance: projected.conv,
        projectedYtdMedicalAllowance: projected.med,
        projectedYtdSpecialAllowance: projected.spec,
        projectedYtdOtherAllowance: projected.other,
        projectedYtdBonus: projected.bonus,
        projectedYtdNetSalary: projected.net,
      });

      await this.payslipRepo.save(p);
    }
  }

  // ===================== SALARY =====================
  private calculateSalary(
    salary: number,
    payableDays: number,
    paidDays: number,
    bonus: number = 0,
  ) {
    const basicFull = Math.round(salary * 0.5);
    const hraFull = Math.round(basicFull * 0.5);

    const ratio = payableDays > 0 ? paidDays / payableDays : 0;

    const basicPay = Math.round(basicFull * ratio);
    const hra = Math.round(hraFull * ratio);

    const conveyance = 1600;
    const medicalAllowance = 900;

    const specialAllowance =
      salary - (basicPay + hra + conveyance + medicalAllowance);

    const safeBonus = Number(bonus) || 0;

    const gross =
      basicPay +
      hra +
      conveyance +
      medicalAllowance +
      specialAllowance +
      safeBonus;

    return {
      basicPay,
      hra,
      conveyance,
      medicalAllowance,
      specialAllowance,
      otherAllowance: 0,
      bonus: safeBonus,
      grossSalary: gross,
      netSalary: gross,
    };
  }

  // ===================== CREATE =====================
  async create(dto: CreatePayslipDto) {
    const normMonth = this.normalizeMonth(dto.month);
    const monthNumber = this.monthMap[normMonth];

    if (!monthNumber) throw new BadRequestException('Invalid month');

    const financialYear =
      monthNumber >= 4
        ? `${dto.year}-${dto.year + 1}`
        : `${dto.year - 1}-${dto.year}`;

    const existing = await this.payslipRepo.findOne({
      where: {
        employeeId: String(dto.employeeId),
        month: dto.month,
        year: dto.year,
      },
    });

    if (existing) {
      throw new BadRequestException('Payslip already exists');
    }

    const salaryData = this.calculateSalary(
      Number(dto.salary),
      Number(dto.payableDays),
      Number(dto.paidDays),
      Number(dto.bonus || 0),
    );

    const payslip = this.payslipRepo.create({
      ...dto,
      employeeId: String(dto.employeeId),
      financialYear,
      ...salaryData,
    });

    const saved = await this.payslipRepo.save(payslip);

    await this.recalculateAll(String(dto.employeeId), financialYear);

    return saved;
  }

  // ===================== UPDATE =====================
  async update(id: number, updateData: Partial<CreatePayslipDto>) {
    const payslip = await this.findOne(id);

    const month = updateData.month ?? payslip.month;
    const year = updateData.year ?? payslip.year;

    const monthNumber = this.monthMap[this.normalizeMonth(month)];

    const financialYear =
      monthNumber >= 4 ? `${year}-${year + 1}` : `${year - 1}-${year}`;

    const salaryData = this.calculateSalary(
      Number(updateData.salary ?? payslip.salary),
      Number(updateData.payableDays ?? payslip.payableDays),
      Number(updateData.paidDays ?? payslip.paidDays),
      Number(updateData.bonus ?? payslip.bonus),
    );

    Object.assign(payslip, {
      ...updateData,
      employeeId: String(updateData.employeeId ?? payslip.employeeId),
      financialYear,
      ...salaryData,
    });

    const updated = await this.payslipRepo.save(payslip);

    await this.recalculateAll(String(payslip.employeeId), financialYear);

    return updated;
  }

  // ===================== GET =====================
  findAll() {
    return this.payslipRepo.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: number) {
    const payslip = await this.payslipRepo.findOne({ where: { id } });
    if (!payslip) {
      throw new NotFoundException(`Payslip #${id} not found`);
    }
    return payslip;
  }

  async remove(id: number) {
    const payslip = await this.findOne(id);
    return this.payslipRepo.remove(payslip);
  }
}
