import { Repository } from 'typeorm';
import { Attendance } from './entities/attendance.entity';
export declare class AttendanceService {
    private readonly repo;
    private readonly logger;
    private readonly IST_OFFSET;
    private readonly DAY_MS;
    constructor(repo: Repository<Attendance>);
    private toISTString;
    private wrap;
    private istDayStartToUTC;
    private istDayEndToUTC;
    private findOpenRecord;
    checkIn(username: string): Promise<{
        startTime: string | null;
        endTime: string | null;
        currentBreakStart: string | null;
        id: number;
        username: string;
        workedDuration: number;
        breakCount: number;
        totalBreakDuration: number;
    }>;
    startBreak(username: string): Promise<{
        startTime: string | null;
        endTime: string | null;
        currentBreakStart: string | null;
        id: number;
        username: string;
        workedDuration: number;
        breakCount: number;
        totalBreakDuration: number;
    }>;
    endBreak(username: string): Promise<{
        startTime: string | null;
        endTime: string | null;
        currentBreakStart: string | null;
        id: number;
        username: string;
        workedDuration: number;
        breakCount: number;
        totalBreakDuration: number;
    }>;
    checkOut(username: string): Promise<{
        startTime: string | null;
        endTime: string | null;
        currentBreakStart: string | null;
        id: number;
        username: string;
        workedDuration: number;
        breakCount: number;
        totalBreakDuration: number;
    }>;
    getAll(): Promise<{
        startTime: string | null;
        endTime: string | null;
        currentBreakStart: string | null;
        id: number;
        username: string;
        workedDuration: number;
        breakCount: number;
        totalBreakDuration: number;
    }[]>;
    autoCheckoutUnclosed(): Promise<{
        closed: number;
    }>;
}
