import {
  ExecutionContext,
  HttpException,
  HttpStatus,
  createParamDecorator,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { ValidationError, validate } from 'class-validator';
import { createResponseErrorBody } from 'src/utils/createResponseErrorBody';

export const RequestHeader = createParamDecorator(
  //Removed ClassType<unknown>,, I don't think you need this here
  async (value: any, ctx: ExecutionContext) => {
    // extract headers
    const headers = ctx.switchToHttp().getRequest().headers;

    // Convert headers to DTO object
    const dto = plainToInstance(value, headers, {
      excludeExtraneousValues: true,
    });

    // Validate
    const errors: ValidationError[] = await validate(dto);

    if (errors.length > 0) {
      //Get the errors and push to custom array
      const validationErrors = errors.map((obj) =>
        Object.values(obj.constraints),
      );
      throw new HttpException(
        createResponseErrorBody(
          HttpStatus.BAD_REQUEST,
          `Validation failed with following Errors: ${validationErrors}`,
        ),
        HttpStatus.BAD_REQUEST,
      );
    }

    // return header dto object
    return dto;
  },
);
