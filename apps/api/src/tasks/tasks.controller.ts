import { Controller, Get, Post, Body, Param, UseGuards, ForbiddenException } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { 
  SubmitTaskDto, 
  ApproveTaskDto, 
  RejectTaskDto, 
  SendbackTaskDto, 
  CompleteTaskDto 
} from './dto/task-actions.dto';

@ApiTags('Tasks')
@ApiBearerAuth()
@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @ApiOperation({ summary: 'Get current user inbox' })
  @Get('pending')
  findInbox(@CurrentUser() user: any) {
    return this.tasksService.findUserInbox(user);
  }

  @ApiOperation({ summary: 'Get task details by ID' })
  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.tasksService.findOne(id, user);
  }

  @ApiOperation({ summary: 'Submit form data for a task' })
  @Post(':id/submit')
  submit(@Param('id') id: string, @Body() dto: SubmitTaskDto, @CurrentUser() user: any) {
    return this.tasksService.submitTask(id, dto, user);
  }

  @ApiOperation({ summary: 'Approve an approval task' })
  @Post(':id/approve')
  approve(@Param('id') id: string, @Body() dto: ApproveTaskDto, @CurrentUser() user: any) {
    return this.tasksService.approveTask(id, dto, user);
  }

  @ApiOperation({ summary: 'Reject an approval task' })
  @Post(':id/reject')
  reject(@Param('id') id: string, @Body() dto: RejectTaskDto, @CurrentUser() user: any) {
    return this.tasksService.rejectTask(id, dto, user);
  }

  @ApiOperation({ summary: 'Send task back to a previous step' })
  @Post(':id/sendback')
  sendback(@Param('id') id: string, @Body() dto: SendbackTaskDto, @CurrentUser() user: any) {
    return this.tasksService.sendbackTask(id, dto, user);
  }

  @ApiOperation({ summary: 'Mark a manual task as complete' })
  @Post(':id/complete')
  complete(@Param('id') id: string, @Body() dto: CompleteTaskDto, @CurrentUser() user: any) {
    return this.tasksService.completeTask(id, dto, user);
  }
}
