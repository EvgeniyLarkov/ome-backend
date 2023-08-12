import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { mapsEditPermissions } from 'src/maps/types/map-permissions.types';

export class ChangeMapPermissionsDto {
  @ApiProperty({ example: false })
  @IsOptional()
  anonymous_view: boolean;

  @ApiProperty({ example: 0, description: 'Set of edit rules for map' })
  @IsOptional()
  edit_rules: mapsEditPermissions;
}
