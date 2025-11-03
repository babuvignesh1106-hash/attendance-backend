import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
export declare class AuthService {
    private readonly userService;
    private readonly jwtService;
    constructor(userService: UserService, jwtService: JwtService);
    signup(signupDto: SignupDto): Promise<{
        message: string;
        user: import("../user/user.entity").User;
    }>;
    login(loginDto: LoginDto): Promise<{
        access_token: string;
        user: import("../user/user.entity").User;
    }>;
}
