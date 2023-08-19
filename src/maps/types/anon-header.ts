/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import {
  IsDefined,
  IsNotEmpty,
  MaxLength,
  MinLength,
  NotEquals,
} from 'class-validator';

export class AnonymousRequestHeader {
  @ApiProperty({ example: 'fa34FFA2Ga' })
  @IsNotEmpty()
  @IsDefined()
  @NotEquals('undefined')
  @MinLength(2)
  @Expose({ name: 'anonymous-id' })
  @MaxLength(14)
  "anonymous-id": string;
}
