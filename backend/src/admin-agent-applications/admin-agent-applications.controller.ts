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

import { AdminAuthGuard } from "../auth/guards/admin-auth.guard";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

import { AdminAgentApplicationsService } from "./admin-agent-applications.service";
import { FinalApproveDto } from "./dto/final-approve.dto";
import { RejectApplicationDto } from "./dto/reject-application.dto";
import { RequestMoreInfoDto } from "./dto/request-more-info.dto";
import { ReviewApplicationDto } from "./dto/review-application.dto";

@Controller("admin/agent-applications")
@UseGuards(
  JwtAuthGuard,
  AdminAuthGuard,
)
export class AdminAgentApplicationsController {
  constructor(
    private readonly service:
      AdminAgentApplicationsService,
  ) {}

  // =========================================================
  // GET ALL ESTATE AGENT APPLICATIONS
  // ADMIN ONLY
  // =========================================================

  @Get()
  findAll() {
    return this.service.findAll();
  }

  // =========================================================
  // GET ONE ESTATE AGENT APPLICATION
  // ADMIN ONLY
  // =========================================================

  @Get(":id")
  findOne(
    @Param(
      "id",
      ParseUUIDPipe,
    )
    id: string,
  ) {
    return this.service.findOne(
      id,
    );
  }

  // =========================================================
  // START / RESTART APPLICATION REVIEW
  // ADMIN ONLY
  //
  // PENDING_REVIEW -> UNDER_REVIEW
  //
  // Also used after the Estate Agent responds to a
  // "More information required" request.
  // =========================================================

  @Patch(
    ":id/start-review",
  )
  startReview(
    @Param(
      "id",
      ParseUUIDPipe,
    )
    id: string,

    @Body()
    dto: ReviewApplicationDto,
  ) {
    return this.service.startReview(
      id,
      dto,
    );
  }

  // =========================================================
  // REQUEST MORE INFORMATION
  // ADMIN ONLY
  //
  // ADMIN
  //   ↓
  // Estate Agent receives email
  //   ↓
  // MORE_INFORMATION_REQUIRED
  // =========================================================

  @Patch(
    ":id/request-info",
  )
  requestInfo(
    @Param(
      "id",
      ParseUUIDPipe,
    )
    id: string,

    @Body()
    dto: RequestMoreInfoDto,
  ) {
    return this.service.requestMoreInfo(
      id,
      dto,
    );
  }

  // =========================================================
  // REJECT ESTATE AGENT APPLICATION
  // ADMIN ONLY
  // =========================================================

  @Patch(
    ":id/reject",
  )
  reject(
    @Param(
      "id",
      ParseUUIDPipe,
    )
    id: string,

    @Body()
    dto: RejectApplicationDto,
  ) {
    return this.service.reject(
      id,
      dto,
    );
  }

  // =========================================================
  // AUTHORISE ESTATE AGENT APPLICATION
  // ADMIN ONLY
  //
  // UNDER_REVIEW -> AUTHORISED
  // =========================================================

  @Patch(
    ":id/authorise",
  )
  authorise(
    @Param(
      "id",
      ParseUUIDPipe,
    )
    id: string,
  ) {
    return this.service.authorise(
      id,
    );
  }

  // =========================================================
  // SEND ESTATE AGENT AGREEMENT
  // ADMIN ONLY
  //
  // AUTHORISED
  //     ↓
  // Agreement created
  //     ↓
  // Agreement email sent
  //     ↓
  // AGREEMENT_SENT
  // =========================================================

  @Post(
    ":id/send-agreement",
  )
  sendAgreement(
    @Param(
      "id",
      ParseUUIDPipe,
    )
    id: string,
  ) {
    return this.service.sendAgreement(
      id,
    );
  }

  // =========================================================
  // MARK AGREEMENT AS SIGNED
  // ADMIN ONLY / RECOVERY ENDPOINT
  //
  // Normally the Estate Agent signs from the onboarding page.
  // This endpoint can still be used by Admin for recovery
  // or synchronisation.
  // =========================================================

  @Patch(
    ":id/agreement-signed",
  )
  markAgreementSigned(
    @Param(
      "id",
      ParseUUIDPipe,
    )
    id: string,
  ) {
    return this.service.markAgreementSigned(
      id,
    );
  }

  // =========================================================
  // SEND DIRECT DEBIT REQUEST
  // ADMIN ONLY
  //
  // AGREEMENT SIGNED
  //        ↓
  // Admin clicks "Send Direct Debit request"
  //        ↓
  // Estate Agent receives email
  //        ↓
  // PAYMENT_SETUP_PENDING
  // =========================================================

  @Post(
    ":id/send-direct-debit-request",
  )
  sendDirectDebitRequest(
    @Param(
      "id",
      ParseUUIDPipe,
    )
    id: string,
  ) {
    return this.service.sendDirectDebitRequest(
      id,
    );
  }

  // =========================================================
  // VALIDATE DIRECT DEBIT
  // ADMIN ONLY
  //
  // IMPORTANT:
  // This no longer starts Direct Debit setup.
  //
  // The Estate Agent must already have submitted their
  // Direct Debit information.
  //
  // SUBMITTED
  //     ↓
  // Admin validates
  //     ↓
  // ACTIVE
  //     ↓
  // FINAL_VALIDATION
  // =========================================================

  @Post(
    ":id/direct-debit",
  )
  validateDirectDebit(
    @Param(
      "id",
      ParseUUIDPipe,
    )
    id: string,
  ) {
    return this.service.createDirectDebit(
      id,
    );
  }

  // =========================================================
  // FINAL APPROVAL
  // ADMIN ONLY
  //
  // Signed agreement
  // +
  // ACTIVE Direct Debit
  // +
  // validationSuccessful = true
  //
  //        ↓
  //
  // Application APPROVED
  //
  //        ↓
  //
  // Estate Agent receives password setup email
  // =========================================================

  @Patch(
    ":id/final-approve",
  )
  finalApprove(
    @Param(
      "id",
      ParseUUIDPipe,
    )
    id: string,

    @Body()
    dto: FinalApproveDto,
  ) {
    return this.service.finalApprove(
      id,
      dto,
    );
  }
}