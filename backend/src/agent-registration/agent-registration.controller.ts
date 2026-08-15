import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";

import {
  AgentRegistrationService,
} from "./agent-registration.service";

import {
  OnboardingUser,
  type AgentOnboardingUser,
} from "./decorators/onboarding-user.decorator";

import {
  CompleteAgentApplicationDto,
} from "./dto/complete-agent-application.dto";

import {
  RespondMoreInfoDto,
} from "./dto/respond-more-info.dto";

import {
  StartAgentRegistrationDto,
} from "./dto/start-agent-registration.dto";

import {
  VerifyAgentEmailDto,
} from "./dto/verify-agent-email.dto";

import {
  VerifyAgentPhoneDto,
} from "./dto/verify-agent-phone.dto";

import {
  AgentOnboardingGuard,
} from "./guards/agent-onboarding.guard";

@Controller("agent-registration")
export class AgentRegistrationController {
  constructor(
    private readonly service:
      AgentRegistrationService,
  ) {}

  @Post("start")
  start(
    @Body()
    dto: StartAgentRegistrationDto,
  ) {
    return this.service.start(dto);
  }

  @Post("verify-email")
  verifyEmail(
    @Body()
    dto: VerifyAgentEmailDto,
  ) {
    return this.service.verifyEmail(dto);
  }

  @Post("send-phone-otp/:userId")
  sendPhoneOtp(
    @Param(
      "userId",
      ParseUUIDPipe,
    )
    userId: string,
  ) {
    return this.service.sendPhoneOtp(
      userId,
    );
  }

  @Post("verify-phone")
  verifyPhone(
    @Body()
    dto: VerifyAgentPhoneDto,
  ) {
    return this.service.verifyPhone(dto);
  }

  @Patch(":applicationId/details")
  @UseGuards(AgentOnboardingGuard)
  completeApplication(
    @Param(
      "applicationId",
      ParseUUIDPipe,
    )
    applicationId: string,

    @OnboardingUser()
    user: AgentOnboardingUser,

    @Body()
    dto: CompleteAgentApplicationDto,
  ) {
    return this.service.completeApplication(
      applicationId,
      user.sub,
      user.applicationId,
      dto,
    );
  }

  @Post(":applicationId/submit")
  @UseGuards(AgentOnboardingGuard)
  submitApplication(
    @Param(
      "applicationId",
      ParseUUIDPipe,
    )
    applicationId: string,

    @OnboardingUser()
    user: AgentOnboardingUser,
  ) {
    return this.service.submitApplication(
      applicationId,
      user.sub,
      user.applicationId,
    );
  }

  // =========================================================
  // RESPOND TO ADMIN "REQUEST MORE INFORMATION"
  // =========================================================

  @Post(":applicationId/more-information")
  @UseGuards(AgentOnboardingGuard)
  respondMoreInformation(
    @Param(
      "applicationId",
      ParseUUIDPipe,
    )
    applicationId: string,

    @OnboardingUser()
    user: AgentOnboardingUser,

    @Body()
    dto: RespondMoreInfoDto,
  ) {
    return this.service.respondMoreInformation(
      applicationId,
      user.sub,
      user.applicationId,
      dto,
    );
  }

  @Get(":applicationId/status")
  @UseGuards(AgentOnboardingGuard)
  getStatus(
    @Param(
      "applicationId",
      ParseUUIDPipe,
    )
    applicationId: string,

    @OnboardingUser()
    user: AgentOnboardingUser,
  ) {
    return this.service.getStatus(
      applicationId,
      user.sub,
      user.applicationId,
    );
  }
}