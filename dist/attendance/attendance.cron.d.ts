import { AttendanceService } from './attendance.service';
export declare class AttendanceCron {
    private readonly svc;
    constructor(svc: AttendanceService);
    handleMidnight(): Promise<void>;
}
