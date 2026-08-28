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

  async start(
    dto: StartLandlordRegistrationDto,
  ) {
    const email = dto.email.trim().toLowerCase();

    let invitation: { id: string; agencyId: string } | null = null;

    if (dto.invitationToken?.trim()) {
      const candidates = await this.prisma.$queryRawUnsafe<
        Array<{ id: string; agencyId: string; tokenHash: string }>
      >(
        `SELECT "id", "agencyId", "tokenHash"
         FROM "LandlordInvitation"
         WHERE "email" = $1
           AND "status" = 'PENDING'
           AND "expiresAt" > NOW()
         ORDER BY "createdAt" DESC`,
        email,
      );

      for (const candidate of candidates) {
        if (
          await argon2.verify(
            candidate.tokenHash,
            dto.invitationToken.trim(),
          )
        ) {
          invitation = {
            id: candidate.id,
            agencyId: candidate.agencyId,
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

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
      include: { landlordProfile: true },
    });

    // Existing TenureEx users may add LANDLORD as an additional role.
    // For security, an existing account must use its current password.
    if (existingUser) {
      if (!invitation) {
        throw new ConflictException(
          "This email already has a TenureEx account. Use a valid landlord invitation to add the landlord role.",
        );
      }

      if (
        existingUser.status !== "ACTIVE" ||
        !existingUser.emailVerified
      ) {
        throw new ConflictException(
          "Complete and activate the existing TenureEx account first, then open the landlord invitation again.",
        );
      }

      if (!existingUser.passwordHash) {
        throw new ConflictException(
          "This existing account does not yet have a password. Complete the existing account setup first, then use the landlord invitation again.",
        );
      }

      const passwordValid = await argon2.verify(
        existingUser.passwordHash,
        dto.password,
      );

      if (!passwordValid) {
        throw new BadRequestException(
          "This email already has a TenureEx account. Enter the existing account password to add the landlord role.",
        );
      }

      if (existingUser.landlordProfile) {
        throw new ConflictException(
          "This TenureEx account already has a landlord profile.",
        );
      }

      const dateOfBirth = this.parseDateOfBirth(dto.dateOfBirth);
      const now = new Date();

      await this.prisma.$transaction(async (transaction) => {
        await transaction.landlordProfile.create({
          data: {
            userId: existingUser.id,
            dateOfBirth,
            residentialAddress: dto.residentialAddress.trim(),
            postcode: dto.postcode.trim().toUpperCase(),
            identificationType: dto.identificationType.trim(),
            identificationFileUrl: null,
            preferredLanguage: dto.preferredLanguage.trim(),
            voiceReadingEnabled: dto.voiceReadingEnabled,
            agreementAcceptedAt: dto.agreementAccepted ? now : null,
            privacyAcceptedAt: dto.privacyAccepted ? now : null,
            digitalSignatureName: dto.digitalSignatureName.trim(),
            agencyId: invitation.agencyId,
          },
        });

        await this.assignGlobalLandlordRole(transaction, existingUser.id);

        await transaction.$executeRawUnsafe(
          `UPDATE "LandlordInvitation"
           SET "status" = 'ACCEPTED', "acceptedAt" = NOW(), "updatedAt" = NOW()
           WHERE "id" = $1`,
          invitation.id,
        );
      });

      const phoneVerificationRequired =
        !existingUser.phoneVerified;

      return {
        message: phoneVerificationRequired
          ? "Landlord role added to your existing TenureEx account. Your email is already verified; verify your phone number to activate Landlord access."
          : "Landlord role added to your existing TenureEx account successfully. You can continue using your existing login.",
        userId: existingUser.id,
        email: existingUser.email,
        status: existingUser.status,
        existingAccount: true,
        registrationComplete: !phoneVerificationRequired,
        emailVerificationRequired: false,
        phoneVerificationRequired,
      };
    }

    const passwordHash = await argon2.hash(dto.password);
    const rawEmailToken = String(randomInt(0, 1000000)).padStart(6, "0");
    const emailTokenHash = await argon2.hash(rawEmailToken);
    const emailTokenExpiresAt = new Date(Date.now() + 30 * 60 * 1000);
    const dateOfBirth = this.parseDateOfBirth(dto.dateOfBirth);
    const now = new Date();

    const user = await this.prisma.$transaction(async (transaction) => {
      const createdUser = await transaction.user.create({
        data: {
          firstName: dto.firstName.trim(),
          lastName: dto.lastName.trim(),
          email,
          phone: dto.phone.trim(),
          passwordHash,
          userType: "LANDLORD",
          status: "PENDING_EMAIL_VERIFICATION",
          emailVerified: false,
          phoneVerified: false,
        },
      });

      await transaction.landlordProfile.create({
        data: {
          userId: createdUser.id,
          dateOfBirth,
          residentialAddress: dto.residentialAddress.trim(),
          postcode: dto.postcode.trim().toUpperCase(),
          identificationType: dto.identificationType.trim(),
          identificationFileUrl: null,
          preferredLanguage: dto.preferredLanguage.trim(),
          voiceReadingEnabled: dto.voiceReadingEnabled,
          agreementAcceptedAt: dto.agreementAccepted ? now : null,
          privacyAcceptedAt: dto.privacyAccepted ? now : null,
          digitalSignatureName: dto.digitalSignatureName.trim(),
          agencyId: invitation?.agencyId ?? null,
        },
      });

      await this.assignGlobalLandlordRole(transaction, createdUser.id);

      if (invitation) {
        await transaction.$executeRawUnsafe(
          `UPDATE "LandlordInvitation"
           SET "status" = 'ACCEPTED', "acceptedAt" = NOW(), "updatedAt" = NOW()
           WHERE "id" = $1`,
          invitation.id,
        );
      }

      await transaction.emailVerificationToken.create({
        data: {
          userId: createdUser.id,
          tokenHash: emailTokenHash,
          purpose: "REGISTRATION",
          expiresAt: emailTokenExpiresAt,
        },
      });

      return createdUser;
    });

    await this.mailService.sendLandlordEmailVerification({
      email: user.email,
      firstName: user.firstName,
      verificationCode: rawEmailToken,
    });

    return {
      message:
        "Landlord registration started. A 6-digit verification code has been sent to your email address.",
      userId: user.id,
      email: user.email,
      status: user.status,
      existingAccount: false,
      registrationComplete: false,
      emailVerificationRequired: true,
      phoneVerificationRequired: true,
    };
  }

  private parseDateOfBirth(value: string) {
    const dateOfBirth = value
      ? new Date(`${value}T00:00:00.000Z`)
      : null;

    if (dateOfBirth && Number.isNaN(dateOfBirth.getTime())) {
      throw new BadRequestException("Date of birth is invalid.");
    }

    return dateOfBirth;
  }

  private async assignGlobalLandlordRole(
    transaction: any,
    userId: string,
  ) {
    const role = await transaction.role.upsert({
      where: { code: "GLOBAL_LANDLORD" },
      update: {
        name: "Landlord",
        description: "TenureEx landlord account role.",
        scope: "GLOBAL",
        enabled: true,
      },
      create: {
        code: "GLOBAL_LANDLORD",
        name: "Landlord",
        description: "TenureEx landlord account role.",
        scope: "GLOBAL",
        isSystem: true,
        enabled: true,
      },
    });

    await transaction.userRole.upsert({
      where: {
        userId_roleId: {
          userId,
          roleId: role.id,
        },
      },
      update: {},
      create: {
        userId,
        roleId: role.id,
      },
    });
  }

  async verifyEmail(
    dto: VerifyLandlordEmailDto,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
      include: { landlordProfile: true },
    });

    if (!user || !user.landlordProfile) {
      throw new NotFoundException(
        "Landlord account was not found.",
      );
    }

    if (user.emailVerified) {
      return {
        message:
          "Email is already verified. Verify your phone number next.",

        userId:
          user.id,
      };
    }

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
            gt: new Date(),
          },
        },

        orderBy: {
          createdAt:
            "desc",
        },
      });

    let verificationToken:
      | (typeof candidates)[number]
      | null = null;

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

    if (!verificationToken) {
      throw new BadRequestException(
        "Email verification code is invalid or expired.",
      );
    }

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

  async sendPhoneOtp(
    userId: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { landlordProfile: true },
    });

    if (!user || !user.landlordProfile) {
      throw new NotFoundException(
        "Landlord account was not found.",
      );
    }

    if (!user.emailVerified) {
      throw new BadRequestException(
        "Verify your email address before requesting a phone verification code.",
      );
    }

    if (user.phoneVerified) {
      return {
        message:
          "Phone number is already verified.",
      };
    }

    const rawOtp = String(
      randomInt(
        100000,
        1000000,
      ),
    );

    const codeHash =
      await argon2.hash(
        rawOtp,
      );

    const expiresAt =
      new Date(
        Date.now() +
          10 * 60 * 1000,
      );

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

return {
  message:
    "Landlord phone verification code generated.",

  // TEMPORARY until SMS/Twilio is connected
  developmentOtp:
    rawOtp,
};
  }
  async verifyPhone(
    dto: VerifyLandlordPhoneDto,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
      include: { landlordProfile: true },
    });

    if (!user || !user.landlordProfile) {
      throw new NotFoundException(
        "Landlord account was not found.",
      );
    }

    if (!user.emailVerified) {
      throw new BadRequestException(
        "Verify your email address first.",
      );
    }

    if (user.phoneVerified) {
      return {
        message:
          "Landlord registration completed successfully. You can now sign in.",

        userId:
          user.id,

        status:
          user.status,
      };
    }

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
            gt: new Date(),
          },
        },

        orderBy: {
          createdAt:
            "desc",
        },
      });

    if (!otp) {
      throw new BadRequestException(
        "Phone verification code is invalid or expired.",
      );
    }

    if (otp.attempts >= 5) {
      throw new BadRequestException(
        "Too many incorrect attempts. Request a new phone verification code.",
      );
    }

    const valid =
      await argon2.verify(
        otp.codeHash,
        dto.code,
      );

    if (!valid) {
      await this.prisma.phoneOtp.update({
        where: {
          id:
            otp.id,
        },

        data: {
          attempts: {
            increment: 1,
          },
        },
      });

      throw new BadRequestException(
        "Phone verification code is incorrect.",
      );
    }

    const activatedAt =
      new Date();

    const updatedUser =
      await this.prisma.$transaction(
        async (transaction) => {
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

    if (
      !user ||
      !user.landlordProfile
    ) {
      throw new NotFoundException(
        "Landlord profile was not found.",
      );
    }

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
