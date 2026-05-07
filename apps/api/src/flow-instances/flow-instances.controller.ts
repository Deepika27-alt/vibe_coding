import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { FlowInstancesService } from './flow-instances.service';
import { CreateFlowInstanceDto } from './dto/create-flow-instance.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { FlowInstanceStatus } from '@prisma/client';

@Controller('instances')
@UseGuards(JwtAuthGuard)
export class FlowInstancesController {
  constructor(private readonly flowInstancesService: FlowInstancesService) {}

  @Post()
  create(@Body() createFlowInstanceDto: CreateFlowInstanceDto, @CurrentUser() user: any) {
    return this.flowInstancesService.create(createFlowInstanceDto, user.id);
  }

  @Get('assigned')
  findAssigned(@CurrentUser() user: any) {
    return this.flowInstancesService.findAssignedTasks(user.id, user.roles);
  }

  @Get()
  findAll(
    @CurrentUser() user: any,
    @Query('status') status?: FlowInstanceStatus,
  ) {
    return this.flowInstancesService.findAllByInitiator(user.id, status);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.flowInstancesService.findOne(id);
  }
}
