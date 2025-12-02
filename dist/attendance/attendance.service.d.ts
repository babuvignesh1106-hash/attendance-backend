import { Repository } from 'typeorm';
import { Attendance } from './entities/attendance.entity';
export declare class AttendanceService {
    private readonly repo;
    private readonly logger;
    private readonly DAY_MS;
    constructor(repo: Repository<Attendance>);
    private entityToPayload;
    private findOpenRecord;
    checkIn(username: string): Promise<{
        id: number;
        username: string;
        startTime: string | null;
        endTime: string | null;
        workedDuration: number;
        breakCount: number;
        totalBreakDuration: number;
        currentBreakStart: string | null;
    }>;
    startBreak(username: string): Promise<{
        id: number;
        username: string;
        startTime: string | null;
        endTime: string | null;
        workedDuration: number;
        breakCount: number;
        totalBreakDuration: number;
        currentBreakStart: string | null;
    }>;
    endBreak(username: string): Promise<{
        id: number;
        username: string;
        startTime: string | null;
        endTime: string | null;
        workedDuration: number;
        breakCount: number;
        totalBreakDuration: number;
        currentBreakStart: string | null;
    }>;
    checkOut(username: string): Promise<{
        id: number;
        username: string;
        startTime: string | null;
        endTime: string | null;
        workedDuration: number;
        breakCount: number;
        totalBreakDuration: number;
        currentBreakStart: string | null;
    }>;
    getAll(): Promise<{
        id: number;
        username: string;
        startTime: string | null;
        endTime: string | null;
        workedDuration: number;
        breakCount: number;
        totalBreakDuration: number;
        currentBreakStart: string | null;
    }[]>;
    autoCheckoutUnclosed(): Promise<{
        closed: number;
    }>;
}
