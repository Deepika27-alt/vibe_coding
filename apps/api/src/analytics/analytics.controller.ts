import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overview')
  async getOverview(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const { fromDate, toDate } = this.parseDates(from, to);
    return this.analyticsService.getOverview(fromDate, toDate);
  }

  @Get('workflows')
  async getWorkflowStats(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const { fromDate, toDate } = this.parseDates(from, to);
    return this.analyticsService.getWorkflowStats(fromDate, toDate);
  }

  @Get('steps')
  async getStepStats(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const { fromDate, toDate } = this.parseDates(from, to);
    return this.analyticsService.getStepStats(fromDate, toDate);
  }

  private parseDates(from?: string, to?: string) {
    const toDate = to ? new Date(to) : new Date();
    const fromDate = from ? new Date(from) : new Date(new Date().setDate(toDate.getDate() - 30));
    return { fromDate, toDate };
  }
}
