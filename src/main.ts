import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';

import { AppModule } from './app.module';
import { CryptoInterceptor } from './common/interceptors/crypto.interceptor';

async function bootstrap() {
    const app = await NestFactory.create(AppModule, {
        bufferLogs: true,
    });

    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true, // Remueve propiedades que no estén en el DTO
            forbidNonWhitelisted: true, // Lanza error si se envían propiedades no reconocidas
            transform: true, // Transforma automáticamente los payloads a instancias de sus DTOs
        }),
    );
    app.useGlobalInterceptors(app.get(CryptoInterceptor));

    await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
