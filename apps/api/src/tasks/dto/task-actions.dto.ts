import { IsObject, IsOptional, IsString, IsNotEmpty } from 'class-validator';

export class SubmitTaskDto {
  @IsObject()
  @IsNotEmpty()
  formData!: Record<string, any>;
}

export class ApproveTaskDto {
  @IsString()
  @IsOptional()
  comment?: string;
}

export class RejectTaskDto {
  @IsString()
  @IsNotEmpty()
  comment!: string;
}

export class SendbackTaskDto {
  @IsString()
  @IsNotEmpty()
  comment!: string;

  @IsString()
  @IsNotEmpty()
  targetStepId!: string;
}

export class CompleteTaskDto {
  @IsString()
  @IsOptional()
  comment?: string;
}
