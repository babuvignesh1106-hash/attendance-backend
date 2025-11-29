import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Attendance {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'timestamp' })
  startTime: Date;

  @Column({ type: 'timestamp', nullable: true })
  endTime: Date | null;

  @Column({ type: 'int', default: 0 })
  workedDuration: number; // in seconds

  @Column({ type: 'int', default: 0 })
  breakCount: number;

  @Column({ type: 'int', default: 0 })
  totalBreakDuration: number; // in seconds

  @Column({ type: 'timestamp', nullable: true })
  currentBreakStart: Date | null;

  @Column()
  username: string;
}
