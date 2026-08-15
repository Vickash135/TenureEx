import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import {
  PrismaService,
} from "../database/prisma.service";

import {
  AgencyApplicationStatus,
  AgreementStatus,
  AgreementType,
  DirectDebitStatus,
  UserStatus,
} from "../generated/prisma/enums";

import {
  MailService,
} from "../mail/mail.service";

import {
  SignAgreementDto,
} from "./dto/sign-agreement.dto";

import {
  SubmitDirectDebitDto,
} from "./dto/submit-direct-debit.dto";

@Injectable()
export class AgentOnboardingService {
  constructor(
    private readonly prisma:
      PrismaService,

    private readonly mailService:
      MailService,
  ) {}

  // =========================================================
  // GET AGREEMENT
  // =========================================================

  async getAgreement(
    applicationId: string,
  ) {
    const application =
      await this.prisma
        .agencyApplication
        .findUnique({
          where: {
            id: applicationId,
          },
        });

    if (!application) {
      throw new NotFoundException(
        "Estate Agent application was not found.",
      );
    }

    const agreement =
      await this.prisma
        .agreement
        .findFirst({
          where: {
            applicationId,

            agreementType:
              AgreementType
                .ESTATE_AGENT_SERVICE,

            status: {
              in: [
                AgreementStatus.SENT,
                AgreementStatus.VIEWED,
                AgreementStatus.SIGNED,
              ],
            },
          },

          orderBy: {
            createdAt:
              "desc",
          },
        });

    if (!agreement) {
      throw new NotFoundException(
        "Estate Agent agreement was not found.",
      );
    }

    // ---------------------------------------------------------
    // First time the Estate Agent opens the agreement,
    // change SENT -> VIEWED.
    // ---------------------------------------------------------

    if (
      agreement.status ===
      AgreementStatus.SENT
    ) {
      const viewed =
        await this.prisma
          .agreement
          .update({
            where: {
              id:
                agreement.id,
            },

            data: {
              status:
                AgreementStatus.VIEWED,

              viewedAt:
                new Date(),
            },
          });

      return viewed;
    }

    return agreement;
  }

  // =========================================================
  // SIGN AGREEMENT
  //
  // AGREEMENT_SENT
  //      ↓
  // Estate Agent signs
  //      ↓
  // AGREEMENT_SIGNED
  //      ↓
  // Admin receives notification email
  //
  // IMPORTANT:
  // Direct Debit does NOT automatically start here.
  // Admin must send the Direct Debit request.
  // =========================================================

  async signAgreement(
    applicationId: string,
    dto: SignAgreementDto,
  ) {
    const application =
      await this.prisma
        .agencyApplication
        .findUnique({
          where: {
            id: applicationId,
          },

          include: {
            applicantUser:
              true,
          },
        });

    if (!application) {
      throw new NotFoundException(
        "Estate Agent application was not found.",
      );
    }

    // ---------------------------------------------------------
    // If already signed, return current state.
    // Prevent duplicate signing.
    // ---------------------------------------------------------

    const existingSigned =
      await this.prisma
        .agreement
        .findFirst({
          where: {
            applicationId,

            agreementType:
              AgreementType
                .ESTATE_AGENT_SERVICE,

            status:
              AgreementStatus.SIGNED,
          },

          orderBy: {
            createdAt:
              "desc",
          },
        });

    if (existingSigned) {
      return {
        message:
          "Agreement has already been signed.",

        agreement:
          existingSigned,

        nextStep:
          "WAIT_FOR_DIRECT_DEBIT_REQUEST",
      };
    }

    if (
      application.status !==
        AgencyApplicationStatus
          .AGREEMENT_SENT &&
      application.status !==
        AgencyApplicationStatus
          .AGREEMENT_PENDING
    ) {
      throw new BadRequestException(
        `Agreement cannot be signed from application status ${application.status}.`,
      );
    }

    const agreement =
      await this.prisma
        .agreement
        .findFirst({
          where: {
            applicationId,

            agreementType:
              AgreementType
                .ESTATE_AGENT_SERVICE,

            status: {
              in: [
                AgreementStatus.SENT,
                AgreementStatus.VIEWED,
              ],
            },
          },

          orderBy: {
            createdAt:
              "desc",
          },
        });

    if (!agreement) {
      throw new NotFoundException(
        "Active Estate Agent agreement was not found.",
      );
    }

    const signatureName =
      dto.signatureName.trim();

    if (!signatureName) {
      throw new BadRequestException(
        "Enter your full name to sign the agreement.",
      );
    }

    const now =
      new Date();

    const signedAgreement =
      await this.prisma
        .$transaction(
          async (tx) => {
            const signed =
              await tx
                .agreement
                .update({
                  where: {
                    id:
                      agreement.id,
                  },

                  data: {
                    status:
                      AgreementStatus
                        .SIGNED,

                    signedAt:
                      now,

                    signatureName,
                  },
                });

            await tx
              .agencyApplication
              .update({
                where: {
                  id:
                    applicationId,
                },

                data: {
                  status:
                    AgencyApplicationStatus
                      .AGREEMENT_SIGNED,
                },
              });

            await tx
              .user
              .update({
                where: {
                  id:
                    application
                      .applicantUserId,
                },

                data: {
                  status:
                    UserStatus
                      .AGREEMENT_SIGNED,
                },
              });

            await tx
              .applicationStatusHistory
              .create({
                data: {
                  applicationId,

                  previousStatus:
                    application.status,

                  newStatus:
                    AgencyApplicationStatus
                      .AGREEMENT_SIGNED,

                  note:
                    "Estate Agent digitally signed the service agreement.",
                },
              });

            return signed;
          },
        );

    // ---------------------------------------------------------
    // EMAIL ADMIN
    //
    // If email fails we do NOT undo the signed agreement.
    // Database remains the source of truth.
    // ---------------------------------------------------------

    const adminEmailSent =
      await this.trySendMail(
        "agreement-signed",
        () =>
          this.mailService
            .sendAdminAgreementSignedNotification({
              applicationId,

              applicantName:
                application.applicantName,

              businessName:
                application.businessName,

              email:
                application
                  .applicantUser
                  .email,
            }),
      );

    return {
      message:
        adminEmailSent
          ? "Agreement signed successfully. TenureEx has been notified."
          : "Agreement signed successfully. The Admin notification email could not be sent.",

      agreement:
        signedAgreement,

      adminEmailSent,

      nextStep:
        "WAIT_FOR_DIRECT_DEBIT_REQUEST",
    };
  }

  // =========================================================
  // START / OPEN DIRECT DEBIT
  //
  // IMPORTANT:
  //
  // OLD FLOW:
  //
  // Agreement signed
  //     ↓
  // Agent could immediately start Direct Debit
  //
  // NEW FLOW:
  //
  // Agreement signed
  //     ↓
  // Admin notified
  //     ↓
  // Admin sends Direct Debit request
  //     ↓
  // PAYMENT_SETUP_PENDING
  //     ↓
  // Agent opens Direct Debit page
  // =========================================================

  async startDirectDebit(
    applicationId: string,
  ) {
    const application =
      await this.prisma
        .agencyApplication
        .findUnique({
          where: {
            id:
              applicationId,
          },
        });

    if (!application) {
      throw new NotFoundException(
        "Estate Agent application was not found.",
      );
    }

    // ---------------------------------------------------------
    // Admin must send the Direct Debit request first.
    // ---------------------------------------------------------

    if (
      application.status !==
        AgencyApplicationStatus
          .PAYMENT_SETUP_PENDING &&
      application.status !==
        AgencyApplicationStatus
          .FINAL_VALIDATION
    ) {
      if (
        application.status ===
        AgencyApplicationStatus
          .AGREEMENT_SIGNED
      ) {
        throw new BadRequestException(
          "Your agreement has been signed. Please wait for TenureEx Admin to send your Direct Debit setup request.",
        );
      }

      throw new BadRequestException(
        `Direct Debit setup cannot be opened from application status ${application.status}.`,
      );
    }

    // ---------------------------------------------------------
    // Confirm signed agreement exists.
    // ---------------------------------------------------------

    const signedAgreement =
      await this.prisma
        .agreement
        .findFirst({
          where: {
            applicationId,

            agreementType:
              AgreementType
                .ESTATE_AGENT_SERVICE,

            status:
              AgreementStatus.SIGNED,
          },
        });

    if (!signedAgreement) {
      throw new BadRequestException(
        "A signed Estate Agent agreement is required before Direct Debit setup.",
      );
    }

    const existing =
      await this.prisma
        .directDebitSetup
        .findUnique({
          where: {
            applicationId,
          },
        });

    // ---------------------------------------------------------
    // Admin's sendDirectDebitRequest() should already have
    // created the DirectDebitSetup record with PENDING.
    // ---------------------------------------------------------

    if (!existing) {
      throw new BadRequestException(
        "Direct Debit setup has not been requested by TenureEx Admin yet.",
      );
    }

    if (
      existing.status ===
      DirectDebitStatus.CANCELLED
    ) {
      throw new BadRequestException(
        "This Direct Debit setup has been cancelled.",
      );
    }

    if (
      existing.status ===
      DirectDebitStatus.FAILED
    ) {
      throw new BadRequestException(
        existing.failureReason ||
          "This Direct Debit setup has failed. Please contact TenureEx.",
      );
    }

    return existing;
  }

  // =========================================================
  // SUBMIT DIRECT DEBIT
  //
  // PENDING
  //      ↓
  // Estate Agent submits
  //      ↓
  // SUBMITTED
  //      ↓
  // Admin receives email
  //      ↓
  // Admin validates
  //      ↓
  // ACTIVE
  //      ↓
  // FINAL_VALIDATION
  // =========================================================

  async submitDirectDebit(
    applicationId: string,
    dto: SubmitDirectDebitDto,
  ) {
    const application =
      await this.prisma
        .agencyApplication
        .findUnique({
          where: {
            id:
              applicationId,
          },

          include: {
            applicantUser:
              true,
          },
        });

    if (!application) {
      throw new NotFoundException(
        "Estate Agent application was not found.",
      );
    }

    if (
      application.status !==
      AgencyApplicationStatus
        .PAYMENT_SETUP_PENDING
    ) {
      throw new BadRequestException(
        `Direct Debit cannot be submitted from application status ${application.status}.`,
      );
    }

    const directDebit =
      await this.prisma
        .directDebitSetup
        .findUnique({
          where: {
            applicationId,
          },
        });

    if (!directDebit) {
      throw new NotFoundException(
        "Direct Debit setup was not found.",
      );
    }

    // ---------------------------------------------------------
    // Already submitted.
    // ---------------------------------------------------------

    if (
      directDebit.status ===
        DirectDebitStatus.SUBMITTED ||
      directDebit.status ===
        DirectDebitStatus.UNDER_VALIDATION
    ) {
      return {
        message:
          "Your Direct Debit information has already been submitted and is awaiting TenureEx validation.",

        directDebit,
      };
    }

    if (
      directDebit.status ===
      DirectDebitStatus.ACTIVE
    ) {
      return {
        message:
          "Your Direct Debit is already active.",

        directDebit,
      };
    }

    if (
      directDebit.status !==
        DirectDebitStatus.PENDING &&
      directDebit.status !==
        DirectDebitStatus.NOT_STARTED
    ) {
      throw new BadRequestException(
        `Direct Debit cannot be submitted from status ${directDebit.status}.`,
      );
    }

    const customerReference =
      dto
        .providerCustomerReference
        ?.trim();

    const mandateReference =
      dto
        .providerMandateReference
        ?.trim();

    if (
      !customerReference ||
      !mandateReference
    ) {
      throw new BadRequestException(
        "Direct Debit provider references are required.",
      );
    }

    const now =
      new Date();

    const updated =
      await this.prisma
        .$transaction(
          async (tx) => {
            const saved =
              await tx
                .directDebitSetup
                .update({
                  where: {
                    applicationId,
                  },

                  data: {
                    provider:
                      "DEVELOPMENT_PROVIDER",

                    providerCustomerReference:
                      customerReference,

                    providerMandateReference:
                      mandateReference,

                    status:
                      DirectDebitStatus
                        .SUBMITTED,

                    submittedAt:
                      now,

                    validatedAt:
                      null,

                    failedAt:
                      null,

                    failureReason:
                      null,
                  },
                });

            // -------------------------------------------------
            // IMPORTANT:
            //
            // DO NOT move to FINAL_VALIDATION here.
            //
            // Admin has not validated Direct Debit yet.
            //
            // Keep application in PAYMENT_SETUP_PENDING.
            // -------------------------------------------------

            await tx
              .agencyApplication
              .update({
                where: {
                  id:
                    applicationId,
                },

                data: {
                  status:
                    AgencyApplicationStatus
                      .PAYMENT_SETUP_PENDING,
                },
              });

            await tx
              .user
              .update({
                where: {
                  id:
                    application
                      .applicantUserId,
                },

                data: {
                  status:
                    UserStatus
                      .PAYMENT_SETUP_PENDING,
                },
              });

            await tx
              .applicationStatusHistory
              .create({
                data: {
                  applicationId,

                  previousStatus:
                    application.status,

                  newStatus:
                    AgencyApplicationStatus
                      .PAYMENT_SETUP_PENDING,

                  note:
                    "Estate Agent submitted Direct Debit information. TenureEx validation is required.",
                },
              });

            return saved;
          },
        );

    // ---------------------------------------------------------
    // NOTIFY ADMIN
    // ---------------------------------------------------------

    const adminEmailSent =
      await this.trySendMail(
        "direct-debit-submitted",
        () =>
          this.mailService
            .sendAdminDirectDebitSubmittedNotification({
              applicationId,

              applicantName:
                application
                  .applicantName,

              businessName:
                application
                  .businessName,

              email:
                application
                  .applicantUser
                  .email,
            }),
      );

    return {
      message:
        adminEmailSent
          ? "Direct Debit information submitted successfully. TenureEx Admin has been notified."
          : "Direct Debit information submitted successfully and is awaiting TenureEx validation.",

      directDebit:
        updated,

      adminEmailSent,

      nextStep:
        "WAIT_FOR_ADMIN_VALIDATION",
    };
  }

  // =========================================================
  // PRIVATE MAIL HELPER
  // =========================================================

  private async trySendMail(
    label: string,

    operation:
      () => Promise<unknown>,
  ): Promise<boolean> {
    try {
      await operation();

      return true;
    } catch (error) {
      console.error(
        `[TenureEx Mail] ${label} failed:`,
        error,
      );

      return false;
    }
  }
}