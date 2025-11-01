// src/team/team.controller.ts
import { Controller, Post, Body, Get } from '@nestjs/common';
import { TeamService } from './team.service';
import { CreateTeamDto } from './dto/create-team.dto';

@Controller('team')
export class TeamController {
  constructor(private readonly teamService: TeamService) {}

  @Post()
  createTeam(@Body() dto: CreateTeamDto) {
    return this.teamService.createTeam(dto);
  }

  @Get()
  getAllTeams() {
    return this.teamService.getAllTeams();
  }
}
