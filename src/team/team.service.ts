// src/team/team.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Team } from './entities/team.entity';
import { TeamMember } from './entities/team-member.entity';
import { CreateTeamDto } from './dto/create-team.dto';

@Injectable()
export class TeamService {
  constructor(
    @InjectRepository(Team)
    private teamRepository: Repository<Team>,
    @InjectRepository(TeamMember)
    private memberRepository: Repository<TeamMember>,
  ) {}

  // src/team/team.service.ts
  async createTeam(dto: CreateTeamDto) {
    const team = this.teamRepository.create({ name: dto.name });

    // Extract the name from each member object
    team.members = dto.members.map((member) =>
      this.memberRepository.create({ name: member.name }),
    );

    return this.teamRepository.save(team);
  }

  async getAllTeams() {
    return this.teamRepository.find({ relations: ['members'] });
  }
}
