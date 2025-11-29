import { Repository } from 'typeorm';
import { Attendance } from './entities/attendance.entity';
export declare class AttendanceService {
    private readonly attendanceRepo;
    constructor(attendanceRepo: Repository<Attendance>);
    checkIn(username: string): Promise<Attendance>;
    checkOut(username: string): Promise<Attendance>;
    getAllAttendance(): Promise<Attendance[]>;
}
