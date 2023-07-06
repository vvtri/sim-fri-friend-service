import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

// trigger cicd
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const prefix = '/api/friend-service';

  app.enableCors({ origin: '*' });
  app.setGlobalPrefix(prefix);

  const config = new DocumentBuilder()
    .setTitle('Friend Service API')
    .setDescription('Friend Service API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(`${prefix}/swagger`, app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  await app.listen(+process.env.PORT || 5004);
  console.log('FriendService is running');
}
bootstrap();
