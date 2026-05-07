import { IsString, IsOptional, IsObject } from 'class-validator';

export class CreateWorkflowDto {
  @IsString()
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  department!: string;

  @IsObject()
  graph!: Record<string, any>;
}
