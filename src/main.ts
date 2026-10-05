import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';

import { AppModule } from './app.module';
import { CryptoInterceptor } from './common/interceptors/crypto.interceptor';
import { TraceabilityInterceptor } from './common/interceptors/traceability.interceptor';
import { AppLogger } from './common/logger/logger.service';

async function bootstrap() {
    const app = await NestFactory.create(AppModule, {
        bufferLogs: true,
    });
    const appLogger = app.get(AppLogger);
    app.useLogger(appLogger);

    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true, // Remueve propiedades que no estén en el DTO
            forbidNonWhitelisted: true, // Lanza error si se envían propiedades no reconocidas
            transform: true, // Transforma automáticamente los payloads a instancias de sus DTOs
        }),
    );
    app.useGlobalInterceptors(app.get(TraceabilityInterceptor), app.get(CryptoInterceptor));

    await app.listen(process.env.PORT ?? 4020);
}

void bootstrap();
