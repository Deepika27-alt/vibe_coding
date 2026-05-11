import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards } from '@nestjs/common';
import { WorkflowsService } from './workflows.service';
import { CreateWorkflowDto } from './dto/create-workflow.dto';
import { UpdateWorkflowDto } from './dto/update-workflow.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('workflows')
@UseGuards(JwtAuthGuard, RolesGuard)
export class WorkflowsController {
  constructor(private readonly workflowsService: WorkflowsService) {}

  @Post()
  @Roles('ADMIN', 'PROCESS_OWNER')
  create(@Body() createWorkflowDto: CreateWorkflowDto, @CurrentUser() user: any) {
    return this.workflowsService.create(createWorkflowDto, user.id);
  }

  @Get('catalogue')
  findCatalogue(
    @CurrentUser() user: any,
    @Query('department') department?: string,
  ) {
    return this.workflowsService.findAllInitiable(user.roles, department);
  }

  @Get()
  @Roles('ADMIN', 'PROCESS_OWNER')
  findAll() {
    return this.workflowsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.workflowsService.findOne(id);
  }

  @Patch(':id')
  @Roles('ADMIN', 'PROCESS_OWNER')
  update(@Param('id') id: string, @Body() updateWorkflowDto: UpdateWorkflowDto) {
    return this.workflowsService.update(id, updateWorkflowDto);
  }

  @Post(':id/publish')
  @Roles('ADMIN', 'PROCESS_OWNER')
  publish(@Param('id') id: string) {
    return this.workflowsService.publish(id);
  }

  @Post(':id/archive')
  @Roles('ADMIN', 'PROCESS_OWNER')
  archive(@Param('id') id: string) {
    return this.workflowsService.archive(id);
  }
}
