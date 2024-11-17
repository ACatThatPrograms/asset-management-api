import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    app.useGlobalPipes(new ValidationPipe());

    app.enableCors({
        origin: '*',
        methods: 'GET,HEAD,POST,PUT,DELETE,PATCH,OPTIONS',
    });

    const config = new DocumentBuilder()
        .setTitle('API Documentation')
        .setDescription('The API documentation for my application')
        .setVersion('0.1')
        .addBearerAuth()
        .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api-docs', app, document);

    await app.listen(3000);
}
bootstrap();
