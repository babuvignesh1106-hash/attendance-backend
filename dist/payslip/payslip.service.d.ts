import { Repository } from 'typeorm';
import { Payslip } from './payslip.entity';
import { CreatePayslipDto } from './dto/create-payslip.dto';
export declare class PayslipService {
    private payslipRepo;
    constructor(payslipRepo: Repository<Payslip>);
    private monthMap;
    private normalizeMonth;
    private getPreviousYTDSummary;
    private calculateSalary;
    create(dto: CreatePayslipDto): Promise<Payslip>;
    update(id: number, updateData: Partial<CreatePayslipDto>): Promise<Payslip>;
    findAll(): Promise<Payslip[]>;
    findOne(id: number): Promise<Payslip>;
    remove(id: number): Promise<Payslip>;
}
