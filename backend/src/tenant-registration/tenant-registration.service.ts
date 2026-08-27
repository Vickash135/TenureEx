import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import * as argon2 from "argon2";
import { randomInt } from "crypto";
import { PrismaService } from "../database/prisma.service";
import { MailService } from "../mail/mail.service";
import { CompleteTenantRegistrationDto } from "./dto/complete-tenant-registration.dto";
import { StartTenantRegistrationDto } from "./dto/start-tenant-registration.dto";
import { VerifyTenantEmailDto } from "./dto/verify-tenant-email.dto";

@Injectable()
export class TenantRegistrationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  async start(dto: StartTenantRegistrationDto) {
    const email = dto.email.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({
      where: { email },
      include: { tenantProfile: true },
    });

    if (existing?.tenantProfile) {
      throw new ConflictException(
        "This TenureEx account already has a tenant profile. Please sign in instead.",
      );
    }

    // Existing active accounts do not need a second email-verification cycle.
    // The existing password is verified when the tenant profile is completed.
    if (existing) {
      if (existing.status !== "ACTIVE" || !existing.emailVerified || !existing.passwordHash) {
        throw new ConflictException(
          "Complete and activate the existing TenureEx account first, then register as a tenant.",
        );
      }

      return {
        message: "Existing TenureEx account found. Continue with your tenant details and use your current account password.",
        userId: existing.id,
        email: existing.email,
        expiresInMinutes: 0,
        existingAccount: true,
        emailVerificationRequired: false,
      };
    }

    const rawCode = String(randomInt(0, 1000000)).padStart(6, "0");
    const tokenHash = await argon2.hash(rawCode);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const user = await this.prisma.user.create({
      data: {
        firstName: "Tenant",
        lastName: "User",
        email,
        userType: "TENANT",
        status: "PENDING_EMAIL_VERIFICATION",
        emailVerified: false,
        phoneVerified: false,
      },
    });

    await this.prisma.emailVerificationToken.create({
      data: { userId: user.id, tokenHash, purpose: "REGISTRATION", expiresAt },
    });

    await this.mailService.sendTenantEmailVerification({
      email: user.email,
      verificationCode: rawCode,
    });

    return {
      message: "A 6-digit verification code has been sent to your email address.",
      userId: user.id,
      email: user.email,
      expiresInMinutes: 10,
      existingAccount: false,
      emailVerificationRequired: true,
    };
  }

  async verifyEmail(dto: VerifyTenantEmailDto) {
    const user = await this.prisma.user.findUnique({ where: { id: dto.userId } });
    if (!user || user.userType !== "TENANT") {
      throw new NotFoundException("Tenant registration was not found.");
    }

    if (user.emailVerified) {
      return { message: "Email is already verified.", userId: user.id, email: user.email };
    }

    const candidates = await this.prisma.emailVerificationToken.findMany({
      where: {
        userId: user.id,
        purpose: "REGISTRATION",
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    let matched: (typeof candidates)[number] | null = null;
    for (const candidate of candidates) {
      if (await argon2.verify(candidate.tokenHash, dto.token)) {
        matched = candidate;
        break;
      }
    }

    if (!matched) throw new BadRequestException("Verification code is invalid or expired.");

    await this.prisma.$transaction([
      this.prisma.emailVerificationToken.update({ where: { id: matched.id }, data: { usedAt: new Date() } }),
      this.prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: true, status: "APPLICATION_INCOMPLETE" },
      }),
    ]);

    return { message: "Email verified successfully.", userId: user.id, email: user.email };
  }

  async complete(dto: CompleteTenantRegistrationDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
      include: { tenantProfile: true },
    });

    if (!user) {
      throw new NotFoundException("Tenant registration was not found.");
    }

    if (user.tenantProfile) {
      throw new ConflictException("This account already has a tenant profile.");
    }

    const isExistingAccount = user.userType !== "TENANT" || user.status === "ACTIVE";

    if (isExistingAccount) {
      if (!user.passwordHash || user.status !== "ACTIVE" || !user.emailVerified) {
        throw new BadRequestException("Complete the existing TenureEx account before adding the tenant role.");
      }

      const passwordValid = await argon2.verify(user.passwordHash, dto.password);
      if (!passwordValid) {
        throw new BadRequestException(
          "Enter your existing TenureEx account password to add the tenant role.",
        );
      }
    } else if (!user.emailVerified) {
      throw new BadRequestException("Verify your email before completing registration.");
    }

    const now = new Date();
    const passwordHash = isExistingAccount
      ? user.passwordHash!
      : await argon2.hash(dto.password);

    const completed = await this.prisma.$transaction(async (tx) => {
      const updatedUser = isExistingAccount
        ? user
        : await tx.user.update({
            where: { id: user.id },
            data: {
              firstName: dto.firstName.trim(),
              lastName: dto.lastName.trim(),
              passwordHash,
              status: "ACTIVE",
              activatedAt: now,
            },
          });

      await tx.tenantProfile.create({
        data: {
          userId: user.id,
          postcode: dto.postcode?.trim().toUpperCase() || null,
          mainReason: dto.mainReason.trim(),
          idealTimeframe: dto.idealTimeframe.trim(),
          currentLivingSituation: dto.currentLivingSituation.trim(),
        },
      });

      const role = await tx.role.upsert({
        where: { code: "GLOBAL_TENANT" },
        update: {
          name: "Tenant",
          description: "TenureEx tenant account role.",
          scope: "GLOBAL",
          enabled: true,
        },
        create: {
          code: "GLOBAL_TENANT",
          name: "Tenant",
          description: "TenureEx tenant account role.",
          scope: "GLOBAL",
          isSystem: true,
          enabled: true,
        },
      });

      await tx.userRole.upsert({
        where: {
          userId_roleId: {
            userId: user.id,
            roleId: role.id,
          },
        },
        update: {},
        create: { userId: user.id, roleId: role.id },
      });

      return updatedUser;
    });

    return {
      message: isExistingAccount
        ? "Tenant role added to your existing TenureEx account successfully."
        : "Tenant account created successfully. You can now sign in.",
      user: {
        id: completed.id,
        firstName: completed.firstName,
        lastName: completed.lastName,
        email: completed.email,
        userType: completed.userType,
        status: completed.status,
      },
    };
  }

}
