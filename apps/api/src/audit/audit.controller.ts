import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

@ApiTags('Admin / Audit')
@ApiBearerAuth()
@Controller('admin/audit')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @ApiOperation({ summary: 'Get preview of audit logs' })
  @Get('preview')
  async getPreview(
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('workflowId') workflowId?: string,
  ) {
    return this.auditService.getPreview(new Date(from), new Date(to), workflowId);
  }

  @ApiOperation({ summary: 'Export audit logs as CSV or JSON' })
  @ApiQuery({ name: 'format', enum: ['csv', 'json'], required: false })
  @Get('export')
  async export(
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('format') format: 'csv' | 'json' = 'csv',
    @Query('workflowId') workflowId: string,
    @CurrentUser() user: any,
    @Res() res: Response,
  ) {
    const stream = await this.auditService.exportLogs(
      new Date(from),
      new Date(to),
      user.id,
      workflowId,
      format,
    );

    const filename = `audit-log-\${new Date().toISOString().split('T')[0]}.\${format}`;
    const contentType = format === 'csv' ? 'text/csv' : 'application/json';

    res.set({
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="\${filename}"`,
    });

    stream.pipe(res);
  }
}
