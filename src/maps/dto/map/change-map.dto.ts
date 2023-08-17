import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, MaxLength, MinLength } from 'class-validator';

export class ChangeMapDto {
  @ApiProperty({ example: 'Map name' })
  @IsNotEmpty()
  @IsOptional()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'Description of existed map' })
  @IsOptional()
  @MinLength(2)
  @MaxLength(1024)
  description: string;

  @ApiProperty({ type: 'boolean' })
  @IsOptional()
  public: boolean;
}
