import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, MaxLength, MinLength } from 'class-validator';

export class MapEventDto {
  @ApiProperty({ example: 'A4KF2kfD' })
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  mapHash: string;

  @ApiProperty({ example: 0 })
  @IsNotEmpty()
  type: number;

  @ApiProperty({ example: { lat: 51.505, lng: -0.09 } })
  @Transform(({ value }) => ({
    lat: parseInt(value.lat, 10),
    lng: parseInt(value.lng, 10),
  }))
  @IsNotEmpty()
  coordinates: { lat: number; lng: number };

  @ApiProperty({
    example: { message: 'hello', option1: true, option2: { someData: 12 } },
  })
  @IsOptional()
  data: Record<string, unknown>;
}
