import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class MessagePostDto {
  @ApiProperty({ example: 'Hello honey' })
  @IsNotEmpty()
  message: string;
}
