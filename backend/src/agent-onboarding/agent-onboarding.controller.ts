import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from "@nestjs/common";

import { AgentOnboardingService } from "./agent-onboarding.service";
import { SignAgreementDto } from "./dto/sign-agreement.dto";
import { SubmitDirectDebitDto } from "./dto/submit-direct-debit.dto";

@Controller("agent-onboarding")
export class AgentOnboardingController {
  constructor(
    private readonly service:
      AgentOnboardingService,
  ) {}

  // =========================================================
  // GET ESTATE AGENT AGREEMENT
  // =========================================================

  @Get(":applicationId/agreement")
  getAgreement(
    @Param(
      "applicationId",
      ParseUUIDPipe,
    )
    applicationId: string,
  ) {
    return this.service.getAgreement(
      applicationId,
    );
  }

  // =========================================================
  // SIGN ESTATE AGENT AGREEMENT
  //
  // Estate Agent signs
  //      ↓
  // AGREEMENT_SIGNED
  //      ↓
  // Admin receives email notification
  // =========================================================

  @Post(
    ":applicationId/agreement/sign",
  )
  signAgreement(
    @Param(
      "applicationId",
      ParseUUIDPipe,
    )
    applicationId: string,

    @Body()
    dto: SignAgreementDto,
  ) {
    return this.service.signAgreement(
      applicationId,
      dto,
    );
  }

  // =========================================================
  // OPEN / START DIRECT DEBIT SETUP
  //
  // IMPORTANT:
  // Admin must send the Direct Debit request first.
  //
  // PAYMENT_SETUP_PENDING
  //      ↓
  // Agent opens Direct Debit page
  // =========================================================

  @Post(
    ":applicationId/direct-debit/start",
  )
  startDirectDebit(
    @Param(
      "applicationId",
      ParseUUIDPipe,
    )
    applicationId: string,
  ) {
    return this.service.startDirectDebit(
      applicationId,
    );
  }

  // =========================================================
  // SUBMIT DIRECT DEBIT
  //
  // Estate Agent submits
  //      ↓
  // Direct Debit = SUBMITTED
  //      ↓
  // Admin receives email
  //      ↓
  // Admin validates
  // =========================================================

  @Post(
    ":applicationId/direct-debit/submit",
  )
  submitDirectDebit(
    @Param(
      "applicationId",
      ParseUUIDPipe,
    )
    applicationId: string,

    @Body()
    dto: SubmitDirectDebitDto,
  ) {
    return this.service.submitDirectDebit(
      applicationId,
      dto,
    );
  }
}