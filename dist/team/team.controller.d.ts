import { TeamService } from './team.service';
import { CreateTeamDto } from './dto/create-team.dto';
export declare class TeamController {
    private readonly teamService;
    constructor(teamService: TeamService);
    createTeam(dto: CreateTeamDto): Promise<import("./entities/team.entity").Team>;
    getAllTeams(): Promise<import("./entities/team.entity").Team[]>;
}
