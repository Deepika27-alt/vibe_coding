import { IsString, IsEmail, IsOptional, MinLength, IsEnum, IsInt, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { UserStatus } from '@prisma/client';

export class CreateUserDto {
  @IsString()
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  department!: string;

  @IsString()
  @MinLength(6)
  password!: string;
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;
}

export class QueryUsersDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;
}
