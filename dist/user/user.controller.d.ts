import { UserService } from './user.service';
import { User } from './user.entity';
export declare class UserController {
    private readonly userService;
    constructor(userService: UserService);
    createUser(body: Partial<User>): Promise<User>;
    getAllUsers(): Promise<any[]>;
}
