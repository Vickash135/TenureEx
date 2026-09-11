import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";
import { DatabaseModule } from "../database/database.module";
import { MailModule } from "../mail/mail.module";
import { DemoRequestsController } from "./demo-requests.controller";
import { DemoRequestsService } from "./demo-requests.service";

@Module({
  imports: [DatabaseModule, AuthModule, MailModule],
  controllers: [DemoRequestsController],
  providers: [DemoRequestsService],
})
export class DemoRequestsModule {}
