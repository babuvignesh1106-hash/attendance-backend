import { Repository } from 'typeorm';
import { Permission } from '../permission/entities/permission.entity';
export declare class PermissionService {
    private permissionRepo;
    constructor(permissionRepo: Repository<Permission>);
    create(data: Partial<Permission>): Promise<Permission>;
    findAll(): Promise<Permission[]>;
}
