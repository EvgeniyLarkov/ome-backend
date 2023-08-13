import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, MaxLength, MinLength } from 'class-validator';
import { mapActionTypes } from '../../types/map.types';

export class MapActionDto {
  @ApiProperty({ example: 'A4KF2kfD' })
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  mapHash: string;

  @ApiProperty({ example: 0 })
  @IsNotEmpty()
  type: mapActionTypes;

  @ApiProperty({ example: { lat: 51.505, lng: -0.09 } })
  @Transform(({ value }) => ({
    lat: parseFloat(value.lat),
    lng: parseFloat(value.lng),
  }))
  @IsNotEmpty()
  coordinates: { lat: number; lng: number };

  @ApiProperty({
    example: { message: 'hello', option1: true, option2: { someData: 12 } },
  })
  @IsOptional()
  data: Record<string, unknown>;
}
