import { ErrorHttpStatusCode } from '@nestjs/common/utils/http-error-by-code.util';

export function createResponseErrorBody(
  status: ErrorHttpStatusCode,
  description: string,
) {
  return {
    status,
    description,
  };
}
