import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const IDEMPOTENCY_KEY = 'X-Idempotency-Key';

export const IdempotencyKey = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest();
    return request.headers[IDEMPOTENCY_KEY.toLowerCase()];
  },
);
