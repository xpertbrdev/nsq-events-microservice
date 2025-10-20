import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class StartSessionDto {
  @ApiProperty({ description: 'ID da filial/matriz' })
  @IsString()
  @IsNotEmpty()
  filialId: string;

  @ApiProperty({ description: 'CNPJ da filial/matriz' })
  @IsString()
  @IsNotEmpty()
  filialCNPJ: string;

  @ApiProperty({ description: 'Ambiente (ex: production, staging, development)' })
  @IsString()
  @IsNotEmpty()
  ambiente: string;

  @ApiProperty({ description: 'Identificador do remetente/sistema' })
  @IsString()
  @IsNotEmpty()
  sender: string;
}

