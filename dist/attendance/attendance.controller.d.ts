import { AttendanceService } from './attendance.service';
import { Attendance } from './entities/attendance.entity';
export declare class AttendanceController {
    private readonly attendanceService;
    constructor(attendanceService: AttendanceService);
    checkIn(username: string): Promise<Attendance>;
    startBreak(username: string): Promise<Attendance>;
    endBreak(username: string): Promise<Attendance>;
    checkOut(username: string): Promise<Attendance>;
    getAll(): Promise<Attendance[]>;
    autoCheckout(): Promise<{
        closed: number;
    }>;
}
