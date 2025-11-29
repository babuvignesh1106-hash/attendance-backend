import { AttendanceService } from './attendance.service';
export declare class AttendanceController {
    private readonly attendanceService;
    constructor(attendanceService: AttendanceService);
    checkIn(username: string): Promise<import("./entities/attendance.entity").Attendance>;
    checkOut(username: string): Promise<import("./entities/attendance.entity").Attendance>;
    getAll(): Promise<import("./entities/attendance.entity").Attendance[]>;
}
