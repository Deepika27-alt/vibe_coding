import { IsString, IsOptional, IsArray } from 'class-validator';

export class CreateRoleDto {
  @IsString()
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  canInitiate?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  canAction?: string[];
}
