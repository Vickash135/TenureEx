import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { join } from "path";

import { AppModule } from "./app.module";

async function bootstrap(): Promise<void> {
  const app =
    await NestFactory.create<NestExpressApplication>(
      AppModule,
    );

  // =====================================================
  // GLOBAL API PREFIX
  // =====================================================
  app.setGlobalPrefix("api/v1");

  // =====================================================
  // VALIDATION
  // =====================================================
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // =====================================================
  // CORS
  // =====================================================
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // =====================================================
  // STATIC UPLOADS
  //
  // IMPORTANT:
  // In production DigitalOcean routes /api/v1/* to
  // the NestJS backend.
  //
  // Therefore uploaded files are also exposed through
  // /api/v1/uploads/*
  //
  // Local example:
  // http://localhost:3000/api/v1/uploads/properties/photo.jpg
  //
  // Production example:
  // https://tenureex-api-24pj6.ondigitalocean.app/
  // api/v1/uploads/properties/photo.jpg
  // =====================================================
  app.useStaticAssets(
    join(process.cwd(), "uploads"),
    {
      prefix: "/api/v1/uploads/",
    },
  );

  // =====================================================
  // PORT
  // =====================================================
  const port = Number(
    process.env.PORT ?? 3000,
  );

  await app.listen(port, "0.0.0.0");

  // =====================================================
  // STARTUP LOGS
  // =====================================================
  console.log(
    `TenureEx API running on http://localhost:${port}/api/v1`,
  );

  console.log(
    `TenureEx uploads available on http://localhost:${port}/api/v1/uploads`,
  );
}

void bootstrap();