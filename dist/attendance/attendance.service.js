"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const attendance_entity_1 = require("./entities/attendance.entity");
let AttendanceService = class AttendanceService {
    attendanceRepo;
    constructor(attendanceRepo) {
        this.attendanceRepo = attendanceRepo;
    }
    async createAttendance(data) {
        if (data.startTime)
            data.startTime = new Date(data.startTime);
        if (data.endTime)
            data.endTime = new Date(data.endTime);
        const lastRecord = await this.attendanceRepo
            .createQueryBuilder('attendance')
            .select('MAX(attendance.id)', 'max')
            .getRawOne();
        const nextId = lastRecord?.max ? Number(lastRecord.max) + 1 : 1;
        data.id = nextId;
        if (!data.username) {
            data.username = 'unknown';
        }
        const record = this.attendanceRepo.create(data);
        return this.attendanceRepo.save(record);
    }
    async getAllAttendance() {
        return this.attendanceRepo.find();
    }
};
exports.AttendanceService = AttendanceService;
exports.AttendanceService = AttendanceService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(attendance_entity_1.Attendance)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], AttendanceService);
//# sourceMappingURL=attendance.service.js.map