import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, MaxLength, MinLength } from 'class-validator';

export class CreateMapParticipantDto {
  @ApiProperty({ example: 'fa34FFA2Ga' })
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  mapHash: string;

  @ApiProperty({
    example: 'LBF34fa5MAf',
    description: 'Unique id for anon participant',
  })
  @MinLength(2)
  @MaxLength(100)
  @IsOptional()
  participantId?: string | null;
}
