import { ClassSerializerInterceptor, Injectable } from '@nestjs/common';
import { ClassTransformOptions } from 'class-transformer';

@Injectable()
export class InterceptorForClassSerializer extends ClassSerializerInterceptor {
  serialize(response: unknown, options: ClassTransformOptions) {
    const rawDataJSON = JSON.stringify(response);
    return super.serialize(JSON.parse(rawDataJSON), options);
  }
}
