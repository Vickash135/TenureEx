import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import * as argon2 from "argon2";

import {
  randomBytes,
  randomUUID,
} from "crypto";

import { PrismaService } from "../database/prisma.service";

import { MailService } from "../mail/mail.service";

import {
  ApprovePropertyDto,
  PropertyCommissionType,
} from "./dto/approve-property.dto";

import { InviteLandlordDto } from "./dto/invite-landlord.dto";

type LandlordRow = {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  status: string;
  createdAt: Date;
  propertyCount: bigint;
};

type InvitationRow = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  status: string;
  expiresAt: Date;
  createdAt: Date;
};

@Injectable()
export class AgencyLandlordsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  // =====================================================
  // GET CURRENT ESTATE AGENT AGENCY
  // =====================================================

  private async getAgency(
    currentUserId: string,
  ) {
    const membership =
      await this.prisma.agencyUser.findFirst({
        where: {
          userId: currentUserId,

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

  // =====================================================
  // GET LANDLORD PROFILE IDS FOR AGENCY
  // =====================================================

  private async getAgencyLandlordProfileIds(
    agencyId: string,
  ): Promise<string[]> {
    const rows =
      await this.prisma.$queryRawUnsafe<
        Array<{
          id: string;
        }>
      >(
        `
        SELECT "id"
        FROM "LandlordProfile"
        WHERE "agencyId" = $1
        `,
        agencyId,
      );

    return rows.map(
      (row) => row.id,
    );
  }

  // =====================================================
  // LIST LANDLORDS
  // =====================================================

  async listLandlords(
    currentUserId: string,
  ) {
    const agency =
      await this.getAgency(
        currentUserId,
      );

    const landlords =
      await this.prisma.$queryRawUnsafe<
        LandlordRow[]
      >(
        `
        SELECT
          lp."id",
          lp."userId",
          u."firstName",
          u."lastName",
          u."email",
          u."phone",
          u."status"::text AS "status",
          lp."createdAt",
          COUNT(p."id")::bigint AS "propertyCount"

        FROM "LandlordProfile" lp

        JOIN "User" u
          ON u."id" = lp."userId"

        LEFT JOIN "Property" p
          ON p."landlordProfileId" = lp."id"

        WHERE lp."agencyId" = $1

        GROUP BY
          lp."id",
          u."id"

        ORDER BY
          lp."createdAt" DESC
        `,
        agency.id,
      );

    const invitations =
      await this.prisma.$queryRawUnsafe<
        InvitationRow[]
      >(
        `
        SELECT
          "id",
          "firstName",
          "lastName",
          "email",
          "phone",
          "status",
          "expiresAt",
          "createdAt"

        FROM "LandlordInvitation"

        WHERE
          "agencyId" = $1
          AND "status" = 'PENDING'
          AND "expiresAt" > NOW()

        ORDER BY
          "createdAt" DESC
        `,
        agency.id,
      );

    return {
      landlords:
        landlords.map(
          (landlord) => ({
            ...landlord,

            propertyCount:
              Number(
                landlord.propertyCount,
              ),

            joinedAt:
              landlord.createdAt,
          }),
        ),

      invitations,
    };
  }

  // =====================================================
  // INVITE LANDLORD
  // =====================================================

  async inviteLandlord(
    currentUserId: string,
    dto: InviteLandlordDto,
  ) {
    const agency =
      await this.getAgency(
        currentUserId,
      );

    const email =
      dto.email
        .trim()
        .toLowerCase();

    const existingUser =
      await this.prisma.user.findUnique({
        where: {
          email,
        },

        include: {
          landlordProfile: true,
        },
      });

    if (
      existingUser &&
      existingUser.userType !==
        "LANDLORD"
    ) {
      throw new ConflictException(
        "This email already belongs to a non-landlord TenureEx account.",
      );
    }

    if (
      existingUser?.landlordProfile
    ) {
      const links =
        await this.prisma.$queryRawUnsafe<
          Array<{
            agencyId:
              | string
              | null;
          }>
        >(
          `
          SELECT "agencyId"
          FROM "LandlordProfile"
          WHERE "id" = $1
          `,
          existingUser
            .landlordProfile.id,
        );

      const currentAgencyId =
        links[0]?.agencyId ??
        null;

      if (
        currentAgencyId ===
        agency.id
      ) {
        throw new ConflictException(
          "This landlord is already linked to your agency.",
        );
      }

      if (
        currentAgencyId &&
        currentAgencyId !==
          agency.id
      ) {
        throw new ConflictException(
          "This landlord is already linked to another agency.",
        );
      }
    }

    await this.prisma.$executeRawUnsafe(
      `
      UPDATE "LandlordInvitation"

      SET
        "status" = 'REPLACED',
        "updatedAt" = NOW()

      WHERE
        "agencyId" = $1
        AND "email" = $2
        AND "status" = 'PENDING'
      `,
      agency.id,
      email,
    );

    const id =
      randomUUID();

    const rawToken =
      randomBytes(32).toString(
        "hex",
      );

    const tokenHash =
      await argon2.hash(
        rawToken,
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

    await this.prisma.$executeRawUnsafe(
      `
      INSERT INTO "LandlordInvitation"
      (
        "id",
        "agencyId",
        "invitedByUserId",
        "firstName",
        "lastName",
        "email",
        "phone",
        "tokenHash",
        "status",
        "expiresAt",
        "createdAt",
        "updatedAt"
      )

      VALUES
      (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        'PENDING',
        $9,
        NOW(),
        NOW()
      )
      `,
      id,
      agency.id,
      currentUserId,
      dto.firstName.trim(),
      dto.lastName.trim(),
      email,
      dto.phone?.trim() ||
        null,
      tokenHash,
      expiresAt,
    );

    await this.mailService
      .sendLandlordAgencyInvitation({
        email,

        firstName:
          dto.firstName.trim(),

        agencyName:
          agency.name,

        invitationToken:
          rawToken,
      });

    return {
      message:
        "Landlord invitation email sent successfully.",

      invitationId: id,
    };
  }

  // =====================================================
  // LIST AGENCY PROPERTIES
  // =====================================================

  async listProperties(
    currentUserId: string,
  ) {
    const agency =
      await this.getAgency(
        currentUserId,
      );

    const profileIds =
      await this.getAgencyLandlordProfileIds(
        agency.id,
      );

    if (
      !profileIds.length
    ) {
      return [];
    }

    const properties =
      await this.prisma.property.findMany({
        where: {
          landlordProfileId: {
            in: profileIds,
          },
        },

        include: {
          landlordProfile: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true,
                  phone: true,
                },
              },
            },
          },
        },

        orderBy: {
          createdAt:
            "desc",
        },
      });

    return properties.map(
      (property) =>
        this.presentProperty(
          property,
        ),
    );
  }

  // =====================================================
  // GET ONE PROPERTY
  // =====================================================

  async getProperty(
    currentUserId: string,
    propertyId: string,
  ) {
    const agency =
      await this.getAgency(
        currentUserId,
      );

    const profileIds =
      await this.getAgencyLandlordProfileIds(
        agency.id,
      );

    const property =
      await this.prisma.property.findFirst({
        where: {
          id: propertyId,

          landlordProfileId: {
            in: profileIds,
          },
        },

        include: {
          landlordProfile: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true,
                  phone: true,
                },
              },
            },
          },
        },
      });

    if (!property) {
      throw new NotFoundException(
        "Property was not found for this agency.",
      );
    }

    return this.presentProperty(
      property,
    );
  }

  // =====================================================
  // APPROVE PROPERTY + SET COMMISSION
  // =====================================================

  async approveProperty(
    currentUserId: string,
    propertyId: string,
    dto: ApprovePropertyDto,
  ) {
    const agency =
      await this.getAgency(
        currentUserId,
      );

    const profileIds =
      await this.getAgencyLandlordProfileIds(
        agency.id,
      );

    const property =
      await this.prisma.property.findFirst({
        where: {
          id: propertyId,

          landlordProfileId: {
            in: profileIds,
          },
        },

        include: {
          landlordProfile: {
            include: {
              user: true,
            },
          },
        },
      });

    if (!property) {
      throw new NotFoundException(
        "Property was not found for this agency.",
      );
    }

    if (
      property.approvalStatus !==
      "PENDING"
    ) {
      throw new BadRequestException(
        "Only a pending property can be approved.",
      );
    }

    // ---------------------------------------------
    // LANDLORD'S ORIGINAL RENT
    // ---------------------------------------------

    const landlordRent =
      Number(
        property.monthlyRent,
      );

    if (
      !Number.isFinite(
        landlordRent,
      ) ||
      landlordRent <= 0
    ) {
      throw new BadRequestException(
        "The landlord monthly rent is invalid.",
      );
    }

    // ---------------------------------------------
    // COMMISSION
    // ---------------------------------------------

    const commissionValue =
      Number(
        dto.commissionValue,
      );

    if (
      !Number.isFinite(
        commissionValue,
      ) ||
      commissionValue < 0
    ) {
      throw new BadRequestException(
        "Enter a valid commission value.",
      );
    }

    if (
      dto.commissionType ===
        PropertyCommissionType.PERCENTAGE &&
      commissionValue > 100
    ) {
      throw new BadRequestException(
        "Commission percentage cannot exceed 100%.",
      );
    }

    let commissionAmount = 0;

    if (
      dto.commissionType ===
      PropertyCommissionType.PERCENTAGE
    ) {
      commissionAmount =
        landlordRent *
        (commissionValue /
          100);
    } else {
      commissionAmount =
        commissionValue;
    }

    // Money rounded to 2 decimal places.
    commissionAmount =
      Math.round(
        commissionAmount *
          100,
      ) / 100;

    // ---------------------------------------------
    // FINAL TENANT RENT
    // ---------------------------------------------

    const tenantMonthlyRent =
      Math.round(
        (landlordRent +
          commissionAmount) *
          100,
      ) / 100;

    // ---------------------------------------------
    // UPDATE PROPERTY
    // ---------------------------------------------

    const updated =
      await this.prisma.property.update({
        where: {
          id: propertyId,
        },

        data: {
          commissionType:
            dto.commissionType,

          commissionValue,

          commissionAmount,

          tenantMonthlyRent,

          approvalStatus:
            "APPROVED",

          approvedAt:
            new Date(),

          rejectedAt:
            null,

          rejectionReason:
            null,
        },
      });

    // ---------------------------------------------
    // NOTIFY LANDLORD
    // ---------------------------------------------

    await this.mailService
      .sendLandlordPropertyDecision({
        email:
          property
            .landlordProfile
            .user
            .email,

        firstName:
          property
            .landlordProfile
            .user
            .firstName,

        address:
          `${property.addressLine1}, ` +
          `${property.townCity}, ` +
          `${property.postcode}`,

        approved: true,

        agencyName:
          agency.name,
      });

    // ---------------------------------------------
    // RESPONSE
    // ---------------------------------------------

    return {
      message:
        "Property approved successfully.",

      property: updated,

      rentBreakdown: {
        landlordRent,

        commissionType:
          dto.commissionType,

        commissionValue,

        commissionAmount,

        tenantMonthlyRent,
      },
    };
  }

  // =====================================================
  // REJECT PROPERTY
  // =====================================================

  async rejectProperty(
    currentUserId: string,
    propertyId: string,
    reason: string,
  ) {
    const agency =
      await this.getAgency(
        currentUserId,
      );

    const profileIds =
      await this.getAgencyLandlordProfileIds(
        agency.id,
      );

    const property =
      await this.prisma.property.findFirst({
        where: {
          id: propertyId,

          landlordProfileId: {
            in: profileIds,
          },
        },

        include: {
          landlordProfile: {
            include: {
              user: true,
            },
          },
        },
      });

    if (!property) {
      throw new NotFoundException(
        "Property was not found for this agency.",
      );
    }

    if (
      property.approvalStatus !==
      "PENDING"
    ) {
      throw new BadRequestException(
        "Only a pending property can be rejected.",
      );
    }

    const rejectionReason =
      reason.trim();

    if (
      !rejectionReason
    ) {
      throw new BadRequestException(
        "A rejection reason is required.",
      );
    }

    const updated =
      await this.prisma.property.update({
        where: {
          id: propertyId,
        },

        data: {
          approvalStatus:
            "REJECTED",

          approvedAt:
            null,

          rejectedAt:
            new Date(),

          rejectionReason,

          // Remove any previous commission if
          // property has been returned for review.
          commissionType:
            null,

          commissionValue:
            null,

          commissionAmount:
            null,

          tenantMonthlyRent:
            null,
        },
      });

    await this.mailService
      .sendLandlordPropertyDecision({
        email:
          property
            .landlordProfile
            .user
            .email,

        firstName:
          property
            .landlordProfile
            .user
            .firstName,

        address:
          `${property.addressLine1}, ` +
          `${property.townCity}, ` +
          `${property.postcode}`,

        approved: false,

        reason:
          rejectionReason,

        agencyName:
          agency.name,
      });

    return {
      message:
        "Property rejected and the landlord has been notified.",

      property:
        updated,
    };
  }

  // =====================================================
  // PROPERTY RESPONSE
  // =====================================================

  private presentProperty(
    property: any,
  ) {
    const landlordRent =
      Number(
        property.monthlyRent,
      );

    const commissionValue =
      property.commissionValue !==
      null &&
      property.commissionValue !==
      undefined
        ? Number(
            property.commissionValue,
          )
        : null;

    const commissionAmount =
      property.commissionAmount !==
      null &&
      property.commissionAmount !==
      undefined
        ? Number(
            property.commissionAmount,
          )
        : null;

    const tenantMonthlyRent =
      property.tenantMonthlyRent !==
      null &&
      property.tenantMonthlyRent !==
      undefined
        ? Number(
            property.tenantMonthlyRent,
          )
        : landlordRent;

    return {
      ...property,

      // Make money values easier for frontend
      monthlyRent:
        landlordRent,

      commissionType:
        property.commissionType,

      commissionValue,

      commissionAmount,

      tenantMonthlyRent,

      landlord: {
        name:
          `${property.landlordProfile.user.firstName} ` +
          `${property.landlordProfile.user.lastName}`.trim(),

        email:
          property
            .landlordProfile
            .user
            .email,

        phone:
          property
            .landlordProfile
            .user
            .phone,
      },

      landlordProfile:
        undefined,

      // IMPORTANT:
      // Images are now served through /api/v1/uploads
      photoUrls:
        (
          property.photoNames ??
          []
        ).map(
          (
            name: string,
          ) =>
            `/api/v1/uploads/properties/${encodeURIComponent(
              name,
            )}`,
        ),
    };
  }
}