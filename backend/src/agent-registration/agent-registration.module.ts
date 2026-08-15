import {
  Module,
} from "@nestjs/common";

import {
  JwtModule,
} from "@nestjs/jwt";

import {
  MailModule,
} from "../mail/mail.module";

import {
  AgentRegistrationController,
} from "./agent-registration.controller";

import {
  AgentRegistrationService,
} from "./agent-registration.service";

import {
  AgentOnboardingGuard,
} from "./guards/agent-onboarding.guard";

@Module({
  imports: [
    JwtModule.register({}),
    MailModule,
  ],

  controllers: [
    AgentRegistrationController,
  ],

  providers: [
    AgentRegistrationService,
    AgentOnboardingGuard,
  ],

  exports: [
    AgentRegistrationService,
  ],
})
export class AgentRegistrationModule {}