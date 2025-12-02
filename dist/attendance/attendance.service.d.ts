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
        workedDuration: number;
        breakCount: number;
        totalBreakDuration: number;
        username: string;
    }>;
    startBreak(username: string): Promise<{
        startTime: string | null;
        endTime: string | null;
        currentBreakStart: string | null;
        id: number;
        workedDuration: number;
        breakCount: number;
        totalBreakDuration: number;
        username: string;
    }>;
    endBreak(username: string): Promise<{
        startTime: string | null;
        endTime: string | null;
        currentBreakStart: string | null;
        id: number;
        workedDuration: number;
        breakCount: number;
        totalBreakDuration: number;
        username: string;
    }>;
    checkOut(username: string): Promise<{
        startTime: string | null;
        endTime: string | null;
        currentBreakStart: string | null;
        id: number;
        workedDuration: number;
        breakCount: number;
        totalBreakDuration: number;
        username: string;
    }>;
    getAll(): Promise<{
        startTime: string | null;
        endTime: string | null;
        currentBreakStart: string | null;
        id: number;
        workedDuration: number;
        breakCount: number;
        totalBreakDuration: number;
        username: string;
    }[]>;
    autoCheckoutUnclosed(): Promise<{
        closed: number;
    }>;
}
