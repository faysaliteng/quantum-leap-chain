import { IsString, IsOptional, IsArray, IsNumber, IsDateString, ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';

export class InvoiceItemDto {
  @IsString()
  description: string;

  @IsNumber()
  quantity: number;

  @IsNumber()
  unit_price: number;
}

export class CreateInvoiceDto {
  @IsString()
  customer_name: string;

  @IsString()
  customer_email: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceItemDto)
  @ArrayMinSize(1)
  items: InvoiceItemDto[];

  @IsString()
  currency: string;

  @IsArray()
  @IsString({ each: true })
  chains: string[];

  @IsOptional()
  @IsNumber()
  tax_rate?: number;

  @IsDateString()
  due_date: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateInvoiceDto {
  @IsOptional()
  @IsString()
  customer_name?: string;

  @IsOptional()
  @IsString()
  customer_email?: string;

  @IsOptional()
  @IsArray()
  items?: InvoiceItemDto[];

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsArray()
  chains?: string[];

  @IsOptional()
  @IsNumber()
  tax_rate?: number;

  @IsOptional()
  @IsDateString()
  due_date?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
