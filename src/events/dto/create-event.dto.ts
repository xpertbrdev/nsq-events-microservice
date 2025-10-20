import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsObject, IsString } from 'class-validator';
import { EventType } from '../enums/event-type.enum';

export class CreateEventDto {
  @ApiProperty({ description: 'Dados do evento' })
  @IsNotEmpty()
  @IsObject()
  data: any;

  @ApiProperty({
    description: 'Tipo do evento',
    enum: EventType,
  })
  @IsEnum(EventType)
  eventType: EventType;

  @ApiProperty({ description: 'ID do usuário' })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ description: 'ID da filial de destino' })
  @IsString()
  @IsNotEmpty()
  FilialIDDestino: string;

  @ApiProperty({ description: 'CNPJ da filial de destino' })
  @IsString()
  @IsNotEmpty()
  CNPJDestino: string;

  @ApiProperty({ description: 'ID da filial de origem' })
  @IsString()
  @IsNotEmpty()
  FilialOrigem: string;

  @ApiProperty({ description: 'CNPJ da filial de origem' })
  @IsString()
  @IsNotEmpty()
  CNPJOrigem: string;
}

