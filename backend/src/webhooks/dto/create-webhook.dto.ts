import { IsString, IsUrl, IsArray, ArrayMinSize } from 'class-validator';

export class CreateWebhookDto {
  @IsUrl()
  url: string;

  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  events: string[];
}
