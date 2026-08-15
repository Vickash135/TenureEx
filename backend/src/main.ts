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

  // Global API prefix
  app.setGlobalPrefix("api/v1");

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // =====================================================
  // STATIC UPLOADS
  // Allows uploaded property photos to be displayed
  //
  // Example:
  // http://localhost:3000/uploads/properties/photo.jpg
  // =====================================================

  app.useStaticAssets(
    join(process.cwd(), "uploads"),
    {
      prefix: "/uploads/",
    },
  );

  // Port
  const port = Number(
    process.env.PORT ?? 3000,
  );

  await app.listen(port, "0.0.0.0");

  console.log(
    `TenureEx API running on http://localhost:${port}/api/v1`,
  );

  console.log(
    `TenureEx uploads available on http://localhost:${port}/uploads`,
  );
}

void bootstrap();