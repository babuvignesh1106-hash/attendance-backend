import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Attendance {
  @PrimaryGeneratedColumn()
  id: number;

  // Use timestamptz so Postgres stores timezone-aware timestamps (UTC by default)
  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  startTime: Date;

  @Column({ type: 'timestamptz', nullable: true })
  endTime: Date | null;

  // workedDuration and totalBreakDuration stored in seconds (integers)
  @Column({ type: 'int', default: 0 })
  workedDuration: number;

  @Column({ type: 'int', default: 0 })
  breakCount: number;

  @Column({ type: 'int', default: 0 })
  totalBreakDuration: number;

  @Column({ type: 'timestamptz', nullable: true })
  currentBreakStart: Date | null;

  @Column()
  username: string;
}
