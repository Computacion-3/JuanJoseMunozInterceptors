import { randomUUID } from 'crypto';
import { STATUS_CODES } from 'http';

import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Request, Response } from 'express';
import { defer, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

import { AppLogger } from '../logger/logger.service';

declare module 'express-serve-static-core' {
    interface Request {
        correlationId: string;
    }
}

@Injectable()
export class TraceabilityInterceptor implements NestInterceptor<unknown, unknown> {
    constructor(private readonly logger: AppLogger) {}

    intercept(context: ExecutionContext, next: CallHandler<unknown>): Observable<unknown> {
        const httpContext = context.switchToHttp();
        const request = httpContext.getRequest<Request>();
        const response = httpContext.getResponse<Response>();
        const correlationId = request.get('x-correlation-id')?.trim() || randomUUID();
        const startedAt = Date.now();

        request.correlationId = correlationId;
        response.setHeader('x-correlation-id', correlationId);

        return defer(() =>
            AppLogger.runWithTrace(correlationId, () =>
                next.handle().pipe(
                    tap({
                        next: () => this.logResponse(request, response, correlationId, startedAt),
                        error: () => this.logResponse(request, response, correlationId, startedAt),
                    }),
                ),
            ),
        );
    }

    private logResponse(request: Request, response: Response, correlationId: string, startedAt: number): void {
        const status = response.statusCode;
        const statusText = response.statusMessage || STATUS_CODES[status] || 'UNKNOWN';
        const duration = Date.now() - startedAt;

        this.logger.logWithTrace(
            correlationId,
            'LOG',
            `[TRACE] [${request.method} ${request.originalUrl}] [${status} ${statusText}] [Duration: ${duration}ms]`,
        );
    }
}
