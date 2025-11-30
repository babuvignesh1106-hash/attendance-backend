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
    constructor(repo) {
        this.repo = repo;
    }
    startOfDay(date = new Date()) {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        return d;
    }
    endOfDay(date = new Date()) {
        const d = new Date(date);
        d.setHours(23, 59, 59, 999);
        return d;
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
    async findTodayRaw(username) {
        const start = this.startOfDay();
        const end = this.endOfDay();
        return this.repo.findOne({
            where: { username, startTime: (0, typeorm_2.Between)(start, end) },
        });
    }
    async checkIn(username) {
        if (!username)
            throw new common_1.BadRequestException('Username is required');
        const existing = await this.findTodayRaw(username);
        if (existing)
            throw new common_1.BadRequestException('Already checked in today');
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
        const record = await this.findTodayRaw(username);
        if (!record)
            throw new common_1.BadRequestException('No check-in found today');
        if (record.currentBreakStart)
            throw new common_1.BadRequestException('Break already started');
        record.currentBreakStart = new Date();
        record.breakCount += 1;
        return this.convertToIST(await this.repo.save(record));
    }
    async endBreak(username) {
        const record = await this.findTodayRaw(username);
        if (!record)
            throw new common_1.BadRequestException('No check-in found today');
        if (!record.currentBreakStart)
            throw new common_1.BadRequestException('No active break');
        const now = new Date();
        const breakSeconds = Math.round((now.getTime() - record.currentBreakStart.getTime()) / 1000);
        record.totalBreakDuration += breakSeconds;
        record.currentBreakStart = null;
        return this.convertToIST(await this.repo.save(record));
    }
    async checkOut(username) {
        const record = await this.findTodayRaw(username);
        if (!record)
            throw new common_1.BadRequestException('Not checked in today');
        if (record.endTime)
            throw new common_1.BadRequestException('Already checked out');
        const now = new Date();
        if (record.currentBreakStart) {
            const breakSeconds = Math.round((now.getTime() - record.currentBreakStart.getTime()) / 1000);
            record.totalBreakDuration += breakSeconds;
            record.currentBreakStart = null;
        }
        const rawWorkedSeconds = Math.round((now.getTime() - record.startTime.getTime()) / 1000);
        record.endTime = now;
        record.workedDuration = rawWorkedSeconds - record.totalBreakDuration;
        return this.convertToIST(await this.repo.save(record));
    }
    async getAll() {
        const records = await this.repo.find({ order: { startTime: 'DESC' } });
        return records.map((r) => this.convertToIST(r));
    }
    async autoCheckoutUnclosed() {
        this.logger.log('Running auto-checkout cron');
        const openRecords = await this.repo.find({ where: { endTime: (0, typeorm_2.IsNull)() } });
        const ops = [];
        const todayStart = this.startOfDay();
        for (const r of openRecords) {
            const recordStartDay = this.startOfDay(r.startTime);
            if (recordStartDay.getTime() < todayStart.getTime()) {
                const end = this.endOfDay(r.startTime);
                if (r.currentBreakStart) {
                    const breakSeconds = Math.round((end.getTime() - r.currentBreakStart.getTime()) / 1000);
                    r.totalBreakDuration += breakSeconds;
                    r.currentBreakStart = null;
                }
                const rawWorkedSeconds = Math.round((end.getTime() - r.startTime.getTime()) / 1000);
                r.endTime = end;
                r.workedDuration = rawWorkedSeconds - r.totalBreakDuration;
                ops.push(this.repo.save(r));
            }
        }
        await Promise.all(ops);
        this.logger.log(`Auto-checked-out ${ops.length} records`);
        return { closed: ops.length };
    }
};
exports.AttendanceService = AttendanceService;
exports.AttendanceService = AttendanceService = AttendanceService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(attendance_entity_1.Attendance)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], AttendanceService);
//# sourceMappingURL=attendance.service.js.map