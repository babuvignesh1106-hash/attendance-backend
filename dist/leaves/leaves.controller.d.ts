import { LeavesService } from './leaves.service';
import { CreateLeaveDto } from './dto/create-leave.dto';
export declare class LeavesController {
    private readonly leavesService;
    constructor(leavesService: LeavesService);
    create(createLeaveDto: CreateLeaveDto): Promise<import("./entities/leave.entity").Leave>;
    findAll(): Promise<import("./entities/leave.entity").Leave[]>;
}
