import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity()
export class Attendance {
  @PrimaryColumn()
  id: number; // Manual ID

  @Column()
  startTime: Date;

  @Column({ type: 'timestamp', nullable: true })
  endTime?: Date;

  // Worked duration (in ms)
  @Column({ type: 'bigint', default: 0 })
  workedDuration: number;

  @Column({ default: 0 })
  breakCount: number;

  @Column({ type: 'bigint', default: 0 })
  totalBreakDuration: number;

  @Column({ nullable: true })
  username: string;
}
