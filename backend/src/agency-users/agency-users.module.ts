import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";
import { MailModule } from "../mail/mail.module";
import { AgencyUsersController } from "./agency-users.controller";
import { AgencyUsersService } from "./agency-users.service";

@Module({
  imports: [
    AuthModule,
    MailModule,
  ],
  controllers: [
    AgencyUsersController,
  ],
  providers: [
    AgencyUsersService,
  ],
  exports: [
    AgencyUsersService,
  ],
})
export class AgencyUsersModule {}