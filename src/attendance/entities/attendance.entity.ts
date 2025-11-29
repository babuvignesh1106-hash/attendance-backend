import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity()
export class Attendance {
  @PrimaryColumn()
  id: number;

  @Column()
  startTime: Date;

  @Column({ type: 'timestamp', nullable: true })
  endTime?: Date;

  @Column({ type: 'int', default: 0 }) // ✅ default 0
  workedDuration: number;

  @Column({ type: 'int', default: 0 })
  breakCount: number;

  @Column({ type: 'int', default: 0 })
  totalBreakDuration: number;

  @Column({ nullable: true })
  username: string;
}
