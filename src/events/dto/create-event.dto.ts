import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsObject, IsString } from 'class-validator';

export class CreateEventDto {
  @ApiProperty({ description: 'Dados do evento' })
  @IsNotEmpty()
  @IsObject()
  data: any;

  @ApiProperty({ description: 'Método/ação executada' })
  @IsString()
  @IsNotEmpty()
  method: string;

  @ApiProperty({ description: 'Nome da classe/entidade' })
  @IsString()
  @IsNotEmpty()
  className: string;

  @ApiProperty({ description: 'Identificador único do registro' })
  @IsString()
  unico: string;

  @ApiProperty({ description: 'ID da filial' })
  @IsNumber()
  @IsNotEmpty()
  filialId: number;

  @ApiProperty({ description: 'CNPJ da filial' })
  @IsString()
  @IsNotEmpty()
  filialCnpj: string;
}

