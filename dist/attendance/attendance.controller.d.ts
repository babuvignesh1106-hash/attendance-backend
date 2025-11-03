import { AttendanceService } from './attendance.service';
import { Attendance } from './entities/attendance.entity';
export declare class AttendanceController {
    private readonly attendanceService;
    constructor(attendanceService: AttendanceService);
    create(attendanceData: Partial<Attendance>): Promise<Attendance>;
    getAll(): Promise<Attendance[]>;
}
