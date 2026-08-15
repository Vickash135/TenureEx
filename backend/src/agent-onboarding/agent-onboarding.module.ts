import {
  Module,
} from "@nestjs/common";

import {
  MailModule,
} from "../mail/mail.module";

import {
  AgentOnboardingController,
} from "./agent-onboarding.controller";

import {
  AgentOnboardingService,
} from "./agent-onboarding.service";

@Module({
  imports: [
    MailModule,
  ],

  controllers: [
    AgentOnboardingController,
  ],

  providers: [
    AgentOnboardingService,
  ],

  exports: [
    AgentOnboardingService,
  ],
})
export class AgentOnboardingModule {}