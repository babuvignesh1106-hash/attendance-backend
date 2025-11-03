import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import serverless from 'serverless-http';

let cachedHandler: any;

export const handler = async (event: any, context: any) => {
  if (!cachedHandler) {
    const app = await NestFactory.create(AppModule);
    app.enableCors({
      origin: [
        'https://attendance-ui-portal.netlify.app',
        'http://localhost:3000',
      ],
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      credentials: true,
    });
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    const expressApp = app.getHttpAdapter().getInstance();
    cachedHandler = serverless(expressApp);
  }
  return cachedHandler(event, context);
};
