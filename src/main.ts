import { ValidationPipe } from './helper/pipe/validation.pipe';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { json, urlencoded } from 'express';
import { join } from 'path';
import { AppModule } from './app.module';
import { setupSwagger } from './swagger';
import compression = require('compression');

async function bootstrap() {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);
    app.useStaticAssets(join(__dirname, '/upload'), { prefix: '/storage' });
    app.useStaticAssets(join(__dirname, '/upload-qr'), { prefix: '/qr' });
    app.enableCors({
        origin: '*',
        methods: 'GET,PUT,PATCH,POST,DELETE,UPDATE,OPTIONS',
        allowedHeaders: 'Content-Type, Accept,Option, Authorization',
        maxAge: 3600,
    });
    app.useGlobalPipes(new ValidationPipe());
    app.use(json({ limit: '300mb' }));
    app.use(compression());
    app.use(urlencoded({ extended: true, limit: '300mb' }));
    app.set('x-powered-by', false);
    setupSwagger(app);
    await app.listen(3000);
}

bootstrap();
