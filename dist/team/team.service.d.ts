import { Repository } from 'typeorm';
import { Team } from './entities/team.entity';
import { TeamMember } from './entities/team-member.entity';
import { CreateTeamDto } from './dto/create-team.dto';
export declare class TeamService {
    private teamRepository;
    private memberRepository;
    constructor(teamRepository: Repository<Team>, memberRepository: Repository<TeamMember>);
    createTeam(dto: CreateTeamDto): Promise<Team>;
    getAllTeams(): Promise<Team[]>;
}
