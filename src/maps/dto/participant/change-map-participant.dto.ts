import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  IsIn,
} from 'class-validator';
import {
  MAP_PARTICIPANT_STATUS,
  MAP_PARTICIPANT_TYPE,
  mapParticipantStatuses,
  mapParticipantTypes,
} from 'src/maps/types/map-participant.types';

export class ChangeMapParticipantDto {
  @ApiProperty({ example: 'fa34FFA2Ga' })
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  mapHash: string;

  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  @IsString()
  @IsOptional()
  name?: string;

  @IsNotEmpty()
  @IsIn(Object.values(MAP_PARTICIPANT_TYPE))
  @IsOptional()
  type?: mapParticipantTypes;

  @IsNotEmpty()
  @IsIn(Object.values(MAP_PARTICIPANT_STATUS))
  @IsOptional()
  status?: mapParticipantStatuses;

  @IsOptional()
  special_permissions?: Record<string, unknown> | null;
}
