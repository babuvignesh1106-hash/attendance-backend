import { Repository } from 'typeorm';
import { Attendance } from './entities/attendance.entity';
export declare class AttendanceService {
    private readonly repo;
    private readonly logger;
    private readonly IST_OFFSET;
    constructor(repo: Repository<Attendance>);
    private startOfDay;
    private endOfDay;
    private toIST;
    private convertToIST;
    private findTodayRaw;
    checkIn(username: string): Promise<Attendance>;
    startBreak(username: string): Promise<Attendance>;
    endBreak(username: string): Promise<Attendance>;
    checkOut(username: string): Promise<Attendance>;
    getAll(): Promise<Attendance[]>;
    autoCheckoutUnclosed(): Promise<{
        closed: number;
    }>;
}
