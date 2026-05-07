import { IsString, IsNotEmpty } from 'class-validator';

export class CreateFlowInstanceDto {
  @IsString()
  @IsNotEmpty()
  workflowDefinitionId!: string;
}
