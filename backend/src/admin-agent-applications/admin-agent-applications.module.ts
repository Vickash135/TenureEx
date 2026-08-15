import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";
import { MailModule } from "../mail/mail.module";

import { AdminAgentApplicationsController } from "./admin-agent-applications.controller";
import { AdminAgentApplicationsService } from "./admin-agent-applications.service";

@Module({
  imports: [
    // Gives this module access to JwtAuthGuard / authentication
    AuthModule,

    // Gives AdminAgentApplicationsService access to MailService
    MailModule,
  ],

  controllers: [
    AdminAgentApplicationsController,
  ],

  providers: [
    AdminAgentApplicationsService,
  ],

  exports: [
    AdminAgentApplicationsService,
  ],
})
export class AdminAgentApplicationsModule {}