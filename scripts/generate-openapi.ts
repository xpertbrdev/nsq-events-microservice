import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from '../src/app.module';
import * as fs from 'fs';
import * as path from 'path';

async function generateOpenApiSpec() {
  const app = await NestFactory.create(AppModule, {
    logger: false,
  });

  const config = new DocumentBuilder()
    .setTitle('Events Module API')
    .setDescription('API para gerenciamento de eventos com sessões transacionais')
    .setVersion('1.0')
    .addTag('Events')
    .addTag('Metrics')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  const outputPath = path.join(__dirname, '..', 'openapi.json');
  fs.writeFileSync(outputPath, JSON.stringify(document, null, 2));

  console.log(`OpenAPI spec generated at: ${outputPath}`);

  await app.close();
}

generateOpenApiSpec();

