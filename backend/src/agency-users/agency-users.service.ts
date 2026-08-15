import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from "@nestjs/common";
import * as argon2 from "argon2";
import { randomBytes } from "crypto";

import { PrismaService } from "../database/prisma.service";
import { UserStatus, UserType } from "../generated/prisma/enums";
import { MailService } from "../mail/mail.service";
import { CreateAgencyUserDto } from "./dto/create-agency-user.dto";
import { UpdateAgencyUserDto } from "./dto/update-agency-user.dto";

@Injectable()
export class AgencyUsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  private async getAgencyForManager(
    userId: string,
  ) {
    const membership =
      await this.prisma.agencyUser.findFirst({
        where: {
          userId,
          agency: {
            active: true,
          },
        },
        include: {
          agency: true,
        },
      });

    if (!membership) {
      throw new ForbiddenException(
        "You are not attached to an active agency.",
      );
    }

    return membership.agency;
  }

  async getUsers(currentUserId: string) {
    const agency =
      await this.getAgencyForManager(
        currentUserId,
      );

    return this.prisma.agencyUser.findMany({
      where: {
        agencyId: agency.id,
      },

      include: {
        user: {
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
            mustSetPassword: true,
            mustChangePassword: true,
            lastLoginAt: true,
            createdAt: true,
          },
        },

        branch: true,

        roles: {
          include: {
            role: true,
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async getUser(
    currentUserId: string,
    agencyUserId: string,
  ) {
    const agency =
      await this.getAgencyForManager(
        currentUserId,
      );

    const agencyUser =
      await this.prisma.agencyUser.findFirst({
        where: {
          id: agencyUserId,
          agencyId: agency.id,
        },

        include: {
          user: true,
          branch: true,

          roles: {
            include: {
              role: {
                include: {
                  permissions: {
                    include: {
                      permission: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

    if (!agencyUser) {
      throw new NotFoundException(
        "Agency user not found.",
      );
    }

    const {
      passwordHash: _passwordHash,
      ...safeUser
    } = agencyUser.user;

    return {
      ...agencyUser,
      user: safeUser,
    };
  }

  async createUser(
    currentUserId: string,
    dto: CreateAgencyUserDto,
  ) {
    const agency =
      await this.getAgencyForManager(
        currentUserId,
      );

    const email =
      dto.email.trim().toLowerCase();

    const existingUser =
      await this.prisma.user.findUnique({
        where: {
          email,
        },
      });

    if (existingUser) {
      throw new ConflictException(
        "A user with this email already exists.",
      );
    }

    if (dto.branchId) {
      const branch =
        await this.prisma.agencyBranch.findFirst({
          where: {
            id: dto.branchId,
            agencyId: agency.id,
            active: true,
          },
        });

      if (!branch) {
        throw new BadRequestException(
          "The selected branch does not belong to this agency.",
        );
      }
    }

    if (dto.roleId) {
      const role =
        await this.prisma.role.findFirst({
          where: {
            id: dto.roleId,
            enabled: true,

            OR: [
              {
                agencyId: agency.id,
              },
              {
                agencyId: null,
              },
            ],
          },
        });

      if (!role) {
        throw new BadRequestException(
          "The selected role is not available for this agency.",
        );
      }
    }

    const rawInvitationToken =
      randomBytes(32).toString("hex");

    const invitationTokenHash =
      await argon2.hash(
        rawInvitationToken,
      );

    const invitationExpiresAt =
      new Date(
        Date.now() +
          24 * 60 * 60 * 1000,
      );

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
                  dto.phone?.trim() ||
                  null,

                userType:
                  UserType.ESTATE_AGENT,

                status:
                  UserStatus.PENDING_EMAIL_VERIFICATION,

                emailVerified: false,
                phoneVerified: false,

                passwordHash: null,

                mustSetPassword: true,
                mustChangePassword: false,

                activatedAt: null,
              },
            });

          const agencyUser =
            await tx.agencyUser.create({
              data: {
                agencyId: agency.id,
                userId: user.id,

                branchId:
                  dto.branchId || null,

                jobTitle:
                  dto.jobTitle?.trim() ||
                  null,

                isPrimary: false,

                invitedAt: new Date(),

                joinedAt: null,
              },
            });

          if (dto.roleId) {
            await tx.agencyUserRole.create({
              data: {
                agencyUserId:
                  agencyUser.id,

                roleId:
                  dto.roleId,
              },
            });
          }

          await tx.passwordResetToken.create({
            data: {
              userId: user.id,

              tokenHash:
                invitationTokenHash,

              expiresAt:
                invitationExpiresAt,
            },
          });

          const createdAgencyUser =
            await tx.agencyUser.findUnique({
              where: {
                id: agencyUser.id,
              },

              include: {
                user: {
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
                    mustSetPassword: true,
                    mustChangePassword: true,
                    createdAt: true,
                  },
                },

                branch: true,

                roles: {
                  include: {
                    role: true,
                  },
                },
              },
            });

          return {
            agencyUser:
              createdAgencyUser,

            invitationToken:
              rawInvitationToken,
          };
        },
      );

    await this.prisma.auditLog.create({
      data: {
        actorUserId:
          currentUserId,

        action:
          "AGENCY_USER_INVITED",

        entityType:
          "AgencyUser",

        entityId:
          result.agencyUser?.id,

        description:
          `Agency user invitation created for ${email}.`,
      },
    });

    /*
     * SEND INVITATION EMAIL
     */
    try {
      await this.mailService.sendAgencyUserInvitation({
        email,
        firstName:
          dto.firstName.trim(),
        invitationToken:
          result.invitationToken,
      });

      console.log(
        `Invitation email successfully sent to ${email}`,
      );
    } catch (error) {
      console.error(
        `Failed to send invitation email to ${email}`,
        error,
      );

      throw new BadRequestException(
        "The user was created, but the invitation email could not be sent.",
      );
    }

    const response: {
      message: string;
      agencyUser:
        typeof result.agencyUser;
      developmentInvitationToken?: string;
    } = {
      message:
        "Agency user invitation created and email sent successfully.",

      agencyUser:
        result.agencyUser,
    };

    if (
      process.env.NODE_ENV !==
      "production"
    ) {
      response.developmentInvitationToken =
        result.invitationToken;
    }

    return response;
  }

  async updateUser(
    currentUserId: string,
    agencyUserId: string,
    dto: UpdateAgencyUserDto,
  ) {
    const agency =
      await this.getAgencyForManager(
        currentUserId,
      );

    const agencyUser =
      await this.prisma.agencyUser.findFirst({
        where: {
          id: agencyUserId,
          agencyId: agency.id,
        },

        include: {
          user: true,
        },
      });

    if (!agencyUser) {
      throw new NotFoundException(
        "Agency user not found.",
      );
    }

    if (dto.email) {
      const email =
        dto.email
          .trim()
          .toLowerCase();

      const existing =
        await this.prisma.user.findFirst({
          where: {
            email,

            NOT: {
              id: agencyUser.userId,
            },
          },
        });

      if (existing) {
        throw new ConflictException(
          "A user with this email already exists.",
        );
      }
    }

    if (dto.branchId) {
      const branch =
        await this.prisma.agencyBranch.findFirst({
          where: {
            id: dto.branchId,
            agencyId: agency.id,
            active: true,
          },
        });

      if (!branch) {
        throw new BadRequestException(
          "The selected branch does not belong to this agency.",
        );
      }
    }

    if (dto.roleId) {
      const role =
        await this.prisma.role.findFirst({
          where: {
            id: dto.roleId,
            enabled: true,

            OR: [
              {
                agencyId: agency.id,
              },
              {
                agencyId: null,
              },
            ],
          },
        });

      if (!role) {
        throw new BadRequestException(
          "The selected role is not available for this agency.",
        );
      }
    }

    await this.prisma.$transaction(
      async (tx) => {
        await tx.user.update({
          where: {
            id: agencyUser.userId,
          },

          data: {
            ...(dto.firstName !==
              undefined && {
              firstName:
                dto.firstName.trim(),
            }),

            ...(dto.lastName !==
              undefined && {
              lastName:
                dto.lastName.trim(),
            }),

            ...(dto.email !==
              undefined && {
              email:
                dto.email
                  .trim()
                  .toLowerCase(),
            }),

            ...(dto.phone !==
              undefined && {
              phone:
                dto.phone.trim() ||
                null,
            }),
          },
        });

        await tx.agencyUser.update({
          where: {
            id: agencyUserId,
          },

          data: {
            ...(dto.jobTitle !==
              undefined && {
              jobTitle:
                dto.jobTitle.trim() ||
                null,
            }),

            ...(dto.branchId !==
              undefined && {
              branchId:
                dto.branchId,
            }),
          },
        });

        if (
          dto.roleId !== undefined
        ) {
          await tx.agencyUserRole.deleteMany({
            where: {
              agencyUserId,
            },
          });

          await tx.agencyUserRole.create({
            data: {
              agencyUserId,
              roleId: dto.roleId,
            },
          });
        }
      },
    );

    await this.prisma.auditLog.create({
      data: {
        actorUserId:
          currentUserId,

        action:
          "AGENCY_USER_UPDATED",

        entityType:
          "AgencyUser",

        entityId:
          agencyUserId,

        description:
          "Agency user details were updated.",
      },
    });

    return {
      message:
        "Agency user updated successfully.",

      agencyUser:
        await this.getUser(
          currentUserId,
          agencyUserId,
        ),
    };
  }

  async updateStatus(
    currentUserId: string,
    agencyUserId: string,
    status: UserStatus,
  ) {
    const agency =
      await this.getAgencyForManager(
        currentUserId,
      );

    if (
      status !== UserStatus.ACTIVE &&
      status !==
        UserStatus.SUSPENDED &&
      status !==
        UserStatus.DISABLED
    ) {
      throw new BadRequestException(
        "Agency users can only be ACTIVE, SUSPENDED or DISABLED.",
      );
    }

    const agencyUser =
      await this.prisma.agencyUser.findFirst({
        where: {
          id: agencyUserId,
          agencyId: agency.id,
        },
      });

    if (!agencyUser) {
      throw new NotFoundException(
        "Agency user not found.",
      );
    }

    if (
      agencyUser.userId ===
      currentUserId
    ) {
      throw new BadRequestException(
        "You cannot change your own account status here.",
      );
    }

    await this.prisma.user.update({
      where: {
        id: agencyUser.userId,
      },

      data: {
        status,

        suspendedAt:
          status ===
          UserStatus.SUSPENDED
            ? new Date()
            : null,

        disabledAt:
          status ===
          UserStatus.DISABLED
            ? new Date()
            : null,

        ...(status ===
          UserStatus.ACTIVE && {
          activatedAt:
            new Date(),
        }),
      },
    });

    await this.prisma.auditLog.create({
      data: {
        actorUserId:
          currentUserId,

        action:
          "AGENCY_USER_STATUS_UPDATED",

        entityType:
          "AgencyUser",

        entityId:
          agencyUserId,

        description:
          `Agency user status changed to ${status}.`,
      },
    });

    return {
      message:
        `User status changed to ${status}.`,
    };
  }

  async getBranches(
    currentUserId: string,
  ) {
    const agency =
      await this.getAgencyForManager(
        currentUserId,
      );

    return this.prisma.agencyBranch.findMany({
      where: {
        agencyId: agency.id,
        active: true,
      },

      orderBy: {
        name: "asc",
      },
    });
  }

  async getRoles(
    currentUserId: string,
  ) {
    const agency =
      await this.getAgencyForManager(
        currentUserId,
      );

    return this.prisma.role.findMany({
      where: {
        enabled: true,

        OR: [
          {
            agencyId: agency.id,
          },
          {
            agencyId: null,
          },
        ],
      },

      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },

      orderBy: {
        name: "asc",
      },
    });
  }
}