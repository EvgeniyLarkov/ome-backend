import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, MaxLength, MinLength } from 'class-validator';

export class CreateMapEventDto {
  @ApiProperty({ example: 'A4KF2kfD' })
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  mapHash: string;

  @ApiProperty({ example: 0 })
  @IsNotEmpty()
  type: number;

  @ApiProperty({ example: [51.505, -0.09] })
  @IsNotEmpty()
  coordinates: [number, number];

  @ApiProperty({
    example: { message: 'hello', option1: true, option2: { someData: 12 } },
  })
  @IsOptional()
  data: Record<string, unknown>;
}
