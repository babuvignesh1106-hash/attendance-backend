import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
} from '@nestjs/common';
import { PayslipService } from './payslip.service';
import { CreatePayslipDto } from './dto/create-payslip.dto';

@Controller('payslip')
export class PayslipController {
  constructor(private readonly payslipService: PayslipService) {}

  // ✅ CREATE
  @Post()
  create(@Body() createPayslipDto: CreatePayslipDto) {
    return this.payslipService.create(createPayslipDto);
  }

  // ✅ GET ALL
  @Get()
  findAll() {
    return this.payslipService.findAll();
  }

  // ✅ GET ONE BY ID
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.payslipService.findOne(+id);
  }

  // ✅ UPDATE
  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateData: Partial<CreatePayslipDto>,
  ) {
    return this.payslipService.update(+id, updateData);
  }

  // ✅ DELETE
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.payslipService.remove(+id);
  }
}
