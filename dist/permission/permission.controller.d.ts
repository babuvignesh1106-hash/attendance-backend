import { PermissionService } from './permission.service';
import { Permission } from '../permission/entities/permission.entity';
export declare class PermissionController {
    private readonly permissionService;
    constructor(permissionService: PermissionService);
    create(data: Partial<Permission>): Promise<Permission>;
    findAll(): Promise<Permission[]>;
}
