import * as dotenv from "dotenv";
dotenv.config();

import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import * as basicAuth from "express-basic-auth";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors({
    origin: "*",
    methods: "GET,POST,PUT,DELETE",
    allowedHeaders: "Content-Type,Authorization",
  });

  // Enable global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    })
  );

  // Apply basic auth for Swagger docs under /api
  const swaggerUser = process.env.SWAGGER_USER || "admin";
  const swaggerPass = process.env.SWAGGER_PASS || "password";
  app.use(
    ["/api", "/api-json"],
    basicAuth({
      users: { [swaggerUser]: swaggerPass },
      challenge: true,
    })
  );

  // Setup Swagger OpenAPI
  const config = new DocumentBuilder()
    .setTitle("Sailorlabs.in Storage Bucket")
    .setDescription(
      "API for uploading, listing, previewing, replacing, and deleting files using MinIO"
    )
    .setVersion("1.0.0")
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api", app, document);

  // Listen on configured port
  const PORT = process.env.PORT || 4000;
  await app.listen(PORT);
  console.log(`Application is running on: http://localhost:${PORT}`);
  console.log(`Swagger documentation is available at: http://localhost:${PORT}/api`);
}

bootstrap().catch((err) => {
  console.error("Error bootstrapping application:", err);
  process.exit(1);
});
