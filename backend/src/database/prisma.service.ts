
import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      throw new Error("DATABASE_URL is missing.");
    }

    const url = new URL(databaseUrl);

    // Prevent URL SSL settings from overriding
    // the trusted certificate configuration.
    for (const key of [
      "sslmode",
      "sslcert",
      "sslkey",
      "sslrootcert",
    ]) {
      url.searchParams.delete(key);
    }

    const isLocal = [
      "localhost",
      "127.0.0.1",
      "::1",
    ].includes(url.hostname);

    const caCertificate =
      process.env.DATABASE_CA_CERT?.replace(/\\n/g, "\n");

    if (!isLocal && !caCertificate) {
      throw new Error(
        "DATABASE_CA_CERT is required for remote PostgreSQL.",
      );
    }

    const adapter = new PrismaPg({
      connectionString: url.toString(),
      ssl: isLocal
        ? false
        : {
            ca: caCertificate,
            rejectUnauthorized: true,
          },
    });

    super({ adapter });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
