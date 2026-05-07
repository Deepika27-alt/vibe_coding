import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto, QueryUsersDto } from './dto/user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles('ADMIN')
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @Roles('ADMIN')
  findAll(@Query() query: QueryUsersDto) {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @Roles('ADMIN')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  @Post('bulk-import')
  @Roles('ADMIN')
  @UseInterceptors(FileInterceptor('file'))
  bulkImport(@UploadedFile() file: Express.Multer.File) {
    return this.usersService.bulkImport(file.buffer);
  }

  @Post(':id/roles')
  @Roles('ADMIN')
  assignRole(@Param('id') id: string, @Body('roleId') roleId: string) {
    return this.usersService.assignRole(id, roleId);
  }

  @Delete(':id/roles/:roleId')
  @Roles('ADMIN')
  removeRole(@Param('id') id: string, @Param('roleId') roleId: string) {
    return this.usersService.removeRole(id, roleId);
  }
}
