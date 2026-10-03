import { Injectable, type NestMiddleware } from '@nestjs/common';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { requestContext, resolveRequestId } from './request-context';

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: IncomingMessage, res: ServerResponse, next: () => void): void {
    const incoming = req.headers['x-request-id'];
    const requestId = resolveRequestId(typeof incoming === 'string' || Array.isArray(incoming) ? incoming : undefined);
    req.headers['x-request-id'] = requestId;
    res.setHeader('x-request-id', requestId);
    requestContext.run({ requestId }, () => next());
  }
}
