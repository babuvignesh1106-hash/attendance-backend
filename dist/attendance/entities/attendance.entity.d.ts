export declare class Attendance {
    id: number;
    startTime: Date;
    endTime: Date | null;
    workedDuration: number;
    breakCount: number;
    totalBreakDuration: number;
    currentBreakStart: Date | null;
    username: string;
}
