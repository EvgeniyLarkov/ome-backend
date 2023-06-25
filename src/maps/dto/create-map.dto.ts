import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  MaxLength,
  MinLength,
  Validate,
} from 'class-validator';
import { FileEntity } from '../../files/entities/file.entity';
import { IsExist } from '../../shared/validators/is-exists.validator';

export class CreateMapDto {
  @ApiProperty({ example: 'My new map' })
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'Description of my new map' })
  @IsOptional()
  @MaxLength(1024)
  description: string;

  @ApiProperty({ type: () => FileEntity })
  @IsOptional()
  @Validate(IsExist, ['FileEntity', 'id'], {
    message: 'imageNotExists',
  })
  photo?: FileEntity | null;

  @ApiProperty({ type: 'boolean' })
  @IsOptional()
  public: false;
}
