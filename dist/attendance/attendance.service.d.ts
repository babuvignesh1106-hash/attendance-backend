import { Repository } from 'typeorm';
import { Attendance } from './entities/attendance.entity';
export declare class AttendanceService {
    private readonly attendanceRepo;
    constructor(attendanceRepo: Repository<Attendance>);
    createAttendance(data: Partial<Attendance>): Promise<Attendance>;
    getAllAttendance(): Promise<Attendance[]>;
}
