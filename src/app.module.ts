import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';

import { TeamModule } from './team/team.module';
import { AttendanceModule } from './attendance/attendance.module';
import { AuthModule } from './auth/auth.module';
import { LeavesModule } from './leaves/leaves.module';
import { PermissionModule } from './permission/permission.module';
import { PayslipModule } from './payslip/payslip.module';
import { StaffModule } from './staff/staff.module';

import { Team } from './team/entities/team.entity';
import { TeamMember } from './team/entities/team-member.entity';
import { Attendance } from './attendance/entities/attendance.entity';
import { User } from './user/user.entity';
import { Leave } from './leaves/entities/leave.entity';
import { LeaveBalance } from './leaves/entities/leave-balance.entity';
import { LeaveRequest } from './leaves/entities/leave-request.entity';
import { Permission } from './permission/entities/permission.entity';
import { Payslip } from './payslip/payslip.entity';
import { Staff } from './staff/entities/staff.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    // ✅ REQUIRED for cron
    ScheduleModule.forRoot(),

    // ✅ Correct TypeORM async config
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get<string>('DATABASE_URL'),
        entities: [
          Team,
          TeamMember,
          Attendance,
          User,
          Leave,
          LeaveRequest,
          LeaveBalance,
          Permission,
          Payslip,
          Staff,
        ],
        ssl: {
          rejectUnauthorized: false,
        },
        synchronize: true, // ⚠️ dev only
      }),
    }),

    TeamModule,
    AttendanceModule,
    LeavesModule,
    AuthModule,
    PermissionModule,
    PayslipModule,
    StaffModule,
  ],
})
export class AppModule {}
