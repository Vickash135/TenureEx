import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as argon2 from "argon2";
import { randomBytes } from "crypto";

import { PrismaService } from "../database/prisma.service";
import {
  AccessLevel,
  AgencyApplicationStatus,
  RoleScope,
  UserStatus,
  UserType,
} from "../generated/prisma/enums";
import { UsersService } from "../users/users.service";
import { LoginDto } from "./dto/login.dto";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  // =========================================================
  // LOGIN
  // =========================================================

  async login(dto: LoginDto) {
    const email =
      dto.email.trim().toLowerCase();

    const user =
      await this.usersService.findByEmail(
        email,
      );

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException(
        "Invalid email or password.",
      );
    }

    const passwordValid =
      await argon2.verify(
        user.passwordHash,
        dto.password,
      );

    if (!passwordValid) {
      throw new UnauthorizedException(
        "Invalid email or password.",
      );
    }

    if (
      user.status ===
        UserStatus.SUSPENDED ||
      user.status ===
        UserStatus.DISABLED ||
      user.status ===
        UserStatus.REJECTED
    ) {
      throw new UnauthorizedException(
        "This account is not permitted to sign in.",
      );
    }

    if (
      user.status !==
      UserStatus.ACTIVE
    ) {
      throw new UnauthorizedException(
        `Your account is not active. Current status: ${user.status}.`,
      );
    }

    if (!user.emailVerified) {
      throw new UnauthorizedException(
        "Please verify your email before signing in.",
      );
    }

    const tokens =
      await this.createTokens({
        id: user.id,
        email: user.email,
        userType: user.userType,
      });

    await this.storeRefreshToken(
      user.id,
      tokens.refreshToken,
    );

    await this.usersService.updateLastLogin(
      user.id,
    );

    const accountRoles = await this.getAccountRoles(
      user.id,
      user.userType,
    );

    return {
      message:
        "Login successful.",

      user: {
        id: user.id,
        firstName:
          user.firstName,
        lastName:
          user.lastName,
        email: user.email,
        phone: user.phone,
        userType:
          user.userType,
        accountRoles,
        status: user.status,
        emailVerified:
          user.emailVerified,
        phoneVerified:
          user.phoneVerified,
      },

      ...tokens,
    };
  }

  // =========================================================
  // ADMIN LOGIN
  // =========================================================

  async adminLogin(
    dto: LoginDto,
  ) {
    const email =
      dto.email
        .trim()
        .toLowerCase();

    const user =
      await this.usersService.findByEmail(
        email,
      );

    if (
      !user ||
      !user.passwordHash
    ) {
      throw new UnauthorizedException(
        "Invalid admin email or password.",
      );
    }

    if (
      user.userType !==
      UserType.TENUREEX_ADMIN
    ) {
      throw new UnauthorizedException(
        "This account does not have administrator access.",
      );
    }

    const passwordValid =
      await argon2.verify(
        user.passwordHash,
        dto.password,
      );

    if (!passwordValid) {
      throw new UnauthorizedException(
        "Invalid admin email or password.",
      );
    }

    if (
      user.status !==
      UserStatus.ACTIVE
    ) {
      throw new UnauthorizedException(
        "Administrator account is not active.",
      );
    }

    if (!user.emailVerified) {
      throw new UnauthorizedException(
        "Administrator email has not been verified.",
      );
    }

    const tokens =
      await this.createTokens({
        id: user.id,
        email: user.email,
        userType:
          user.userType,
      });

    await this.storeRefreshToken(
      user.id,
      tokens.refreshToken,
    );

    await this.usersService.updateLastLogin(
      user.id,
    );

    return {
      message:
        "Admin login successful.",

      user: {
        id:
          user.id,

        firstName:
          user.firstName,

        lastName:
          user.lastName,

        email:
          user.email,

        phone:
          user.phone,

        userType:
          user.userType,

        status:
          user.status,

        emailVerified:
          user.emailVerified,

        phoneVerified:
          user.phoneVerified,
      },

      ...tokens,
    };
  }

  // =========================================================
  // REFRESH TOKEN
  // =========================================================

  async refresh(
    refreshToken: string,
  ) {
    const refreshSecret =
      process.env.JWT_REFRESH_SECRET;

    if (!refreshSecret) {
      throw new Error(
        "JWT_REFRESH_SECRET is missing.",
      );
    }

    let payload: {
      sub: string;
      email: string;
      userType: string;
    };

    try {
      payload =
        await this.jwtService.verifyAsync<{
          sub: string;
          email: string;
          userType: string;
        }>(
          refreshToken,
          {
            secret:
              refreshSecret,
          },
        );
    } catch {
      throw new UnauthorizedException(
        "Invalid or expired refresh token.",
      );
    }

    const storedTokens =
      await this.prisma.refreshToken.findMany({
        where: {
          userId:
            payload.sub,
          revokedAt: null,

          expiresAt: {
            gt: new Date(),
          },
        },
      });

    let matchedToken:
      | (typeof storedTokens)[number]
      | null = null;

    for (
      const item of
        storedTokens
    ) {
      const valid =
        await argon2.verify(
          item.tokenHash,
          refreshToken,
        );

      if (valid) {
        matchedToken =
          item;

        break;
      }
    }

    if (!matchedToken) {
      throw new UnauthorizedException(
        "Refresh token has been revoked.",
      );
    }

    const user =
      await this.usersService.findById(
        payload.sub,
      );

    if (
      !user ||
      user.status !==
        UserStatus.ACTIVE
    ) {
      throw new UnauthorizedException(
        "User account is not active.",
      );
    }

    await this.prisma.refreshToken.update({
      where: {
        id:
          matchedToken.id,
      },

      data: {
        revokedAt:
          new Date(),
      },
    });

    const tokens =
      await this.createTokens({
        id: user.id,
        email: user.email,
        userType:
          user.userType,
      });

    await this.storeRefreshToken(
      user.id,
      tokens.refreshToken,
    );

    return tokens;
  }

  // =========================================================
  // CURRENT USER / AUTH ME
  // =========================================================

  async getCurrentUser(
    userId: string,
  ) {
    const user =
      await this.usersService.findById(
        userId,
      );

    if (!user) {
      throw new UnauthorizedException(
        "User not found.",
      );
    }

    let agencyMembership =
      await this.prisma.agencyUser.findFirst({
        where: {
          userId:
            user.id,
        },

        include: {
          agency: {
            select: {
              id: true,
              name: true,
              active: true,
            },
          },

          branch: {
            select: {
              id: true,
              name: true,
            },
          },

          roles: {
            include: {
              role: {
                include: {
                  permissions: {
                    include: {
                      permission:
                        true,
                    },
                  },
                },
              },
            },
          },
        },
      });

    // Repair older approved Estate Agent accounts that were approved
    // before Agency/AgencyUser creation was made mandatory. If the
    // application is APPROVED but this user has no agency membership,
    // recover the agency from the approved application and create the
    // missing primary membership before permissions are evaluated.
    if (
      user.userType === UserType.ESTATE_AGENT &&
      user.status === UserStatus.ACTIVE &&
      !agencyMembership
    ) {
      const approvedApplication =
        await this.prisma.agencyApplication.findFirst({
          where: {
            status: AgencyApplicationStatus.APPROVED,
            OR: [
              { applicantUserId: user.id },
              { contactEmail: user.email },
            ],
          },
          orderBy: { approvedAt: "desc" },
          include: { agency: true },
        });

      if (approvedApplication) {
        await this.prisma.$transaction(async (tx) => {
          const now = new Date();

          const agency = approvedApplication.agency
            ? await tx.agency.update({
                where: { id: approvedApplication.agency.id },
                data: {
                  authorised: true,
                  active: true,
                  activatedAt: approvedApplication.agency.activatedAt ?? now,
                },
              })
            : await tx.agency.upsert({
                where: { applicationId: approvedApplication.id },
                update: {
                  authorised: true,
                  active: true,
                  activatedAt: now,
                },
                create: {
                  applicationId: approvedApplication.id,
                  name:
                    approvedApplication.businessName ||
                    approvedApplication.applicantName ||
                    `${user.firstName} ${user.lastName}`.trim(),
                  registrationType: approvedApplication.registrationType,
                  companyNumber: approvedApplication.companyNumber,
                  contactEmail: approvedApplication.contactEmail,
                  contactPhone: approvedApplication.contactPhone,
                  businessDetails: approvedApplication.businessDetails,
                  authorised: true,
                  active: true,
                  activatedAt: now,
                },
              });

          await tx.agencyUser.upsert({
            where: {
              agencyId_userId: {
                agencyId: agency.id,
                userId: user.id,
              },
            },
            update: {
              jobTitle: "Agency Administrator",
              isPrimary: true,
              joinedAt: now,
            },
            create: {
              agencyId: agency.id,
              userId: user.id,
              jobTitle: "Agency Administrator",
              isPrimary: true,
              invitedAt: now,
              joinedAt: now,
            },
          });
        });

        agencyMembership =
          await this.prisma.agencyUser.findFirst({
            where: { userId: user.id },
            include: {
              agency: {
                select: { id: true, name: true, active: true },
              },
              branch: {
                select: { id: true, name: true },
              },
              roles: {
                include: {
                  role: {
                    include: {
                      permissions: {
                        include: { permission: true },
                      },
                    },
                  },
                },
              },
            },
          });
      }
    }

    // Repair older approved Estate Agent accounts that were created
    // before the final-approval workflow assigned an agency role.
    // A primary agency user without a role receives the agency-scoped
    // Agency Administrator role and all current permissions.
    if (
      user.userType ===
        UserType.ESTATE_AGENT &&
      user.status ===
        UserStatus.ACTIVE &&
      agencyMembership?.isPrimary &&
      agencyMembership.roles.length ===
        0
    ) {
      await this.prisma.$transaction(
        async (tx) => {
          const administratorRole =
            await tx.role.upsert({
              where: {
                code:
                  `AGENCY_ADMIN_${agencyMembership!.agencyId}`,
              },
              update: {
                agencyId:
                  agencyMembership!.agencyId,
                name:
                  "Agency Administrator",
                description:
                  "Full agency administration access.",
                scope:
                  RoleScope.AGENCY,
                enabled:
                  true,
              },
              create: {
                agencyId:
                  agencyMembership!.agencyId,
                code:
                  `AGENCY_ADMIN_${agencyMembership!.agencyId}`,
                name:
                  "Agency Administrator",
                description:
                  "Full agency administration access.",
                scope:
                  RoleScope.AGENCY,
                isSystem:
                  true,
                enabled:
                  true,
              },
            });

          const permissions =
            await tx.permission.findMany();

          for (
            const permission of
            permissions
          ) {
            await tx.rolePermission.upsert({
              where: {
                roleId_permissionId: {
                  roleId:
                    administratorRole.id,
                  permissionId:
                    permission.id,
                },
              },
              update: {
                accessLevel:
                  AccessLevel.MANAGE,
              },
              create: {
                roleId:
                  administratorRole.id,
                permissionId:
                  permission.id,
                accessLevel:
                  AccessLevel.MANAGE,
              },
            });
          }

          await tx.agencyUserRole.upsert({
            where: {
              agencyUserId_roleId: {
                agencyUserId:
                  agencyMembership!.id,
                roleId:
                  administratorRole.id,
              },
            },
            update: {},
            create: {
              agencyUserId:
                agencyMembership!.id,
              roleId:
                administratorRole.id,
            },
          });
        },
      );

      agencyMembership =
        await this.prisma.agencyUser.findFirst({
          where: {
            userId:
              user.id,
          },
          include: {
            agency: {
              select: {
                id: true,
                name: true,
                active: true,
              },
            },
            branch: {
              select: {
                id: true,
                name: true,
              },
            },
            roles: {
              include: {
                role: {
                  include: {
                    permissions: {
                      include: {
                        permission:
                          true,
                      },
                    },
                  },
                },
              },
            },
          },
        });
    }

    const roles =
      agencyMembership?.roles.map(
        (
          assignment,
        ) => ({
          id:
            assignment
              .role.id,

          code:
            assignment
              .role.code,

          name:
            assignment
              .role.name,

          description:
            assignment
              .role
              .description,
        }),
      ) ?? [];

    const permissionMap =
      new Map<
        string,
        {
          id: string;
          code: string;
          module: string;
          description:
            | string
            | null;
          accessLevel:
            string;
        }
      >();

    if (agencyMembership) {
      for (
        const roleAssignment
          of agencyMembership.roles
      ) {
        for (
          const rolePermission
            of roleAssignment
              .role
              .permissions
        ) {
          const permission =
            rolePermission
              .permission;

          /*
           * If the same permission
           * appears through more than
           * one role, the last one
           * becomes the current value.
           *
           * We can upgrade this later
           * to choose the strongest
           * AccessLevel automatically.
           */
          permissionMap.set(
            permission.code,
            {
              id:
                permission.id,

              code:
                permission.code,

              module:
                permission.module,

              description:
                permission.description,

              accessLevel:
                rolePermission
                  .accessLevel,
            },
          );
        }
      }
    }

    const accountRoles = await this.getAccountRoles(
      user.id,
      user.userType,
    );

    return {
      id: user.id,

      firstName:
        user.firstName,

      lastName:
        user.lastName,

      email:
        user.email,

      phone:
        user.phone,

      userType:
        user.userType,

      accountRoles,

      status:
        user.status,

      emailVerified:
        user.emailVerified,

      phoneVerified:
        user.phoneVerified,

      lastLoginAt:
        user.lastLoginAt,

      agency:
        agencyMembership
          ? {
              id:
                agencyMembership
                  .agency.id,

              name:
                agencyMembership
                  .agency.name,

              active:
                agencyMembership
                  .agency.active,
            }
          : null,

      branch:
        agencyMembership
          ?.branch
          ? {
              id:
                agencyMembership
                  .branch.id,

              name:
                agencyMembership
                  .branch.name,
            }
          : null,

      jobTitle:
        agencyMembership
          ?.jobTitle ??
        null,

      isPrimaryAgencyUser:
        agencyMembership
          ?.isPrimary ??
        false,

      roles,

      permissions:
        Array.from(
          permissionMap.values(),
        ),
    };
  }

  // =========================================================
  // FORGOT PASSWORD
  // =========================================================

  async forgotPassword(
    email: string,
  ) {
    const cleanEmail =
      email
        .trim()
        .toLowerCase();

    const user =
      await this.usersService.findByEmail(
        cleanEmail,
      );

    const response = {
      message:
        "If an account exists for this email, reset instructions will be sent.",
    };

    if (!user) {
      return response;
    }

    /*
     * Invalidate previous unused
     * reset tokens.
     */
    await this.prisma.passwordResetToken.updateMany({
      where: {
        userId:
          user.id,

        usedAt:
          null,
      },

      data: {
        usedAt:
          new Date(),
      },
    });

    const rawToken =
      randomBytes(
        32,
      ).toString("hex");

    const tokenHash =
      await argon2.hash(
        rawToken,
      );

    const expiresAt =
      new Date(
        Date.now() +
          30 *
            60 *
            1000,
      );

    await this.prisma.passwordResetToken.create({
      data: {
        userId:
          user.id,

        tokenHash,

        expiresAt,
      },
    });

    /*
     * Development only:
     * return raw token for testing.
     */
    if (
      process.env.NODE_ENV !==
      "production"
    ) {
      return {
        ...response,

        developmentResetToken:
          rawToken,
      };
    }

    return response;
  }

  // =========================================================
  // RESET / SET PASSWORD
  // =========================================================

  async resetPassword(
    rawToken: string,
    newPassword: string,
  ) {
    /*
     * Only hashes are stored in
     * PostgreSQL, so we compare
     * the supplied raw token
     * against valid candidates.
     */
    const candidates =
      await this.prisma.passwordResetToken.findMany({
        where: {
          usedAt:
            null,

          expiresAt: {
            gt:
              new Date(),
          },
        },
      });

    let resetToken:
      | (typeof candidates)[number]
      | null = null;

    for (
      const candidate
        of candidates
    ) {
      const valid =
        await argon2.verify(
          candidate
            .tokenHash,

          rawToken,
        );

      if (valid) {
        resetToken =
          candidate;

        break;
      }
    }

    if (!resetToken) {
      throw new BadRequestException(
        "Reset token is invalid or expired.",
      );
    }

    const passwordHash =
      await argon2.hash(
        newPassword,
      );

    /*
     * This supports:
     *
     * 1. Normal password reset
     * 2. First password setup
     *    for invited agency users
     */
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: {
          id:
            resetToken.userId,
        },

        data: {
          passwordHash,

          mustSetPassword:
            false,

          mustChangePassword:
            false,

          emailVerified:
            true,

          status:
            UserStatus.ACTIVE,

          activatedAt:
            new Date(),
        },
      }),

      this.prisma.passwordResetToken.update({
        where: {
          id:
            resetToken.id,
        },

        data: {
          usedAt:
            new Date(),
        },
      }),

      this.prisma.refreshToken.updateMany({
        where: {
          userId:
            resetToken.userId,

          revokedAt:
            null,
        },

        data: {
          revokedAt:
            new Date(),
        },
      }),
    ]);

    return {
      message:
        "Password has been set successfully. You can now sign in.",
    };
  }

  private async getAccountRoles(
    userId: string,
    legacyUserType: string,
  ): Promise<string[]> {
    const assignments = await this.prisma.userRole.findMany({
      where: {
        userId,
        role: {
          scope: RoleScope.GLOBAL,
          enabled: true,
        },
      },
      include: {
        role: true,
      },
    });

    const roles = new Set<string>([legacyUserType]);

    for (const assignment of assignments) {
      const code = assignment.role.code;
      roles.add(
        code.startsWith("GLOBAL_")
          ? code.slice("GLOBAL_".length)
          : code,
      );
    }

    return Array.from(roles);
  }

  // =========================================================
  // CREATE ACCESS + REFRESH TOKENS
  // =========================================================

  private async createTokens(
    user: {
      id: string;
      email: string;
      userType: string;
    },
  ) {
    const accessSecret =
      process.env.JWT_ACCESS_SECRET;

    const refreshSecret =
      process.env.JWT_REFRESH_SECRET;

    if (!accessSecret) {
      throw new Error(
        "JWT_ACCESS_SECRET is missing.",
      );
    }

    if (!refreshSecret) {
      throw new Error(
        "JWT_REFRESH_SECRET is missing.",
      );
    }

    const payload = {
      sub:
        user.id,

      email:
        user.email,

      userType:
        user.userType,
    };

    const accessToken =
      await this.jwtService.signAsync(
        payload,
        {
          secret:
            accessSecret,

          expiresIn:
            "15m",
        },
      );

    const refreshToken =
      await this.jwtService.signAsync(
        payload,
        {
          secret:
            refreshSecret,

          expiresIn:
            "7d",
        },
      );

    return {
      accessToken,

      refreshToken,

      tokenType:
        "Bearer",

      expiresIn:
        900,
    };
  }

  // =========================================================
  // STORE REFRESH TOKEN
  // =========================================================

  private async storeRefreshToken(
    userId: string,
    refreshToken: string,
  ) {
    const tokenHash =
      await argon2.hash(
        refreshToken,
      );

    const expiresAt =
      new Date(
        Date.now() +
          7 *
            24 *
            60 *
            60 *
            1000,
      );

    await this.prisma.refreshToken.create({
      data: {
        userId,

        tokenHash,

        expiresAt,
      },
    });
  }
}