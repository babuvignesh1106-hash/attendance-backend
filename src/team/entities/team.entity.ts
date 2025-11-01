// src/team/team.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { TeamMember } from './team-member.entity';

@Entity()
export class Team {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @OneToMany(() => TeamMember, (member) => member.team, { cascade: true })
  members: TeamMember[];
}
