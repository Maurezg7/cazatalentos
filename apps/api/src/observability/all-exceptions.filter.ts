import { Catch, Logger, type ArgumentsHost, type ExceptionFilter } from '@nestjs/common';
import { currentRequestId, resolveRequestId } from './request-context';
import { httpStatusFor, mapException } from './map-exception';

type HttpRequest = {
  url?: string;
  method?: string;
  headers: Record<string, string | string[] | undefined>;
};

type HttpReply = {
  status: (code: number) => HttpReply;
  header: (name: string, value: string) => HttpReply;
  send: (payload: unknown) => unknown;
};

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const reply = ctx.getResponse<HttpReply>();
    const request = ctx.getRequest<HttpRequest>();
    const requestId = resolveRequestId(currentRequestId() ?? request.headers['x-request-id']);

    const mapped = mapException(exception, requestId);
    const status = httpStatusFor(mapped);
    const logFn = status >= 500 ? 'error' : 'warn';

    this.logger[logFn](
      JSON.stringify({
        ...mapped.toLog(),
        status,
        route: request.url,
        method: request.method,
      }),
    );

    const exposeStack = process.env.NODE_ENV !== 'production' && exception instanceof Error;
    void reply.status(status).header('x-request-id', mapped.requestId ?? '').send({
      ...mapped.toClientBody(),
      ...(exposeStack ? { stack: exception.stack } : {}),
    });
  }
}
