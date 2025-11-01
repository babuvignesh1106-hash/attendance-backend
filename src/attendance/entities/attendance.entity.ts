import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity()
export class Attendance {
  @PrimaryColumn()
  id: number; // We will generate this manually

  @Column()
  startTime: Date;

  @Column({ type: 'timestamp', nullable: true })
  endTime?: Date;

  @Column()
  workedDuration: number;

  @Column()
  breakCount: number;

  @Column()
  totalBreakDuration: number;

  // ✅ Added username column (nullable to prevent errors with existing data)
  @Column({ nullable: true })
  username: string;
}
