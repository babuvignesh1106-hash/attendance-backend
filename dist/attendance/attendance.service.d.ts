import { Repository } from 'typeorm';
import { Attendance } from './entities/attendance.entity';
export declare class AttendanceService {
    private readonly repo;
    private readonly logger;
    constructor(repo: Repository<Attendance>);
    private findActiveSession;
    checkIn(username: string): Promise<Attendance>;
    startBreak(username: string): Promise<Attendance>;
    endBreak(username: string): Promise<Attendance>;
    checkOut(username: string): Promise<Attendance>;
    getAll(): Promise<Attendance[]>;
    autoCheckoutUnclosed(): Promise<{
        closed: number;
    }>;
}
