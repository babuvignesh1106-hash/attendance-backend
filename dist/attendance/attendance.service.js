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
var AttendanceService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const attendance_entity_1 = require("./entities/attendance.entity");
let AttendanceService = AttendanceService_1 = class AttendanceService {
    repo;
    logger = new common_1.Logger(AttendanceService_1.name);
    IST_OFFSET = 5.5 * 60 * 60 * 1000;
    DAY_MS = 24 * 60 * 60 * 1000;
    constructor(repo) {
        this.repo = repo;
    }
    istDayStartToUTC(date = new Date()) {
        const istMs = date.getTime() + this.IST_OFFSET;
        const istDate = new Date(istMs);
        istDate.setHours(0, 0, 0, 0);
        const utcMs = istDate.getTime() - this.IST_OFFSET;
        return new Date(utcMs);
    }
    istDayEndToUTC(date = new Date()) {
        const startUtc = this.istDayStartToUTC(date);
        return new Date(startUtc.getTime() + this.DAY_MS - 1);
    }
    toIST(date) {
        return new Date(date.getTime() + this.IST_OFFSET);
    }
    convertToIST(att) {
        return {
            ...att,
            startTime: this.toIST(att.startTime),
            endTime: att.endTime ? this.toIST(att.endTime) : null,
            currentBreakStart: att.currentBreakStart
                ? this.toIST(att.currentBreakStart)
                : null,
        };
    }
    async findOpenRecord(username) {
        return this.repo.findOne({
            where: { username, endTime: (0, typeorm_2.IsNull)() },
            order: { startTime: 'DESC' },
        });
    }
    async findTodayRaw(username) {
        const start = this.istDayStartToUTC();
        const end = this.istDayEndToUTC();
        return this.repo.find({
            where: { username, startTime: (0, typeorm_2.Between)(start, end) },
            order: { startTime: 'ASC' },
        });
    }
    async checkIn(username) {
        if (!username)
            throw new common_1.BadRequestException('Username is required');
        const open = await this.findOpenRecord(username);
        if (open) {
            throw new common_1.BadRequestException('You must check out before checking in again');
        }
        const record = await this.repo.save(this.repo.create({
            username,
            startTime: new Date(),
            endTime: null,
            workedDuration: 0,
            breakCount: 0,
            totalBreakDuration: 0,
            currentBreakStart: null,
        }));
        return this.convertToIST(record);
    }
    async startBreak(username) {
        const record = await this.findOpenRecord(username);
        if (!record)
            throw new common_1.BadRequestException('No active session found');
        if (record.currentBreakStart)
            throw new common_1.BadRequestException('Break already running');
        record.currentBreakStart = new Date();
        record.breakCount += 1;
        return this.convertToIST(await this.repo.save(record));
    }
    async endBreak(username) {
        const record = await this.findOpenRecord(username);
        if (!record)
            throw new common_1.BadRequestException('No active session found');
        if (!record.currentBreakStart)
            throw new common_1.BadRequestException('No active break');
        const now = new Date();
        const breakSeconds = Math.round((now.getTime() - record.currentBreakStart.getTime()) / 1000);
        record.totalBreakDuration += breakSeconds > 0 ? breakSeconds : 0;
        record.currentBreakStart = null;
        return this.convertToIST(await this.repo.save(record));
    }
    async checkOut(username) {
        const record = await this.findOpenRecord(username);
        if (!record)
            throw new common_1.BadRequestException('No active session found');
        const now = new Date();
        if (record.currentBreakStart) {
            const breakSeconds = Math.round((now.getTime() - record.currentBreakStart.getTime()) / 1000);
            record.totalBreakDuration += breakSeconds > 0 ? breakSeconds : 0;
            record.currentBreakStart = null;
        }
        const rawWorked = Math.round((now.getTime() - record.startTime.getTime()) / 1000);
        record.endTime = now;
        record.workedDuration =
            rawWorked - record.totalBreakDuration > 0
                ? rawWorked - record.totalBreakDuration
                : 0;
        return this.convertToIST(await this.repo.save(record));
    }
    async getAll() {
        const records = await this.repo.find({ order: { startTime: 'DESC' } });
        return records.map((r) => this.convertToIST(r));
    }
    async autoCheckoutUnclosed() {
        this.logger.log('Running auto-checkout...');
        const openSessions = await this.repo.find({
            where: { endTime: (0, typeorm_2.IsNull)() },
        });
        const todayStartUtc = this.istDayStartToUTC();
        let count = 0;
        for (const r of openSessions) {
            const recordIstStartDayMs = Math.floor((r.startTime.getTime() + this.IST_OFFSET) / this.DAY_MS) *
                this.DAY_MS -
                this.IST_OFFSET;
            const recordStartUtc = new Date(recordIstStartDayMs);
            if (recordStartUtc.getTime() < todayStartUtc.getTime()) {
                const endUtc = new Date(recordStartUtc.getTime() + this.DAY_MS - 1);
                if (r.currentBreakStart) {
                    const breakSeconds = Math.round((endUtc.getTime() - r.currentBreakStart.getTime()) / 1000);
                    r.totalBreakDuration += breakSeconds > 0 ? breakSeconds : 0;
                    r.currentBreakStart = null;
                }
                const rawWorked = Math.round((endUtc.getTime() - r.startTime.getTime()) / 1000);
                r.endTime = endUtc;
                r.workedDuration =
                    rawWorked - r.totalBreakDuration > 0
                        ? rawWorked - r.totalBreakDuration
                        : 0;
                await this.repo.save(r);
                count++;
            }
        }
        this.logger.log(`Auto-checked-out ${count} sessions`);
        return { closed: count };
    }
};
exports.AttendanceService = AttendanceService;
exports.AttendanceService = AttendanceService = AttendanceService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(attendance_entity_1.Attendance)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], AttendanceService);
//# sourceMappingURL=attendance.service.js.map