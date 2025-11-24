import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TeamModule } from './team/team.module';
import { Team } from './team/entities/team.entity';
import { TeamMember } from './team/entities/team-member.entity';
import { AttendanceModule } from './attendance/attendance.module';
import { Attendance } from './attendance/entities/attendance.entity';
import { AuthModule } from './auth/auth.module';
import { User } from './user/user.entity';
import { LeavesModule } from './leaves/leaves.module';
import { Leave } from './leaves/entities/leave.entity';
import { PermissionModule } from './permission/permission.module';
import { Permission } from './permission/entities/permission.entity';
import { LeaveBalance } from './leaves/entities/leave-balance.entity';
import { LeaveRequest } from './leaves/entities/leave-request.entity';
import { PayslipModule } from './payslip/payslip.module';
import { Payslip } from './payslip/payslip.entity';
import { StaffModule } from './staff/staff.module';
import { Staff } from './staff/entities/staff.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), // loads .env globally

    // async config for TypeORM (reads env dynamically)
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
          rejectUnauthorized: false, // required for Neon/Supabase SSL
        },
        synchronize: true, // ⚠️ only for dev; use migrations in prod
      }),
    }),

    TeamModule,
    AttendanceModule,
    LeavesModule,
    AuthModule,
    PermissionModule,
    PayslipModule,
    StaffModule,
    StaffModule,
    // your custom module
  ],
})
export class AppModule {}
