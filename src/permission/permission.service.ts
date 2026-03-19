import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission } from '../permission/entities/permission.entity';

@Injectable()
export class PermissionService {
  constructor(
    @InjectRepository(Permission)
    private permissionRepo: Repository<Permission>,
  ) {}

  create(data: Partial<Permission>) {
    const newPermission = this.permissionRepo.create(data);
    return this.permissionRepo.save(newPermission);
  }

  findAll() {
    return this.permissionRepo.find();
  }
}
