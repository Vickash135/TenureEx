import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";
import { MailModule } from "../mail/mail.module";
import { PropertiesController } from "./properties.controller";
import { PropertiesService } from "./properties.service";

@Module({
  imports: [AuthModule, MailModule],
  controllers: [PropertiesController],
  providers: [PropertiesService],
  exports: [PropertiesService],
})
export class PropertiesModule {}
