import { Controller, Get, Post, Body, Param, UseGuards, ForbiddenException } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { 
  SubmitTaskDto, 
  ApproveTaskDto, 
  RejectTaskDto, 
  SendbackTaskDto, 
  CompleteTaskDto 
} from './dto/task-actions.dto';

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  findInbox(@CurrentUser() user: any) {
    return this.tasksService.findUserInbox(user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.tasksService.findOne(id, user);
  }

  @Post(':id/submit')
  submit(@Param('id') id: string, @Body() dto: SubmitTaskDto, @CurrentUser() user: any) {
    return this.tasksService.submitTask(id, dto, user);
  }

  @Post(':id/approve')
  approve(@Param('id') id: string, @Body() dto: ApproveTaskDto, @CurrentUser() user: any) {
    return this.tasksService.approveTask(id, dto, user);
  }

  @Post(':id/reject')
  reject(@Param('id') id: string, @Body() dto: RejectTaskDto, @CurrentUser() user: any) {
    return this.tasksService.rejectTask(id, dto, user);
  }

  @Post(':id/sendback')
  sendback(@Param('id') id: string, @Body() dto: SendbackTaskDto, @CurrentUser() user: any) {
    return this.tasksService.sendbackTask(id, dto, user);
  }

  @Post(':id/complete')
  complete(@Param('id') id: string, @Body() dto: CompleteTaskDto, @CurrentUser() user: any) {
    return this.tasksService.completeTask(id, dto, user);
  }
}
