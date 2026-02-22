import { IsString, IsOptional, IsIn, IsObject } from 'class-validator';

export class CreateChargeDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsIn(['fixed_price', 'no_price'])
  pricing_type: string;

  @IsOptional()
  @IsString()
  local_amount?: string;

  @IsOptional()
  @IsString()
  local_currency?: string;

  @IsOptional()
  @IsString()
  crypto_chain?: string;

  @IsOptional()
  @IsString()
  crypto_asset?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @IsOptional()
  @IsString()
  redirect_url?: string;

  @IsOptional()
  @IsString()
  cancel_url?: string;
}
