import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import { PINO_REDACT_PATHS, shouldOmitBody } from './redaction';
import { resolveRequestId } from './request-context';

@Module({
  imports: [
    PinoLoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const env = config.get<string>('NODE_ENV') ?? 'development';
        const level = config.get<string>('LOG_LEVEL') ?? (env === 'production' ? 'info' : 'debug');
        return {
          pinoHttp: {
            level,
            genReqId: (req) => {
              const requestId = resolveRequestId(req.headers['x-request-id']);
              req.headers['x-request-id'] = requestId;
              return requestId;
            },
            customAttributeKeys: {
              responseTime: 'durationMs',
            },
            customProps: (req, res) => ({
              requestId: req.id,
              method: req.method,
              route: req.url,
              status: res.statusCode,
            }),
            customSuccessMessage: (req, res, responseTime) =>
              `${req.method} ${req.url} ${res.statusCode} ${Math.round(responseTime)}ms`,
            customErrorMessage: (req, res, error) =>
              `${req.method} ${req.url} ${res.statusCode} ${error.message}`,
            redact: {
              paths: [...PINO_REDACT_PATHS],
              censor: '[Redacted]',
            },
            serializers: {
              req(req) {
                const headers = req.headers ?? {};
                const contentType =
                  typeof headers['content-type'] === 'string' ? headers['content-type'] : undefined;
                const omitBody = shouldOmitBody(contentType, req.url);
                return {
                  id: req.id,
                  method: req.method,
                  url: req.url,
                  body: omitBody ? '[omitted-upload]' : undefined,
                };
              },
            },
            transport:
              env === 'development'
                ? { target: 'pino-pretty', options: { colorize: true, singleLine: true } }
                : undefined,
          },
        };
      },
    }),
  ],
})
export class ObservabilityLoggerModule {}
