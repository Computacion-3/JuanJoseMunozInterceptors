import * as fs from 'fs';
import * as path from 'path';
import { AsyncLocalStorage } from 'async_hooks';

import { Injectable, LoggerService, OnModuleDestroy } from '@nestjs/common';

@Injectable()
export class AppLogger implements LoggerService, OnModuleDestroy {
    private static readonly traceStorage = new AsyncLocalStorage<string>();
    private logStream: fs.WriteStream;

    constructor() {
        const dateStamp = new Date().toISOString().split('T')[0];
        const logDir = path.join(process.cwd(), 'logs');

        // Garantiza la existencia del directorio de almacenamiento
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }

        const logFile = path.join(logDir, `app-${dateStamp}.log`);
        // Abre el stream en modo append ('a')
        this.logStream = fs.createWriteStream(logFile, { flags: 'a' });
    }

    static runWithTrace<T>(correlationId: string, callback: () => T): T {
        return AppLogger.traceStorage.run(correlationId, callback);
    }

    log(message: string): void {
        this.write('LOG', message);
    }

    logWithTrace(correlationId: string, level: string, message: string): void {
        AppLogger.traceStorage.run(correlationId, () => this.write(level, message));
    }

    error(message: string, trace?: string): void {
        this.write('ERROR', message, trace);
    }

    warn(message: string): void {
        this.write('WARN', message);
    }

    debug(message: string): void {
        this.write('DEBUG', message);
    }

    verbose(message: string): void {
        this.write('VERBOSE', message);
    }

    private write(level: string, message: string, trace?: string): void {
        const timestamp = new Date().toISOString();
        const correlationId = AppLogger.traceStorage.getStore();
        const traceSuffix = correlationId ? ` [CorrelationID: ${correlationId}]` : '';
        const formattedLog = `[${timestamp}] [${level}] ${message}${traceSuffix}${trace ? '\n[Stack Trace]: ' + trace : ''}\n`;

        // Escritura persistente en disco
        this.logStream.write(formattedLog);

        // Salida formateada en consola
        console.info(formattedLog.trim());
    }

    onModuleDestroy(): void {
        if (this.logStream) {
            this.logStream.end();
        }
    }
}
