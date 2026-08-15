import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as argon2 from "argon2";
import {
  randomInt,
} from "crypto";

import {
  PrismaService,
} from "../database/prisma.service";

import {
  AgencyApplicationStatus,
  RegistrationType,
  UserStatus,
  UserType,
  VerificationPurpose,
} from "../generated/prisma/enums";

import {
  MailService,
} from "../mail/mail.service";

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

@Injectable()
export class AgentRegistrationService {
  constructor(
    private readonly prisma:
      PrismaService,

    private readonly jwtService:
      JwtService,

    private readonly mailService:
      MailService,
  ) { }

  // =========================================================
  // START ESTATE AGENT REGISTRATION
  // =========================================================

  async start(
    dto: StartAgentRegistrationDto,
  ) {
    const email =
      dto.contactEmail
        .trim()
        .toLowerCase();

    const existingUser =
      await this.prisma.user.findUnique({
        where: {
          email,
        },
      });

    if (existingUser) {
      throw new ConflictException(
        "An account or registration already exists for this email.",
      );
    }

    const applicantName =
      `${dto.firstName.trim()} ${dto.lastName.trim()}`
        .trim();

    const result =
      await this.prisma.$transaction(
        async (tx) => {
          const user =
            await tx.user.create({
              data: {
                firstName:
                  dto.firstName.trim(),

                lastName:
                  dto.lastName.trim(),

                email,

                phone:
                  dto.contactPhone.trim(),

                userType:
                  UserType.ESTATE_AGENT,

                status:
                  UserStatus.PENDING_EMAIL_VERIFICATION,

                emailVerified:
                  false,

                phoneVerified:
                  false,

                mustSetPassword:
                  true,

                mustChangePassword:
                  false,
              },
            });

          const application =
            await tx.agencyApplication.create({
              data: {
                applicantUserId:
                  user.id,

                registrationType:
                  dto.registrationType,

                applicantName,

                businessName:
                  dto.registrationType ===
                    RegistrationType.BUSINESS
                    ? dto.businessName?.trim()
                    : null,

                companyNumber:
                  dto.registrationType ===
                    RegistrationType.BUSINESS
                    ? dto.companyNumber?.trim()
                    : null,

                contactEmail:
                  email,

                contactPhone:
                  dto.contactPhone.trim(),

                status:
                  AgencyApplicationStatus.PENDING_EMAIL_VERIFICATION,
              },
            });

          return {
            user,
            application,
          };
        },
      );

    // ---------------------------------------------------------
    // Create a 6-digit email OTP. Keep it as a STRING so codes
    // beginning with 0 (for example 012345) remain valid.
    // Only the HASH is stored in PostgreSQL.
    // ---------------------------------------------------------

    const rawToken =
      randomInt(
        0,
        1_000_000,
      )
        .toString()
        .padStart(
          6,
          "0",
        );

    await this.prisma
      .emailVerificationToken
      .create({
        data: {
          userId:
            result.user.id,

          tokenHash:
            await argon2.hash(
              rawToken,
            ),

          purpose:
            VerificationPurpose.REGISTRATION,

          expiresAt:
            new Date(
              Date.now() +
              24 *
              60 *
              60 *
              1000,
            ),
        },
      });

    // ---------------------------------------------------------
    // Send the 6-digit email verification OTP.
    // ---------------------------------------------------------

    let emailSent =
      true;

    try {
      await this.mailService
        .sendAgentEmailVerification({
          email:
            result.user.email,

          firstName:
            result.user.firstName,

          userId:
            result.user.id,

          verificationCode:
            rawToken,
        });
    } catch (error) {
      emailSent =
        false;

      console.error(
        "Estate Agent verification email failed:",
        error,
      );
    }

    return {
      message:
        emailSent
          ? "Registration started. A 6-digit email verification code has been sent."
          : "Registration started, but the verification email could not be sent.",

      userId:
        result.user.id,

      applicationId:
        result.application.id,

      emailSent,

      // Development convenience only.
      // Do not show this token in the frontend UI.
      ...(process.env.NODE_ENV !==
        "production"
        ? {
          developmentEmailVerificationToken:
            rawToken,
        }
        : {}),
    };
  }

  // =========================================================
  // VERIFY ESTATE AGENT EMAIL
  // =========================================================

  async verifyEmail(
    dto: VerifyAgentEmailDto,
  ) {
    const user =
      await this.prisma.user.findUnique({
        where: {
          id:
            dto.userId,
        },
      });

    if (
      !user ||
      user.userType !==
      UserType.ESTATE_AGENT
    ) {
      throw new NotFoundException(
        "Estate Agent registration was not found.",
      );
    }

    if (user.emailVerified) {
      return {
        message:
          "Email is already verified. Verify your phone next.",

        userId:
          user.id,
      };
    }

    const tokens =
      await this.prisma
        .emailVerificationToken
        .findMany({
          where: {
            userId:
              user.id,

            purpose:
              VerificationPurpose.REGISTRATION,

            usedAt:
              null,

            expiresAt: {
              gt:
                new Date(),
            },
          },

          orderBy: {
            createdAt:
              "desc",
          },
        });

    const matched =
      await this.findMatchingHash(
        tokens,
        dto.token,
      );

    if (!matched) {
      throw new BadRequestException(
        "Email verification code is invalid or expired.",
      );
    }

    await this.prisma.$transaction([
      this.prisma
        .emailVerificationToken
        .update({
          where: {
            id:
              matched.id,
          },

          data: {
            usedAt:
              new Date(),
          },
        }),

      this.prisma.user.update({
        where: {
          id:
            user.id,
        },

        data: {
          emailVerified:
            true,

          status:
            UserStatus.PENDING_PHONE_VERIFICATION,
        },
      }),

      this.prisma
        .agencyApplication
        .updateMany({
          where: {
            applicantUserId:
              user.id,

            status:
              AgencyApplicationStatus.PENDING_EMAIL_VERIFICATION,
          },

          data: {
            status:
              AgencyApplicationStatus.PENDING_PHONE_VERIFICATION,
          },
        }),
    ]);

    return {
      message:
        "Email verified successfully. Verify your phone next.",

      userId:
        user.id,
    };
  }

  // =========================================================
  // SEND PHONE OTP
  //
  // IMPORTANT:
  // OTP is always treated as a STRING.
  // Codes such as 012345 are valid.
  // =========================================================

  async sendPhoneOtp(
    userId: string,
  ) {
    const user =
      await this.prisma.user.findUnique({
        where: {
          id:
            userId,
        },
      });

    if (
      !user ||
      user.userType !==
      UserType.ESTATE_AGENT
    ) {
      throw new NotFoundException(
        "Estate Agent registration was not found.",
      );
    }

    if (!user.emailVerified) {
      throw new BadRequestException(
        "Verify email first.",
      );
    }

    if (user.phoneVerified) {
      return {
        message:
          "Phone number is already verified.",
      };
    }

    await this.prisma
      .phoneOtp
      .deleteMany({
        where: {
          userId,

          purpose:
            VerificationPurpose.REGISTRATION,

          verifiedAt:
            null,
        },
      });

    // Generates 000000 -> 999999 and preserves leading zero.
    const code =
      randomInt(
        0,
        1_000_000,
      )
        .toString()
        .padStart(
          6,
          "0",
        );

    await this.prisma
      .phoneOtp
      .create({
        data: {
          userId,

          codeHash:
            await argon2.hash(
              code,
            ),

          purpose:
            VerificationPurpose.REGISTRATION,

          attempts:
            0,

          expiresAt:
            new Date(
              Date.now() +
              10 *
              60 *
              1000,
            ),
        },
      });

    // ---------------------------------------------------------
    // SMS provider is not connected yet.
    //
    // For local development the OTP is returned.
    // Once Twilio / another SMS provider is connected,
    // send the OTP there and remove developmentOtp from UI.
    // ---------------------------------------------------------

    return {
      message:
        "Phone verification code generated.",

      // TEMPORARY:
      // SMS provider is not connected yet.
      // Return the OTP so the frontend can display it.
      // Remove this when Twilio/SMS is connected.
      developmentOtp: code,
    };
  }

  // =========================================================
  // VERIFY PHONE OTP
  // =========================================================

  async verifyPhone(
    dto: VerifyAgentPhoneDto,
  ) {
    const user =
      await this.prisma.user.findUnique({
        where: {
          id:
            dto.userId,
        },
      });

    if (
      !user ||
      user.userType !==
      UserType.ESTATE_AGENT
    ) {
      throw new NotFoundException(
        "Estate Agent registration was not found.",
      );
    }

    if (!user.emailVerified) {
      throw new BadRequestException(
        "Verify your email before verifying your phone.",
      );
    }

    if (user.phoneVerified) {
      const application =
        await this.getApplication(
          user.id,
        );

      const onboardingToken =
        await this.createOnboardingToken(
          user.id,
          application.id,
        );

      return {
        message:
          "Phone number is already verified.",

        applicationId:
          application.id,

        onboardingToken,

        expiresIn:
          7 * 24 * 60 * 60,
      };
    }

    const otp =
      await this.prisma.phoneOtp.findFirst({
        where: {
          userId:
            user.id,

          purpose:
            VerificationPurpose.REGISTRATION,

          verifiedAt:
            null,

          expiresAt: {
            gt:
              new Date(),
          },
        },

        orderBy: {
          createdAt:
            "desc",
        },
      });

    if (!otp) {
      throw new BadRequestException(
        "OTP has expired. Request a new code.",
      );
    }

    if (
      otp.attempts >=
      5
    ) {
      throw new BadRequestException(
        "Too many attempts. Request a new OTP.",
      );
    }

    const suppliedCode =
      dto.code
        .trim();

    if (
      !/^\d{6}$/.test(
        suppliedCode,
      )
    ) {
      throw new BadRequestException(
        "The verification code must contain exactly 6 digits.",
      );
    }

    const valid =
      await argon2.verify(
        otp.codeHash,
        suppliedCode,
      );

    if (!valid) {
      await this.prisma
        .phoneOtp
        .update({
          where: {
            id:
              otp.id,
          },

          data: {
            attempts: {
              increment:
                1,
            },
          },
        });

      throw new BadRequestException(
        "Incorrect verification code.",
      );
    }

    const application =
      await this.getApplication(
        user.id,
      );

    await this.prisma.$transaction([
      this.prisma.phoneOtp.update({
        where: {
          id:
            otp.id,
        },

        data: {
          verifiedAt:
            new Date(),
        },
      }),

      this.prisma.user.update({
        where: {
          id:
            user.id,
        },

        data: {
          phoneVerified:
            true,

          status:
            UserStatus.APPLICATION_INCOMPLETE,
        },
      }),

      this.prisma
        .agencyApplication
        .update({
          where: {
            id:
              application.id,
          },

          data: {
            status:
              AgencyApplicationStatus.DRAFT,
          },
        }),
    ]);

    const onboardingToken =
      await this.createOnboardingToken(
        user.id,
        application.id,
      );

    return {
      message:
        "Phone verified. Complete the Estate Agent application.",

      applicationId:
        application.id,

      onboardingToken,

      // Longer onboarding session because review can take days.
      expiresIn:
        7 * 24 * 60 * 60,
    };
  }

  // =========================================================
  // COMPLETE / UPDATE APPLICATION DETAILS
  // =========================================================

  async completeApplication(
    applicationId: string,
    userId: string,
    tokenApplicationId: string,
    dto: CompleteAgentApplicationDto,
  ) {
    this.assertApplication(
      applicationId,
      tokenApplicationId,
    );

    const application =
      await this.prisma
        .agencyApplication
        .findFirst({
          where: {
            id:
              applicationId,

            applicantUserId:
              userId,
          },
        });

    if (!application) {
      throw new NotFoundException(
        "Estate Agent application was not found.",
      );
    }

    if (
      application.status !==
      AgencyApplicationStatus.DRAFT
    ) {
      throw new BadRequestException(
        "This application can no longer be edited.",
      );
    }

    if (
      !dto.authorisedDeclaration ||
      !dto.termsAccepted ||
      !dto.privacyAccepted
    ) {
      throw new BadRequestException(
        "Declaration, terms and privacy acceptance are required.",
      );
    }

    const now =
      new Date();

    return this.prisma
      .agencyApplication
      .update({
        where: {
          id:
            applicationId,
        },

        data: {
          businessDetails:
            dto.businessDetails.trim(),

          employeeCount:
            dto.employeeCount,

          requiredLoginCount:
            dto.requiredLoginCount,

          propertyCount:
            dto.propertyCount,

          branchCount:
            dto.branchCount,

          authorisedDeclaration:
            true,

          termsAcceptedAt:
            now,

          privacyAcceptedAt:
            now,
        },
      });
  }

  // =========================================================
  // SUBMIT APPLICATION
  // DRAFT -> PENDING_REVIEW
  // =========================================================

  async submitApplication(
    applicationId: string,
    userId: string,
    tokenApplicationId: string,
  ) {
    this.assertApplication(
      applicationId,
      tokenApplicationId,
    );

    const application =
      await this.prisma
        .agencyApplication
        .findFirst({
          where: {
            id:
              applicationId,

            applicantUserId:
              userId,
          },
        });

    if (!application) {
      throw new NotFoundException(
        "Estate Agent application was not found.",
      );
    }

    if (
      application.status !==
      AgencyApplicationStatus.DRAFT
    ) {
      throw new BadRequestException(
        `Application cannot be submitted from status ${application.status}.`,
      );
    }

    if (
      !application.businessDetails ||
      application.employeeCount ===
      null ||
      application.requiredLoginCount ===
      null ||
      application.propertyCount ===
      null ||
      application.branchCount ===
      null ||
      !application.authorisedDeclaration ||
      !application.termsAcceptedAt ||
      !application.privacyAcceptedAt
    ) {
      throw new BadRequestException(
        "Complete all required registration details before submitting.",
      );
    }

    const now =
      new Date();

    const updated =
      await this.prisma.$transaction(
        async (tx) => {
          const saved =
            await tx
              .agencyApplication
              .update({
                where: {
                  id:
                    applicationId,
                },

                data: {
                  status:
                    AgencyApplicationStatus.PENDING_REVIEW,

                  submittedAt:
                    now,

                  estimatedProcessingDays:
                    5,
                },
              });

          await tx.user.update({
            where: {
              id:
                userId,
            },

            data: {
              status:
                UserStatus.PENDING_REVIEW,
            },
          });

          await tx
            .applicationStatusHistory
            .create({
              data: {
                applicationId,

                previousStatus:
                  AgencyApplicationStatus.DRAFT,

                newStatus:
                  AgencyApplicationStatus.PENDING_REVIEW,

                note:
                  "Estate Agent registration submitted for TenureEx review.",
              },
            });

          return saved;
        },
      );

    return {
      message:
        "Application received successfully and is awaiting TenureEx review.",

      applicationId:
        updated.id,

      status:
        updated.status,

      submittedAt:
        updated.submittedAt,

      estimatedProcessingDays:
        updated.estimatedProcessingDays,
    };
  }

  // =========================================================
  // RESPOND TO ADMIN REQUEST FOR MORE INFORMATION
  //
  // MORE_INFORMATION_REQUIRED
  //        ↓
  // Estate Agent submits response
  //        ↓
  // Response stored
  //        ↓
  // PENDING_REVIEW
  //        ↓
  // Admin receives email
  //        ↓
  // Admin sees it in "Responses received"
  // =========================================================

  async respondMoreInformation(
    applicationId: string,
    userId: string,
    tokenApplicationId: string,
    dto: RespondMoreInfoDto,
  ) {
    this.assertApplication(
      applicationId,
      tokenApplicationId,
    );

    const application =
      await this.prisma
        .agencyApplication
        .findFirst({
          where: {
            id:
              applicationId,

            applicantUserId:
              userId,
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
      AgencyApplicationStatus.MORE_INFORMATION_REQUIRED
    ) {
      throw new BadRequestException(
        "TenureEx has not requested additional information for this application.",
      );
    }

    if (
      !application.additionalInfoRequest
    ) {
      throw new BadRequestException(
        "No additional information request was found for this application.",
      );
    }

    const response =
      dto.response.trim();

    if (!response) {
      throw new BadRequestException(
        "Enter the requested information.",
      );
    }

    const now =
      new Date();

    const updated =
      await this.prisma.$transaction(
        async (tx) => {
          const saved =
            await tx
              .agencyApplication
              .update({
                where: {
                  id:
                    applicationId,
                },

                data: {
                  additionalInfoResponse:
                    response,

                  additionalInfoRespondedAt:
                    now,

                  additionalInfoResolvedAt:
                    null,

                  // Return to the review queue.
                  status:
                    AgencyApplicationStatus.PENDING_REVIEW,
                },
              });

          await tx.user.update({
            where: {
              id:
                userId,
            },

            data: {
              status:
                UserStatus.PENDING_REVIEW,
            },
          });

          await tx
            .applicationStatusHistory
            .create({
              data: {
                applicationId,

                previousStatus:
                  AgencyApplicationStatus.MORE_INFORMATION_REQUIRED,

                newStatus:
                  AgencyApplicationStatus.PENDING_REVIEW,

                note:
                  "Estate Agent responded to the additional information request and resubmitted the application for review.",
              },
            });

          return saved;
        },
      );

    let adminEmailSent =
      true;

    try {
      await this.mailService
        .sendAdminAgentInformationResponseNotification({
          applicationId,

          applicantName:
            application.applicantName,

          businessName:
            application.businessName,

          email:
            application.applicantUser.email,

          response,
        });
    } catch (error) {
      adminEmailSent =
        false;

      console.error(
        "Unable to notify Admin about additional information:",
        error,
      );
    }

    return {
      message:
        adminEmailSent
          ? "Additional information submitted successfully. TenureEx Admin has been notified."
          : "Additional information submitted successfully and returned for review.",

      application:
        updated,

      adminEmailSent,

      nextStep:
        "WAIT_FOR_ADMIN_REVIEW",
    };
  }

  // =========================================================
  // GET APPLICATION STATUS
  // =========================================================

  async getStatus(
    applicationId: string,
    userId: string,
    tokenApplicationId: string,
  ) {
    this.assertApplication(
      applicationId,
      tokenApplicationId,
    );

    const application =
      await this.prisma
        .agencyApplication
        .findFirst({
          where: {
            id:
              applicationId,

            applicantUserId:
              userId,
          },

          include: {
            agreements: {
              orderBy: {
                createdAt:
                  "desc",
              },
            },

            directDebitSetup:
              true,

            statusHistory: {
              orderBy: {
                createdAt:
                  "asc",
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
  // CREATE ESTATE AGENT ONBOARDING JWT
  // =========================================================

  private async createOnboardingToken(
    userId: string,
    applicationId: string,
  ) {
    const secret =
      process.env.JWT_ACCESS_SECRET;

    if (!secret) {
      throw new Error(
        "JWT_ACCESS_SECRET is missing.",
      );
    }

    return this.jwtService.signAsync(
      {
        sub:
          userId,

        applicationId,

        purpose:
          "AGENT_ONBOARDING",
      },

      {
        secret,

        // The review workflow can take several days.
        expiresIn:
          "7d",
      },
    );
  }

  // =========================================================
  // GET ACTIVE APPLICATION
  // =========================================================

  private async getApplication(
    userId: string,
  ) {
    const application =
      await this.prisma
        .agencyApplication
        .findFirst({
          where: {
            applicantUserId:
              userId,

            status: {
              notIn: [
                AgencyApplicationStatus.REJECTED,
                AgencyApplicationStatus.CANCELLED,
                AgencyApplicationStatus.APPROVED,
              ],
            },
          },

          orderBy: {
            createdAt:
              "desc",
          },
        });

    if (!application) {
      throw new NotFoundException(
        "Active Estate Agent application was not found.",
      );
    }

    return application;
  }

  // =========================================================
  // CHECK ONBOARDING TOKEN BELONGS TO APPLICATION
  // =========================================================

  private assertApplication(
    routeApplicationId: string,
    tokenApplicationId: string,
  ) {
    if (
      routeApplicationId !==
      tokenApplicationId
    ) {
      throw new UnauthorizedException(
        "Registration token does not belong to this application.",
      );
    }
  }

  // =========================================================
  // VERIFY HASHED ONE-TIME TOKEN
  // =========================================================

  private async findMatchingHash<
    T extends {
      tokenHash: string;
    },
  >(
    items: T[],
    rawValue: string,
  ): Promise<T | null> {
    for (
      const item
      of items
    ) {
      if (
        await argon2.verify(
          item.tokenHash,
          rawValue,
        )
      ) {
        return item;
      }
    }

    return null;
  }
}
