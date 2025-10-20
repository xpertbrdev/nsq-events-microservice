import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class StartSessionDto {
  @ApiProperty({ description: 'ID do usuário' })
  @IsString()
  @IsNotEmpty()
  userId: string;
}

