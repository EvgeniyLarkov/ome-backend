import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, MaxLength, MinLength } from 'class-validator';

export class DropMapActionDto {
  @ApiProperty({ example: 'A4KF2kfD' })
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  mapHash: string;

  @ApiProperty({ example: 'A4KF2kfD' })
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  hash: string;
}
