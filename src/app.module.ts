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

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), // loads .env globally

    // async config for TypeORM (reads env dynamically)
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST'),
        port: config.get<number>('DB_PORT'),
        username: config.get<string>('DB_USERNAME'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_NAME'),
        entities: [Team, TeamMember, Attendance, User],
        synchronize: true, // auto sync DB tables (dev only)
      }),
    }),

    TeamModule,
    AttendanceModule,
    AuthModule,
    // your custom module
  ],
})
export class AppModule {}
