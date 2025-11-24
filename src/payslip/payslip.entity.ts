import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Payslip {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  employeeId: string;

  @Column()
  employeeName: string;

  @Column()
  designation: string;

  @Column()
  salary: number;

  @Column()
  panCard: string;

  @Column()
  dateOfJoining: Date;

  @Column({ nullable: true })
  bonus?: number;

  @Column()
  month: string;

  @Column()
  year: number;
}
