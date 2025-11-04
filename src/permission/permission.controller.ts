import { Controller, Post, Body, Get } from '@nestjs/common';
import { PermissionService } from './permission.service';
import { Permission } from '../permission/entities/permission.entity';

@Controller('permission')
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}

  @Post()
  create(@Body() data: Partial<Permission>) {
    return this.permissionService.create(data);
  }

  @Get()
  findAll() {
    return this.permissionService.findAll();
  }
}
