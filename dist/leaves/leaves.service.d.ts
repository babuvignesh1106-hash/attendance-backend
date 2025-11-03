import { Repository } from 'typeorm';
import { Leave } from './entities/leave.entity';
import { CreateLeaveDto } from './dto/create-leave.dto';
export declare class LeavesService {
    private readonly leaveRepository;
    constructor(leaveRepository: Repository<Leave>);
    create(createLeaveDto: CreateLeaveDto): Promise<Leave>;
    findAll(): Promise<Leave[]>;
}
