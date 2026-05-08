import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto, UpdateUserDto, QueryUsersDto } from './dto/user.dto';
import { UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { NotificationDispatcher } from '../notifications/notification-dispatcher.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationDispatcher: NotificationDispatcher,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });
    if (existing) {
      throw new ConflictException('Email already in use');
    }

    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(createUserDto.password, salt);

    const user = await this.prisma.user.create({
      data: {
        name: createUserDto.name,
        email: createUserDto.email,
        department: createUserDto.department,
        passwordHash,
      },
    });

    // Exclude passwordHash from returned user
    const { passwordHash: _, ...result } = user;
    return result;
  }

  async findAll(query: QueryUsersDto) {
    const { page = 1, limit = 10, department, status } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (department) where.department = department;
    if (status) where.status = status;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          name: true,
          department: true,
          status: true,
          createdAt: true,
          roles: {
            include: { role: true }
          }
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        roles: {
          include: { role: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const { passwordHash, ...result } = user;
    return result;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    try {
      const user = await this.prisma.user.update({
        where: { id },
        data: updateUserDto,
      });
      const { passwordHash, ...result } = user;
      return result;
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`User with ID ${id} not found`);
      }
      throw error;
    }
  }

  async remove(id: string) {
    try {
      const user = await this.prisma.user.update({
        where: { id },
        data: { status: UserStatus.INACTIVE },
      });
      const { passwordHash, ...result } = user;
      return result;
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`User with ID ${id} not found`);
      }
      throw error;
    }
  }

  async assignRole(userId: string, roleId: string) {
    // Check if user and role exist
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException(`User with ID ${userId} not found`);

    const role = await this.prisma.role.findUnique({ where: { id: roleId } });
    if (!role) throw new NotFoundException(`Role with ID ${roleId} not found`);

    try {
      await this.prisma.userRole.create({
        data: { userId, roleId },
      });
      return { success: true };
    } catch (error: any) {
      if (error.code === 'P2002') {
        // Already assigned
        return { success: true };
      }
      throw error;
    }
  }

  async removeRole(userId: string, roleId: string) {
    try {
      await this.prisma.userRole.delete({
        where: {
          userId_roleId: { userId, roleId },
        },
      });
      return { success: true };
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`UserRole not found`);
      }
      throw error;
    }
  }

  async bulkImport(fileBuffer: Buffer) {
    const csvString = fileBuffer.toString('utf-8');
    const lines = csvString.split(/\r?\n/).filter((line) => line.trim() !== '');
    if (lines.length === 0) {
      return { created: 0, skipped: 0, errors: ['Empty CSV file'] };
    }

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const nameIdx = headers.indexOf('name');
    const emailIdx = headers.indexOf('email');
    const deptIdx = headers.indexOf('department');

    if (nameIdx === -1 || emailIdx === -1 || deptIdx === -1) {
      return { created: 0, skipped: 0, errors: ['Missing required columns: name, email, department'] };
    }

    let created = 0;
    let skipped = 0;
    const errors: string[] = [];

    const salt = await bcrypt.genSalt();
    // Default password for bulk imported users, or generate random
    const defaultPasswordHash = await bcrypt.hash('TempPass123!', salt);

    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',').map((p) => p.trim());
      if (parts.length < headers.length) {
        errors.push(`Row ${i + 1}: Malformed row`);
        skipped++;
        continue;
      }

      const name = parts[nameIdx];
      const email = parts[emailIdx];
      const department = parts[deptIdx];

      try {
        const existing = await this.prisma.user.findUnique({ where: { email } });
        if (existing) {
          skipped++;
          continue;
        }

        const user = await this.prisma.user.create({
          data: {
            name,
            email,
            department,
            passwordHash: defaultPasswordHash,
          },
        });
        created++;

        // Dispatch notification for sending email
        await this.notificationDispatcher.dispatch('user.invited', {
          userId: user.id,
          email: user.email,
          name: user.name,
        });
      } catch (error: any) {
        errors.push(`Row ${i + 1}: ${error.message}`);
        skipped++;
      }
    }

    return { created, skipped, errors };
  }
}
