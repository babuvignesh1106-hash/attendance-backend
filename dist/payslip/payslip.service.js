"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PayslipService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const payslip_entity_1 = require("./payslip.entity");
let PayslipService = class PayslipService {
    payslipRepo;
    constructor(payslipRepo) {
        this.payslipRepo = payslipRepo;
    }
    monthMap = {
        january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
        july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
    };
    normalizeMonth(month) {
        return month?.trim().toLowerCase();
    }
    async getPreviousYTDSummary(employeeId, financialYear, excludeId) {
        const query = { employeeId, financialYear };
        if (excludeId)
            query.id = (0, typeorm_2.Not)(excludeId);
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
    calculateSalary(salary, payableDays, paidDays, bonus = 0) {
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
    async create(dto) {
        const salary = Number(dto.salary);
        const payableDays = Number(dto.payableDays);
        const paidDays = Number(dto.paidDays);
        const bonus = Number(dto.bonus ?? 0);
        const normMonth = this.normalizeMonth(dto.month);
        const monthNumber = this.monthMap[normMonth];
        if (!monthNumber)
            throw new common_1.BadRequestException('Invalid month');
        const financialYear = monthNumber >= 4 ? `${dto.year}-${dto.year + 1}` : `${dto.year - 1}-${dto.year}`;
        await this.payslipRepo.delete({
            employeeId: dto.employeeId,
            month: dto.month,
            year: dto.year
        });
        const salaryData = this.calculateSalary(salary, payableDays, paidDays, bonus);
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
    async update(id, updateData) {
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
    async findOne(id) {
        const payslip = await this.payslipRepo.findOne({ where: { id } });
        if (!payslip)
            throw new common_1.NotFoundException(`Payslip #${id} not found`);
        return payslip;
    }
    async remove(id) {
        const payslip = await this.findOne(id);
        return this.payslipRepo.remove(payslip);
    }
};
exports.PayslipService = PayslipService;
exports.PayslipService = PayslipService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(payslip_entity_1.Payslip)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], PayslipService);
//# sourceMappingURL=payslip.service.js.map