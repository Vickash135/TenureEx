import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import * as argon2 from "argon2";
import { randomBytes } from "crypto";

import { PrismaService } from "../database/prisma.service";
import {
  AgencyApplicationStatus,
  AgreementStatus,
  AgreementType,
  DirectDebitStatus,
  UserStatus,
  UserType,
} from "../generated/prisma/enums";
import { MailService } from "../mail/mail.service";

import { FinalApproveDto } from "./dto/final-approve.dto";
import { RejectApplicationDto } from "./dto/reject-application.dto";
import { RequestMoreInfoDto } from "./dto/request-more-info.dto";
import { ReviewApplicationDto } from "./dto/review-application.dto";

@Injectable()
export class AdminAgentApplicationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  // =========================================================
  // GET ALL ESTATE AGENT APPLICATIONS
  // =========================================================

  async findAll() {
    return this.prisma.agencyApplication.findMany({
      orderBy: {
        createdAt: "desc",
      },

      include: {
        applicantUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            userType: true,
            status: true,
            emailVerified: true,
            phoneVerified: true,
          },
        },

        reviewerUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },

        agreements: {
          select: {
            id: true,
            agreementType: true,
            status: true,
            sentAt: true,
            signedAt: true,
            createdAt: true,
          },

          orderBy: {
            createdAt: "desc",
          },
        },

        directDebitSetup: true,
      },
    });
  }

  // =========================================================
  // GET ONE ESTATE AGENT APPLICATION
  // =========================================================

  async findOne(id: string) {
    const application =
      await this.prisma.agencyApplication.findUnique({
        where: {
          id,
        },

        include: {
          applicantUser: true,
          reviewerUser: true,

          agreements: {
            orderBy: {
              createdAt: "desc",
            },
          },

          directDebitSetup: true,

          statusHistory: {
            orderBy: {
              createdAt: "asc",
            },
          },
        },
      });

    if (!application) {
      throw new NotFoundException(
        "Estate Agent application was not found.",
      );
    }

    return application;
  }

  // =========================================================
  // DELETE ESTATE AGENT APPLICATION + USER
  // ADMIN ONLY
  // =========================================================

  async remove(id: string) {
    const application =
      await this.prisma.agencyApplication.findUnique({
        where: {
          id,
        },

        include: {
          applicantUser: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              userType: true,
            },
          },

          agency: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

    if (!application) {
      throw new NotFoundException(
        "Estate Agent application was not found.",
      );
    }

    if (
      application.applicantUser.userType !==
      UserType.ESTATE_AGENT
    ) {
      throw new BadRequestException(
        "Only Estate Agent accounts can be deleted from this admin screen.",
      );
    }

    const userId =
      application.applicantUser.id;

    await this.prisma.$transaction(
      async (tx) => {
        // Optional references to the user must be cleared first.
        await tx.auditLog.updateMany({
          where: {
            actorUserId: userId,
          },
          data: {
            actorUserId: null,
          },
        });

        await tx.applicationStatusHistory.updateMany({
          where: {
            changedByUserId: userId,
          },
          data: {
            changedByUserId: null,
          },
        });

        await tx.agencyApplication.updateMany({
          where: {
            reviewerUserId: userId,
          },
          data: {
            reviewerUserId: null,
          },
        });

        // Agreement.createdByUserId is required, so agreements
        // referencing the deleted Estate Agent must be removed.
        await tx.agreement.deleteMany({
          where: {
            OR: [
              {
                applicationId: id,
              },
              {
                createdByUserId: userId,
              },
              {
                signerUserId: userId,
              },
            ],
          },
        });

        // If onboarding already created an Agency, removing it
        // cascades through agency memberships, branches, roles,
        // invitations and other agency-owned setup records.
        if (application.agency) {
          await tx.agency.delete({
            where: {
              id: application.agency.id,
            },
          });
        }

        // Direct Debit setup and status history cascade from the
        // AgencyApplication according to the Prisma schema.
        await tx.agencyApplication.delete({
          where: {
            id,
          },
        });

        // User-owned verification tokens, OTPs, refresh tokens
        // and agency memberships configured with Cascade are
        // removed automatically.
        await tx.user.delete({
          where: {
            id: userId,
          },
        });
      },
    );

    return {
      message:
        "Estate Agent account and application deleted successfully.",

      deleted: {
        applicationId: id,
        userId,
        email:
          application.applicantUser.email,
        agencyId:
          application.agency?.id ??
          null,
      },
    };
  }

  // =========================================================
  // START / RESTART APPLICATION REVIEW
  // PENDING_REVIEW -> UNDER_REVIEW
  //
  // IMPORTANT:
  // If this application came back after a "More information"
  // request, the response is deliberately NOT deleted.
  // The Admin dashboard must still be able to review it.
  // =========================================================

  async startReview(
    id: string,
    dto: ReviewApplicationDto,
  ) {
    const application =
      await this.getApplication(id);

    if (
      application.status !==
      AgencyApplicationStatus.PENDING_REVIEW
    ) {
      throw new BadRequestException(
        `Application cannot start review from status ${application.status}.`,
      );
    }

    const now = new Date();

    const updated =
      await this.prisma.$transaction(
        async (tx) => {
          const saved =
            await tx.agencyApplication.update({
              where: {
                id,
              },

              data: {
                status:
                  AgencyApplicationStatus.UNDER_REVIEW,

                reviewStartedAt:
                  application.reviewStartedAt ??
                  now,
              },
            });

          await tx.user.update({
            where: {
              id: application.applicantUserId,
            },

            data: {
              status:
                UserStatus.PENDING_REVIEW,
            },
          });

          await tx.applicationStatusHistory.create({
            data: {
              applicationId: id,

              previousStatus:
                AgencyApplicationStatus.PENDING_REVIEW,

              newStatus:
                AgencyApplicationStatus.UNDER_REVIEW,

              note:
                dto.note?.trim() ||
                (
                  application.additionalInfoRespondedAt &&
                  !application.additionalInfoResolvedAt
                    ? "TenureEx review restarted after additional information was received."
                    : "TenureEx review started."
                ),
            },
          });

          return saved;
        },
      );

    return {
      message:
        application.additionalInfoRespondedAt &&
        !application.additionalInfoResolvedAt
          ? "Application review restarted. The Estate Agent response is ready to review."
          : "Application review started.",

      application: updated,
    };
  }

  // =========================================================
  // REQUEST MORE INFORMATION
  // ADMIN -> ESTATE AGENT
  // =========================================================

  async requestMoreInfo(
    id: string,
    dto: RequestMoreInfoDto,
  ) {
    const application =
      await this.getApplication(id);

    if (
      application.status !==
        AgencyApplicationStatus.UNDER_REVIEW &&
      application.status !==
        AgencyApplicationStatus.PENDING_REVIEW
    ) {
      throw new BadRequestException(
        `More information cannot be requested from status ${application.status}.`,
      );
    }

    const message =
      dto.message.trim();

    if (!message) {
      throw new BadRequestException(
        "Enter the information you need from the Estate Agent.",
      );
    }

    const now = new Date();

    const previousStatus =
      application.status;

    const updated =
      await this.prisma.$transaction(
        async (tx) => {
          const saved =
            await tx.agencyApplication.update({
              where: {
                id,
              },

              data: {
                status:
                  AgencyApplicationStatus.MORE_INFORMATION_REQUIRED,

                additionalInfoRequest:
                  message,

                additionalInfoRequestedAt:
                  now,

                // A new request starts a fresh response cycle.
                additionalInfoResponse:
                  null,

                additionalInfoRespondedAt:
                  null,

                additionalInfoResolvedAt:
                  null,
              },
            });

          await tx.user.update({
            where: {
              id:
                application.applicantUserId,
            },

            data: {
              status:
                UserStatus.MORE_INFORMATION_REQUIRED,
            },
          });

          await tx.applicationStatusHistory.create({
            data: {
              applicationId:
                id,

              previousStatus,

              newStatus:
                AgencyApplicationStatus.MORE_INFORMATION_REQUIRED,

              note:
                message,
            },
          });

          return saved;
        },
      );

    const emailSent =
      await this.trySendMail(
        "request-more-information",
        () =>
          this.mailService.sendAgentMoreInformationRequest({
            email:
              application.applicantUser.email,

            firstName:
              application.applicantUser.firstName,

            applicationId:
              id,

            message,
          }),
      );

    return {
      message:
        emailSent
          ? "Additional information has been requested and the Estate Agent has been emailed."
          : "Additional information has been requested, but the notification email could not be sent.",

      emailSent,
      application: updated,
    };
  }

  // =========================================================
  // REJECT APPLICATION
  // =========================================================

  async reject(
    id: string,
    dto: RejectApplicationDto,
  ) {
    const application =
      await this.getApplication(id);

    const allowedStatuses:
      AgencyApplicationStatus[] = [
        AgencyApplicationStatus.PENDING_REVIEW,
        AgencyApplicationStatus.UNDER_REVIEW,
        AgencyApplicationStatus.MORE_INFORMATION_REQUIRED,
      ];

    if (
      !allowedStatuses.includes(
        application.status,
      )
    ) {
      throw new BadRequestException(
        `Application cannot be rejected from status ${application.status}.`,
      );
    }

    const reason =
      dto.reason.trim();

    const now = new Date();

    const previousStatus =
      application.status;

    const updated =
      await this.prisma.$transaction(
        async (tx) => {
          const saved =
            await tx.agencyApplication.update({
              where: {
                id,
              },

              data: {
                status:
                  AgencyApplicationStatus.REJECTED,

                rejectedAt:
                  now,

                reviewedAt:
                  now,

                rejectionReason:
                  reason,

                additionalInfoResolvedAt:
                  application.additionalInfoRespondedAt
                    ? now
                    : application.additionalInfoResolvedAt,
              },
            });

          await tx.user.update({
            where: {
              id:
                application.applicantUserId,
            },

            data: {
              status:
                UserStatus.REJECTED,
            },
          });

          await tx.applicationStatusHistory.create({
            data: {
              applicationId:
                id,

              previousStatus,

              newStatus:
                AgencyApplicationStatus.REJECTED,

              note:
                reason,
            },
          });

          return saved;
        },
      );

    return {
      message:
        "Estate Agent application rejected.",

      application:
        updated,
    };
  }

  // =========================================================
  // AUTHORISE APPLICATION
  // UNDER_REVIEW -> AUTHORISED
  // =========================================================

  async authorise(id: string) {
    const application =
      await this.getApplication(id);

    if (
      application.status !==
      AgencyApplicationStatus.UNDER_REVIEW
    ) {
      throw new BadRequestException(
        "Application must be under review before it can be authorised.",
      );
    }

    const now = new Date();

    const updated =
      await this.prisma.$transaction(
        async (tx) => {
          const saved =
            await tx.agencyApplication.update({
              where: {
                id,
              },

              data: {
                status:
                  AgencyApplicationStatus.AUTHORISED,

                reviewedAt:
                  now,

                additionalInfoResolvedAt:
                  application.additionalInfoRespondedAt
                    ? now
                    : application.additionalInfoResolvedAt,
              },
            });

          await tx.applicationStatusHistory.create({
            data: {
              applicationId:
                id,

              previousStatus:
                AgencyApplicationStatus.UNDER_REVIEW,

              newStatus:
                AgencyApplicationStatus.AUTHORISED,

              note:
                "Estate Agent application authorised by TenureEx.",
            },
          });

          return saved;
        },
      );

    return {
      message:
        "Application authorised successfully.",

      application:
        updated,
    };
  }

  // =========================================================
  // SEND DIGITAL AGREEMENT
  // ADMIN -> ESTATE AGENT
  // =========================================================

  async sendAgreement(id: string) {
    const application =
      await this.getApplication(id);

    if (
      application.status !==
        AgencyApplicationStatus.AUTHORISED &&
      application.status !==
        AgencyApplicationStatus.AGREEMENT_PENDING
    ) {
      throw new BadRequestException(
        "Application must be authorised before an agreement can be sent.",
      );
    }

    const existingAgreement =
      await this.prisma.agreement.findFirst({
        where: {
          applicationId:
            id,

          agreementType:
            AgreementType.ESTATE_AGENT_SERVICE,

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

    if (existingAgreement) {
      return {
        message:
          "An active agreement already exists for this application.",

        agreement:
          existingAgreement,
      };
    }

    const now =
      new Date();

    const agreement =
      await this.prisma.$transaction(
        async (tx) => {
          const created =
            await tx.agreement.create({
              data: {
                applicationId:
                  id,

                createdByUserId:
                  application.applicantUserId,

                signerUserId:
                  application.applicantUserId,

                agreementType:
                  AgreementType.ESTATE_AGENT_SERVICE,

                status:
                  AgreementStatus.SENT,

                title:
                  "TenureEx Estate Agent Service Agreement",

                version:
                  "1.0",

                termsSnapshot: {
                  applicationId:
                    id,

                  applicantName:
                    application.applicantName,

                  businessName:
                    application.businessName,

                  companyNumber:
                    application.companyNumber,

                  registrationType:
                    application.registrationType,
                },

                sentAt:
                  now,

                expiresAt:
                  new Date(
                    Date.now() +
                      14 *
                        24 *
                        60 *
                        60 *
                        1000,
                  ),
              },
            });

          await tx.agencyApplication.update({
            where: {
              id,
            },

            data: {
              status:
                AgencyApplicationStatus.AGREEMENT_SENT,
            },
          });

          await tx.user.update({
            where: {
              id:
                application.applicantUserId,
            },

            data: {
              status:
                UserStatus.AGREEMENT_PENDING,
            },
          });

          await tx.applicationStatusHistory.create({
            data: {
              applicationId:
                id,

              previousStatus:
                application.status,

              newStatus:
                AgencyApplicationStatus.AGREEMENT_SENT,

              note:
                "Digital Estate Agent service agreement sent.",
            },
          });

          return created;
        },
      );

    const emailSent =
      await this.trySendMail(
        "send-agreement",
        () =>
          this.mailService.sendAgentAgreement({
            email:
              application.applicantUser.email,

            firstName:
              application.applicantUser.firstName,

            applicationId:
              id,
          }),
      );

    return {
      message:
        emailSent
          ? "Digital agreement created and the agreement email was sent."
          : "Digital agreement created, but the agreement email could not be sent.",

      emailSent,
      agreement,
    };
  }

  // =========================================================
  // MARK AGREEMENT AS SIGNED
  //
  // NOTE:
  // The Estate Agent onboarding service should normally mark
  // the agreement as signed. This Admin endpoint is retained
  // for synchronisation / administrative recovery.
  // =========================================================

  async markAgreementSigned(id: string) {
    const application =
      await this.getApplication(id);

    const agreement =
      await this.prisma.agreement.findFirst({
        where: {
          applicationId:
            id,

          agreementType:
            AgreementType.ESTATE_AGENT_SERVICE,

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
        "Active Estate Agent agreement was not found.",
      );
    }

    if (
      agreement.status ===
      AgreementStatus.SIGNED
    ) {
      await this.prisma.$transaction(
        async (tx) => {
          if (
            application.status ===
            AgencyApplicationStatus.AGREEMENT_SENT
          ) {
            await tx.agencyApplication.update({
              where: {
                id,
              },

              data: {
                status:
                  AgencyApplicationStatus.AGREEMENT_SIGNED,
              },
            });
          }

          await tx.user.update({
            where: {
              id:
                application.applicantUserId,
            },

            data: {
              status:
                UserStatus.AGREEMENT_SIGNED,
            },
          });
        },
      );

      return {
        message:
          "Agreement is already signed.",

        agreement,
      };
    }

    if (
      application.status !==
      AgencyApplicationStatus.AGREEMENT_SENT
    ) {
      throw new BadRequestException(
        `Agreement cannot be signed from application status ${application.status}.`,
      );
    }

    const now =
      new Date();

    const updatedAgreement =
      await this.prisma.$transaction(
        async (tx) => {
          const saved =
            await tx.agreement.update({
              where: {
                id:
                  agreement.id,
              },

              data: {
                status:
                  AgreementStatus.SIGNED,

                signedAt:
                  now,
              },
            });

          await tx.agencyApplication.update({
            where: {
              id,
            },

            data: {
              status:
                AgencyApplicationStatus.AGREEMENT_SIGNED,
            },
          });

          await tx.user.update({
            where: {
              id:
                application.applicantUserId,
            },

            data: {
              status:
                UserStatus.AGREEMENT_SIGNED,
            },
          });

          await tx.applicationStatusHistory.create({
            data: {
              applicationId:
                id,

              previousStatus:
                application.status,

              newStatus:
                AgencyApplicationStatus.AGREEMENT_SIGNED,

              note:
                "Digital agreement signed.",
            },
          });

          return saved;
        },
      );

    const adminEmailSent =
      await this.trySendMail(
        "agreement-signed-admin-notification",
        () =>
          this.mailService.sendAdminAgreementSignedNotification({
            applicationId:
              id,

            applicantName:
              application.applicantName,

            businessName:
              application.businessName,

            email:
              application.applicantUser.email,
          }),
      );

    return {
      message:
        adminEmailSent
          ? "Agreement marked as signed and TenureEx Admin was notified."
          : "Agreement marked as signed, but the Admin notification email could not be sent.",

      adminEmailSent,

      agreement:
        updatedAgreement,

      nextStep:
        "SEND_DIRECT_DEBIT_REQUEST",
    };
  }

  // =========================================================
  // SEND DIRECT DEBIT REQUEST
  // ADMIN -> ESTATE AGENT
  //
  // This is intentionally separate from validation.
  // The Admin first sends the request.
  // The Estate Agent then submits their Direct Debit details.
  // =========================================================

  async sendDirectDebitRequest(
    id: string,
  ) {
    const application =
      await this.getApplication(id);

    const signedAgreement =
      await this.prisma.agreement.findFirst({
        where: {
          applicationId:
            id,

          agreementType:
            AgreementType.ESTATE_AGENT_SERVICE,

          status:
            AgreementStatus.SIGNED,
        },

        orderBy: {
          createdAt:
            "desc",
        },
      });

    if (!signedAgreement) {
      throw new BadRequestException(
        "Agreement must be signed before the Direct Debit request can be sent.",
      );
    }

    const existing =
      await this.prisma.directDebitSetup.findUnique({
        where: {
          applicationId:
            id,
        },
      });

    if (
      existing?.status ===
        DirectDebitStatus.SUBMITTED ||
      existing?.status ===
        DirectDebitStatus.UNDER_VALIDATION ||
      existing?.status ===
        DirectDebitStatus.ACTIVE
    ) {
      throw new BadRequestException(
        `Direct Debit request cannot be sent because the current Direct Debit status is ${existing.status}.`,
      );
    }

    const previousStatus =
      application.status;

    const directDebit =
      await this.prisma.$transaction(
        async (tx) => {
          const saved =
            existing
              ? await tx.directDebitSetup.update({
                  where: {
                    applicationId:
                      id,
                  },

                  data: {
                    status:
                      DirectDebitStatus.PENDING,

                    failedAt:
                      null,

                    failureReason:
                      null,
                  },
                })
              : await tx.directDebitSetup.create({
                  data: {
                    applicationId:
                      id,

                    provider:
                      "DEVELOPMENT_PROVIDER",

                    status:
                      DirectDebitStatus.PENDING,
                  },
                });

          await tx.agencyApplication.update({
            where: {
              id,
            },

            data: {
              status:
                AgencyApplicationStatus.PAYMENT_SETUP_PENDING,
            },
          });

          await tx.user.update({
            where: {
              id:
                application.applicantUserId,
            },

            data: {
              status:
                UserStatus.PAYMENT_SETUP_PENDING,
            },
          });

          if (
            previousStatus !==
            AgencyApplicationStatus.PAYMENT_SETUP_PENDING
          ) {
            await tx.applicationStatusHistory.create({
              data: {
                applicationId:
                  id,

                previousStatus,

                newStatus:
                  AgencyApplicationStatus.PAYMENT_SETUP_PENDING,

                note:
                  "Direct Debit setup requested from the Estate Agent.",
              },
            });
          }

          return saved;
        },
      );

    const emailSent =
      await this.trySendMail(
        "send-direct-debit-request",
        () =>
          this.mailService.sendAgentDirectDebitRequest({
            email:
              application.applicantUser.email,

            firstName:
              application.applicantUser.firstName,

            applicationId:
              id,
          }),
      );

    return {
      message:
        emailSent
          ? "Direct Debit request sent to the Estate Agent."
          : "Direct Debit request was created, but the email could not be sent.",

      emailSent,
      directDebit,
    };
  }

  // =========================================================
  // VALIDATE DIRECT DEBIT
  // ADMIN ONLY
  //
  // Estate Agent must already have submitted it.
  // SUBMITTED / UNDER_VALIDATION -> ACTIVE
  // Application -> FINAL_VALIDATION
  // =========================================================

  async createDirectDebit(id: string) {
    const application =
      await this.getApplication(id);

    const signedAgreement =
      await this.prisma.agreement.findFirst({
        where: {
          applicationId:
            id,

          agreementType:
            AgreementType.ESTATE_AGENT_SERVICE,

          status:
            AgreementStatus.SIGNED,
        },

        orderBy: {
          createdAt:
            "desc",
        },
      });

    if (!signedAgreement) {
      throw new BadRequestException(
        "Agreement must be signed before Direct Debit can be validated.",
      );
    }

    const existing =
      await this.prisma.directDebitSetup.findUnique({
        where: {
          applicationId:
            id,
        },
      });

    if (!existing) {
      throw new BadRequestException(
        "Direct Debit setup has not been started.",
      );
    }

    if (
      existing.status ===
      DirectDebitStatus.ACTIVE
    ) {
      return {
        message:
          "Direct Debit has already been validated.",

        directDebit:
          existing,

        nextStep:
          "FINAL_APPROVAL",
      };
    }

    const allowedStatuses:
      DirectDebitStatus[] = [
        DirectDebitStatus.SUBMITTED,
        DirectDebitStatus.UNDER_VALIDATION,
      ];

    if (
      !allowedStatuses.includes(
        existing.status,
      )
    ) {
      if (
        existing.status ===
        DirectDebitStatus.PENDING
      ) {
        throw new BadRequestException(
          "The Estate Agent has not submitted the Direct Debit details yet.",
        );
      }

      throw new BadRequestException(
        `Direct Debit cannot be validated from status ${existing.status}.`,
      );
    }

    const now =
      new Date();

    const previousStatus =
      application.status;

    const result =
      await this.prisma.$transaction(
        async (tx) => {
          const updatedDirectDebit =
            await tx.directDebitSetup.update({
              where: {
                applicationId:
                  id,
              },

              data: {
                status:
                  DirectDebitStatus.ACTIVE,

                validatedAt:
                  now,

                failedAt:
                  null,

                failureReason:
                  null,
              },
            });

          await tx.agencyApplication.update({
            where: {
              id,
            },

            data: {
              status:
                AgencyApplicationStatus.FINAL_VALIDATION,
            },
          });

          await tx.user.update({
            where: {
              id:
                application.applicantUserId,
            },

            data: {
              status:
                UserStatus.FINAL_VALIDATION,
            },
          });

          if (
            previousStatus !==
            AgencyApplicationStatus.FINAL_VALIDATION
          ) {
            await tx.applicationStatusHistory.create({
              data: {
                applicationId:
                  id,

                previousStatus,

                newStatus:
                  AgencyApplicationStatus.FINAL_VALIDATION,

                note:
                  "Direct Debit validated successfully. Application moved to final validation.",
              },
            });
          }

          return updatedDirectDebit;
        },
      );

    return {
      message:
        "Direct Debit validated successfully.",

      directDebit:
        result,

      nextStep:
        "FINAL_APPROVAL",
    };
  }

  // =========================================================
  // FINAL APPROVAL
  //
  // IMPORTANT CHANGE:
  // We no longer generate a temporary password for the user.
  //
  // Instead:
  // 1. Application becomes APPROVED.
  // 2. Agency is created / activated.
  // 3. Primary Estate Agent receives a secure one-time
  //    password setup link.
  // 4. /auth/reset-password activates the user after they
  //    choose their own password.
  // =========================================================

  async finalApprove(
    id: string,
    dto: FinalApproveDto,
  ) {
    const application =
      await this.getApplication(id);

    if (
      !dto.validationSuccessful
    ) {
      throw new BadRequestException(
        "Final validation must be successful before approval.",
      );
    }

    if (
      application.status ===
      AgencyApplicationStatus.APPROVED
    ) {
      throw new BadRequestException(
        "Estate Agent application has already been approved.",
      );
    }

    if (
      application.status ===
      AgencyApplicationStatus.REJECTED
    ) {
      throw new BadRequestException(
        "A rejected Estate Agent application cannot be approved.",
      );
    }

    const directDebit =
      await this.prisma.directDebitSetup.findUnique({
        where: {
          applicationId:
            id,
        },
      });

    if (!directDebit) {
      throw new BadRequestException(
        "Direct Debit setup is required before final approval.",
      );
    }

    if (
      directDebit.status !==
      DirectDebitStatus.ACTIVE
    ) {
      throw new BadRequestException(
        `Direct Debit must be ACTIVE before final approval. Current status: ${directDebit.status}.`,
      );
    }

    const agreement =
      await this.prisma.agreement.findFirst({
        where: {
          applicationId:
            id,

          agreementType:
            AgreementType.ESTATE_AGENT_SERVICE,

          status:
            AgreementStatus.SIGNED,
        },

        orderBy: {
          createdAt:
            "desc",
        },
      });

    if (!agreement) {
      throw new BadRequestException(
        "A signed Estate Agent agreement is required before approval.",
      );
    }

    const rawPasswordToken =
      randomBytes(
        32,
      ).toString(
        "hex",
      );

    const passwordTokenHash =
      await argon2.hash(
        rawPasswordToken,
      );

    // Give the newly approved Estate Agent 24 hours
    // to choose their password.
    const passwordTokenExpiresAt =
      new Date(
        Date.now() +
          24 *
            60 *
            60 *
            1000,
      );

    const now =
      new Date();

    const result =
      await this.prisma.$transaction(
        async (tx) => {
          // Invalidate any old unused password setup/reset links.
          await tx.passwordResetToken.updateMany({
            where: {
              userId:
                application.applicantUserId,

              usedAt:
                null,
            },

            data: {
              usedAt:
                now,
            },
          });

          await tx.passwordResetToken.create({
            data: {
              userId:
                application.applicantUserId,

              tokenHash:
                passwordTokenHash,

              expiresAt:
                passwordTokenExpiresAt,
            },
          });

          const updatedApplication =
            await tx.agencyApplication.update({
              where: {
                id,
              },

              data: {
                status:
                  AgencyApplicationStatus.APPROVED,

                approvedAt:
                  now,

                reviewedAt:
                  application.reviewedAt ??
                  now,

                additionalInfoResolvedAt:
                  application.additionalInfoRespondedAt
                    ? application.additionalInfoResolvedAt ??
                      now
                    : application.additionalInfoResolvedAt,
              },
            });

          // The account is approved but the Estate Agent still
          // needs to create their password.
          const user =
            await tx.user.update({
              where: {
                id:
                  application.applicantUserId,
              },

              data: {
                passwordHash:
                  null,

                status:
                  UserStatus.FINAL_VALIDATION,

                activatedAt:
                  null,

                mustSetPassword:
                  true,

                mustChangePassword:
                  false,
              },
            });

          let agency =
            await tx.agency.findUnique({
              where: {
                applicationId:
                  id,
              },
            });

          if (!agency) {
            agency =
              await tx.agency.create({
                data: {
                  applicationId:
                    id,

                  name:
                    application.businessName ||
                    application.applicantName,

                  registrationType:
                    application.registrationType,

                  companyNumber:
                    application.companyNumber,

                  contactEmail:
                    application.contactEmail,

                  contactPhone:
                    application.contactPhone,

                  businessDetails:
                    application.businessDetails,

                  authorised:
                    true,

                  active:
                    true,

                  activatedAt:
                    now,
                },
              });
          } else {
            agency =
              await tx.agency.update({
                where: {
                  id:
                    agency.id,
                },

                data: {
                  authorised:
                    true,

                  active:
                    true,

                  activatedAt:
                    now,
                },
              });
          }

          const membership =
            await tx.agencyUser.findUnique({
              where: {
                agencyId_userId: {
                  agencyId:
                    agency.id,

                  userId:
                    user.id,
                },
              },
            });

          if (!membership) {
            await tx.agencyUser.create({
              data: {
                agencyId:
                  agency.id,

                userId:
                  user.id,

                jobTitle:
                  "Agency Administrator",

                isPrimary:
                  true,

                invitedAt:
                  now,

                joinedAt:
                  null,
              },
            });
          }

          await tx.applicationStatusHistory.create({
            data: {
              applicationId:
                id,

              previousStatus:
                application.status,

              newStatus:
                AgencyApplicationStatus.APPROVED,

              note:
                dto.note?.trim() ||
                "Final validation completed. Estate Agent application approved and password setup requested.",
            },
          });

          return {
            application:
              updatedApplication,

            user,
            agency,
          };
        },
      );

    const emailSent =
      await this.trySendMail(
        "final-approval-password-setup",
        () =>
          this.mailService.sendAgentApprovalAndPasswordSetup({
            email:
              result.user.email,

            firstName:
              application.applicantUser.firstName,

            applicationId:
              id,

            passwordToken:
              rawPasswordToken,
          }),
      );

    return {
      message:
        emailSent
          ? "Estate Agent application approved. A password setup email has been sent."
          : "Estate Agent application approved, but the password setup email could not be sent.",

      emailSent,

      applicationId:
        result.application.id,

      status:
        result.application.status,

      user: {
        id:
          result.user.id,

        email:
          result.user.email,

        status:
          result.user.status,

        mustSetPassword:
          result.user.mustSetPassword,
      },

      agency: {
        id:
          result.agency.id,

        name:
          result.agency.name,

        active:
          result.agency.active,
      },

      ...(process.env.NODE_ENV !==
      "production"
        ? {
            developmentPasswordSetupToken:
              rawPasswordToken,
          }
        : {}),
    };
  }

  // =========================================================
  // PRIVATE - GET APPLICATION
  // =========================================================

  private async getApplication(
    id: string,
  ) {
    const application =
      await this.prisma.agencyApplication.findUnique({
        where: {
          id,
        },

        include: {
          applicantUser:
            true,

          directDebitSetup:
            true,

          agreements: {
            orderBy: {
              createdAt:
                "desc",
            },
          },
        },
      });

    if (!application) {
      throw new NotFoundException(
        "Estate Agent application was not found.",
      );
    }

    return application;
  }

  // =========================================================
  // PRIVATE - EMAIL FAILURE SHOULD NOT CORRUPT DB WORKFLOW
  //
  // Database state remains authoritative. If SMTP temporarily
  // fails we log it, return emailSent=false and the Admin can
  // resend the relevant email.
  // =========================================================

  private async trySendMail(
    label: string,
    operation: () => Promise<unknown>,
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
