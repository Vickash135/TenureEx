import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import * as argon2 from "argon2";
import {
  randomInt,
} from "crypto";

import { PrismaService } from "../database/prisma.service";
import { MailService } from "../mail/mail.service";
import { StartLandlordRegistrationDto } from "./dto/start-landlord-registration.dto";
import { VerifyLandlordEmailDto } from "./dto/verify-landlord-email.dto";
import { VerifyLandlordPhoneDto } from "./dto/verify-landlord-phone.dto";

@Injectable()
export class LandlordRegistrationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  // =========================================================
  // START LANDLORD REGISTRATION
  // =========================================================

  async start(
    dto: StartLandlordRegistrationDto,
  ) {
    const email =
      dto.email
        .trim()
        .toLowerCase();

    let invitation: {
      id: string;
      agencyId: string;
    } | null = null;

    // =========================================================
    // OPTIONAL LANDLORD INVITATION
    // =========================================================

    if (dto.invitationToken?.trim()) {
      const candidates =
        await this.prisma.$queryRawUnsafe<
          Array<{
            id: string;
            agencyId: string;
            tokenHash: string;
          }>
        >(
          `
          SELECT
            "id",
            "agencyId",
            "tokenHash"
          FROM "LandlordInvitation"
          WHERE "email" = $1
            AND "status" = 'PENDING'
            AND "expiresAt" > NOW()
          ORDER BY "createdAt" DESC
          `,
          email,
        );

      for (const candidate of candidates) {
        const valid =
          await argon2.verify(
            candidate.tokenHash,
            dto.invitationToken.trim(),
          );

        if (valid) {
          invitation = {
            id: candidate.id,
            agencyId:
              candidate.agencyId,
          };

          break;
        }
      }

      if (!invitation) {
        throw new BadRequestException(
          "The landlord invitation is invalid or has expired.",
        );
      }
    }

    // =========================================================
    // CHECK EXISTING USER
    // =========================================================

    const existingUser =
      await this.prisma.user.findUnique({
        where: {
          email,
        },
      });

    if (existingUser) {
      throw new ConflictException(
        "An account with this email already exists. Please use another email address or sign in.",
      );
    }

    // =========================================================
    // PASSWORD
    // =========================================================

    const passwordHash =
      await argon2.hash(
        dto.password,
      );

    // =========================================================
    // EMAIL OTP
    // =========================================================

    const rawEmailToken =
      String(
        randomInt(
          0,
          1000000,
        ),
      ).padStart(
        6,
        "0",
      );

    const emailTokenHash =
      await argon2.hash(
        rawEmailToken,
      );

    const emailTokenExpiresAt =
      new Date(
        Date.now() +
          30 * 60 * 1000,
      );

    // =========================================================
    // DATE OF BIRTH
    // =========================================================

    const dateOfBirth =
      dto.dateOfBirth
        ? new Date(
            `${dto.dateOfBirth}T00:00:00.000Z`,
          )
        : null;

    if (
      dateOfBirth &&
      Number.isNaN(
        dateOfBirth.getTime(),
      )
    ) {
      throw new BadRequestException(
        "Date of birth is invalid.",
      );
    }

    const now =
      new Date();

    // =========================================================
    // CREATE USER + LANDLORD PROFILE
    // =========================================================

    const user =
      await this.prisma.$transaction(
        async (
          transaction,
        ) => {
          const createdUser =
            await transaction.user.create({
              data: {
                firstName:
                  dto.firstName.trim(),

                lastName:
                  dto.lastName.trim(),

                email,

                phone:
                  dto.phone.trim(),

                passwordHash,

                userType:
                  "LANDLORD",

                status:
                  "PENDING_EMAIL_VERIFICATION",

                emailVerified:
                  false,

                phoneVerified:
                  false,
              },
            });

          // =====================================================
          // LANDLORD PROFILE
          // =====================================================

          await transaction.landlordProfile.create({
            data: {
              userId:
                createdUser.id,

              dateOfBirth,

              residentialAddress:
                dto.residentialAddress.trim(),

              postcode:
                dto.postcode
                  .trim()
                  .toUpperCase(),

              identificationType:
                dto.identificationType.trim(),

              identificationFileUrl:
                null,

              preferredLanguage:
                dto.preferredLanguage.trim(),

              voiceReadingEnabled:
                dto.voiceReadingEnabled,

              agreementAcceptedAt:
                dto.agreementAccepted
                  ? now
                  : null,

              privacyAcceptedAt:
                dto.privacyAccepted
                  ? now
                  : null,

              digitalSignatureName:
                dto.digitalSignatureName.trim(),
            },
          });

          // =====================================================
          // CONNECT INVITED LANDLORD TO AGENCY
          // =====================================================

          if (invitation) {
            await transaction.$executeRawUnsafe(
              `
              UPDATE "LandlordProfile"
              SET
                "agencyId" = $1,
                "updatedAt" = NOW()
              WHERE "userId" = $2
              `,
              invitation.agencyId,
              createdUser.id,
            );

            await transaction.$executeRawUnsafe(
              `
              UPDATE "LandlordInvitation"
              SET
                "status" = 'ACCEPTED',
                "acceptedAt" = NOW(),
                "updatedAt" = NOW()
              WHERE "id" = $1
              `,
              invitation.id,
            );
          }

          // =====================================================
          // SAVE EMAIL VERIFICATION TOKEN
          // =====================================================

          await transaction.emailVerificationToken.create({
            data: {
              userId:
                createdUser.id,

              tokenHash:
                emailTokenHash,

              purpose:
                "REGISTRATION",

              expiresAt:
                emailTokenExpiresAt,
            },
          });

          return createdUser;
        },
      );

    // =========================================================
    // SEND EMAIL OTP
    // =========================================================

    await this.mailService.sendLandlordEmailVerification({
      email:
        user.email,

      firstName:
        user.firstName,

      verificationCode:
        rawEmailToken,
    });

    // =========================================================
    // RETURN REGISTRATION INFORMATION
    // =========================================================

    return {
      message:
        "Landlord registration started successfully. Please verify your email.",

      userId:
        user.id,

      email:
        user.email,

      status:
        user.status,
    };
  }

  // =========================================================
  // VERIFY EMAIL
  // =========================================================

  async verifyEmail(
    dto: VerifyLandlordEmailDto,
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
        "LANDLORD"
    ) {
      throw new NotFoundException(
        "Landlord account was not found.",
      );
    }

    // =========================================================
    // ALREADY VERIFIED
    // =========================================================

    if (
      user.emailVerified
    ) {
      return {
        message:
          "Email is already verified. Verify your phone number next.",

        userId:
          user.id,
      };
    }

    // =========================================================
    // FIND ACTIVE EMAIL OTP TOKENS
    // =========================================================

    const candidates =
      await this.prisma.emailVerificationToken.findMany({
        where: {
          userId:
            user.id,

          purpose:
            "REGISTRATION",

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

    let verificationToken:
      | (typeof candidates)[number]
      | null =
      null;

    for (
      const candidate of
      candidates
    ) {
      const valid =
        await argon2.verify(
          candidate.tokenHash,
          dto.token,
        );

      if (valid) {
        verificationToken =
          candidate;

        break;
      }
    }

    // =========================================================
    // INVALID EMAIL OTP
    // =========================================================

    if (
      !verificationToken
    ) {
      throw new BadRequestException(
        "Email verification code is invalid or expired.",
      );
    }

    // =========================================================
    // VERIFY EMAIL
    // =========================================================

    await this.prisma.$transaction([
      this.prisma.emailVerificationToken.update({
        where: {
          id:
            verificationToken.id,
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
            "PENDING_PHONE_VERIFICATION",
        },
      }),
    ]);

    return {
      message:
        "Email verified successfully. Verify your phone number next.",

      userId:
        user.id,
    };
  }

  // =========================================================
  // GENERATE PHONE OTP
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

    // =========================================================
    // VALIDATE LANDLORD
    // =========================================================

    if (
      !user ||
      user.userType !==
        "LANDLORD"
    ) {
      throw new NotFoundException(
        "Landlord account was not found.",
      );
    }

    // =========================================================
    // EMAIL MUST BE VERIFIED FIRST
    // =========================================================

    if (
      !user.emailVerified
    ) {
      throw new BadRequestException(
        "Verify your email address before requesting a phone verification code.",
      );
    }

    // =========================================================
    // PHONE ALREADY VERIFIED
    // =========================================================

    if (
      user.phoneVerified
    ) {
      return {
        message:
          "Phone number is already verified.",
      };
    }

    // =========================================================
    // GENERATE 6-DIGIT PHONE OTP
    // =========================================================

    const rawOtp =
      String(
        randomInt(
          100000,
          1000000,
        ),
      );

    // =========================================================
    // HASH OTP BEFORE SAVING
    // =========================================================

    const codeHash =
      await argon2.hash(
        rawOtp,
      );

    // =========================================================
    // OTP EXPIRES AFTER 10 MINUTES
    // =========================================================

    const expiresAt =
      new Date(
        Date.now() +
          10 * 60 * 1000,
      );

    // =========================================================
    // SAVE PHONE OTP
    // =========================================================

    await this.prisma.phoneOtp.create({
      data: {
        userId:
          user.id,

        codeHash,

        purpose:
          "REGISTRATION",

        expiresAt,
      },
    });

    // =========================================================
    // TEMPORARY DEVELOPMENT OTP
    //
    // SMS/TWILIO IS NOT CONNECTED YET.
    // RETURN THE OTP SO THE FRONTEND CAN DISPLAY IT.
    //
    // REMOVE developmentOtp WHEN REAL SMS IS CONNECTED.
    // =========================================================

    return {
      message:
        "Landlord phone verification code generated.",

      developmentOtp:
        rawOtp,
    };
  }

  // =========================================================
  // VERIFY PHONE OTP
  // =========================================================

  async verifyPhone(
    dto: VerifyLandlordPhoneDto,
  ) {
    const user =
      await this.prisma.user.findUnique({
        where: {
          id:
            dto.userId,
        },
      });

    // =========================================================
    // VALIDATE LANDLORD
    // =========================================================

    if (
      !user ||
      user.userType !==
        "LANDLORD"
    ) {
      throw new NotFoundException(
        "Landlord account was not found.",
      );
    }

    // =========================================================
    // EMAIL MUST BE VERIFIED
    // =========================================================

    if (
      !user.emailVerified
    ) {
      throw new BadRequestException(
        "Verify your email address first.",
      );
    }

    // =========================================================
    // PHONE ALREADY VERIFIED
    // =========================================================

    if (
      user.phoneVerified
    ) {
      return {
        message:
          "Landlord registration completed successfully. You can now sign in.",

        userId:
          user.id,

        status:
          user.status,
      };
    }

    // =========================================================
    // FIND LATEST VALID PHONE OTP
    // =========================================================

    const otp =
      await this.prisma.phoneOtp.findFirst({
        where: {
          userId:
            user.id,

          purpose:
            "REGISTRATION",

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

    // =========================================================
    // NO VALID OTP
    // =========================================================

    if (!otp) {
      throw new BadRequestException(
        "Phone verification code is invalid or expired.",
      );
    }

    // =========================================================
    // MAXIMUM 5 ATTEMPTS
    // =========================================================

    if (
      otp.attempts >=
      5
    ) {
      throw new BadRequestException(
        "Too many incorrect attempts. Request a new phone verification code.",
      );
    }

    // =========================================================
    // VERIFY OTP
    // =========================================================

    const valid =
      await argon2.verify(
        otp.codeHash,
        dto.code,
      );

    // =========================================================
    // WRONG OTP
    // =========================================================

    if (!valid) {
      await this.prisma.phoneOtp.update({
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
        "Phone verification code is incorrect.",
      );
    }

    const activatedAt =
      new Date();

    // =========================================================
    // MARK OTP VERIFIED + ACTIVATE LANDLORD
    // =========================================================

    const updatedUser =
      await this.prisma.$transaction(
        async (
          transaction,
        ) => {
          await transaction.phoneOtp.update({
            where: {
              id:
                otp.id,
            },

            data: {
              verifiedAt:
                activatedAt,
            },
          });

          return transaction.user.update({
            where: {
              id:
                user.id,
            },

            data: {
              phoneVerified:
                true,

              status:
                "ACTIVE",

              activatedAt,
            },
          });
        },
      );

    return {
      message:
        "Landlord registration completed successfully. You can now sign in.",

      userId:
        updatedUser.id,

      status:
        updatedUser.status,
    };
  }

  // =========================================================
  // SAVE IDENTIFICATION DOCUMENT
  // =========================================================

  async saveIdentificationDocument(
    userId: string,
    identificationFileUrl: string,
  ) {
    const user =
      await this.prisma.user.findUnique({
        where: {
          id:
            userId,
        },

        include: {
          landlordProfile:
            true,
        },
      });

    // =========================================================
    // VALIDATE LANDLORD PROFILE
    // =========================================================

    if (
      !user ||
      user.userType !==
        "LANDLORD" ||
      !user.landlordProfile
    ) {
      throw new NotFoundException(
        "Landlord profile was not found.",
      );
    }

    // =========================================================
    // SAVE DOCUMENT URL
    // =========================================================

    await this.prisma.landlordProfile.update({
      where: {
        userId:
          user.id,
      },

      data: {
        identificationFileUrl,
      },
    });

    return {
      message:
        "Identification document uploaded successfully.",

      identificationFileUrl,
    };
  }
}