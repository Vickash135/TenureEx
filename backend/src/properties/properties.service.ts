import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import {
  existsSync,
  unlinkSync,
} from "fs";

import {
  join,
} from "path";

import { PrismaService } from "../database/prisma.service";
import { MailService } from "../mail/mail.service";
import { CreatePropertyDto } from "./dto/create-property.dto";
import { UpdatePropertyDto } from "./dto/update-property.dto";

@Injectable()
export class PropertiesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}


  // =========================================================
  // PUBLIC RENTAL SEARCH - APPROVED ESTATE AGENT LISTINGS ONLY
  // =========================================================

  async findApprovedPublic(filters: {
    location?: string;
    minBedrooms?: string;
    maxRent?: string;
    propertyType?: string;
  }) {
    const location = filters.location?.trim();
    const minimumBedrooms = filters.minBedrooms ? Number(filters.minBedrooms) : undefined;
    const maximumRent = filters.maxRent ? Number(filters.maxRent) : undefined;
    const propertyType = filters.propertyType?.trim().toUpperCase();

    const properties = await this.prisma.property.findMany({
      where: {
        approvalStatus: "APPROVED",
        propertyStatus: { not: "OCCUPIED" },
        ...(Number.isFinite(minimumBedrooms) ? { bedrooms: { gte: minimumBedrooms } } : {}),
        ...(Number.isFinite(maximumRent)
          ? {
              OR: [
                {
                  tenantMonthlyRent: {
                    lte: maximumRent,
                  },
                },
                {
                  tenantMonthlyRent: null,
                  monthlyRent: {
                    lte: maximumRent,
                  },
                },
              ],
            }
          : {}),
        ...(propertyType && propertyType !== "ANY" ? { propertyType: propertyType as any } : {}),
        ...(location ? {
          OR: [
            { townCity: { contains: location, mode: "insensitive" } },
            { county: { contains: location, mode: "insensitive" } },
            { postcode: { contains: location, mode: "insensitive" } },
            { addressLine1: { contains: location, mode: "insensitive" } },
          ],
        } : {}),
      },
      include: {
        landlordProfile: {
          include: {
            agency: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: [{ approvedAt: "desc" }, { createdAt: "desc" }],
    });

    return properties.map((property) => this.presentPublicProperty(property));
  }

  async findApprovedPublicOne(propertyId: string) {
    const property = await this.prisma.property.findFirst({
      where: { id: propertyId, approvalStatus: "APPROVED", propertyStatus: { not: "OCCUPIED" } },
      include: {
        landlordProfile: {
          include: {
            agency: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!property) throw new NotFoundException("This rental property is not available.");
    return this.presentPublicProperty(property);
  }

  private presentPublicProperty(property: any) {
    return {
      id: property.id,
      title: property.advertisingTitle || `${this.toTitleCase(property.propertyType)} to rent in ${property.townCity}`,
      addressLine1: property.addressLine1,
      addressLine2: property.addressLine2,
      townCity: property.townCity,
      county: property.county,
      postcode: property.postcode,
      propertyType: property.propertyType,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      receptionRooms: property.receptionRooms,
      monthlyRent:
        property.tenantMonthlyRent ??
        property.monthlyRent,

      // Keep the original landlord rent available internally in the
      // response without exposing the commission calculation itself.
      landlordMonthlyRent:
        property.monthlyRent,

      tenantMonthlyRent:
        property.tenantMonthlyRent ??
        property.monthlyRent,
      depositAmount: property.depositAmount,
      furnishingStatus: property.furnishingStatus,
      availableFrom: property.availableFrom,
      petsAllowed: property.petsAllowed,
      childrenAllowed: property.childrenAllowed,
      hasParking: property.hasParking,
      hasGarden: property.hasGarden,
      hasLift: property.hasLift,
      hasWheelchairAccess: property.hasWheelchairAccess,
      description: property.description,
      councilTaxBand: property.councilTaxBand,
      approvedAt: property.approvedAt,
      agency: property.landlordProfile?.agency ? {
        id: property.landlordProfile.agency.id,
        name: property.landlordProfile.agency.name,
      } : null,
      photoUrls:
        (property.photoNames ?? []).map(
          (name: string) =>
            `/api/v1/uploads/properties/${encodeURIComponent(
              name,
            )}`,
        ),
    };
  }

  private toTitleCase(value: string) {
    return value.toLowerCase().split("_").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
  }

  // =========================================================
  // CREATE PROPERTY
  // =========================================================

  async create(
    userId: string,
    dto: CreatePropertyDto,
  ) {
    const landlordProfile =
      await this.getLandlordProfile(userId);

    this.validateBusinessRules(dto);

    const created = await this.prisma.property.create({
      data: {
        landlordProfileId:
          landlordProfile.id,

        addressLine1:
          dto.addressLine1.trim(),

        addressLine2:
          this.clean(dto.addressLine2),

        townCity:
          dto.townCity.trim(),

        county:
          this.clean(dto.county),

        postcode:
          dto.postcode
            .trim()
            .toUpperCase(),

        propertyType:
          dto.propertyType,

        bedrooms:
          dto.bedrooms,

        bathrooms:
          dto.bathrooms,

        receptionRooms:
          dto.receptionRooms,

        monthlyRent:
          dto.monthlyRent,

        depositAmount:
          dto.depositAmount,

        councilTaxBand:
          this.clean(dto.councilTaxBand),

        furnishingStatus:
          dto.furnishingStatus,

        propertyStatus:
          dto.propertyStatus,

        approvalStatus:
          "PENDING",

        tenantName:
          this.clean(dto.tenantName),

        tenantEmail:
          this.cleanLower(
            dto.tenantEmail,
          ),

        tenantPhone:
          this.clean(dto.tenantPhone),

        availableFrom:
          this.parseOptionalDate(
            dto.availableFrom,
          ),

        petsAllowed:
          dto.petsAllowed,

        smokingAllowed:
          dto.smokingAllowed,

        childrenAllowed:
          dto.childrenAllowed,

        hasParking:
          dto.hasParking,

        hasGarden:
          dto.hasGarden,

        hasLift:
          dto.hasLift,

        hasWheelchairAccess:
          dto.hasWheelchairAccess,

        description:
          this.clean(dto.description),

        specialNotes:
          this.clean(dto.specialNotes),

        gasSupplier:
          this.clean(dto.gasSupplier),

        electricitySupplier:
          this.clean(
            dto.electricitySupplier,
          ),

        waterSupplier:
          this.clean(dto.waterSupplier),

        councilName:
          this.clean(dto.councilName),

        gasSafetyExpiry:
          this.parseOptionalDate(
            dto.gasSafetyExpiry,
          ),

        epcExpiry:
          this.parseOptionalDate(
            dto.epcExpiry,
          ),

        eicrExpiry:
          this.parseOptionalDate(
            dto.eicrExpiry,
          ),

        maintenanceRoute:
          dto.maintenanceRoute,

        preferredContractor:
          this.clean(
            dto.preferredContractor,
          ),

        emergencyRepairPermission:
          dto.emergencyRepairPermission,

        emergencySpendingLimit:
          dto.emergencySpendingLimit,

        advertisingAllowed:
          dto.advertisingAllowed,

        advertisingTitle:
          this.clean(
            dto.advertisingTitle,
          ),

        photoNames:
          dto.photoNames ?? [],

        submittedForReviewAt:
          new Date(),
      },
    });

    await this.notifyAgencyOfPendingProperty(landlordProfile, created);
    return created;
  }

  // =========================================================
  // ADD REAL UPLOADED PHOTOS
  // =========================================================

  async addPhotos(
    userId: string,
    propertyId: string,
    files: Express.Multer.File[],
  ) {
    const property =
      await this.findOneMine(
        userId,
        propertyId,
      );

    if (!files.length) {
      throw new BadRequestException(
        "No property photos were uploaded.",
      );
    }

    const newPhotoNames =
      files.map(
        (file) => file.filename,
      );

    const allPhotos = [
      ...(property.photoNames ?? []),
      ...newPhotoNames,
    ];

    if (allPhotos.length > 10) {
      // Delete the newly uploaded files because
      // the request cannot be accepted.
      for (const file of files) {
        this.deletePhysicalPhoto(
          file.filename,
        );
      }

      throw new BadRequestException(
        "A property can have a maximum of 10 photos.",
      );
    }

    const updated =
      await this.prisma.property.update({
        where: {
          id: propertyId,
        },

        data: {
          photoNames: allPhotos,

          approvalStatus:
            "PENDING",

          submittedForReviewAt:
            new Date(),

          approvedAt:
            null,

          rejectedAt:
            null,

          rejectionReason:
            null,

          // Any landlord-side change requires the estate agent
          // to review and set/reconfirm commission again.
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

    await this.notifyAgencyOfPendingProperty(await this.getLandlordProfile(userId), updated);

    return {
      message:
        "Property photos uploaded successfully.",

      uploadedPhotos:
        newPhotoNames,

      property:
        updated,
    };
  }

  // =========================================================
  // GET ALL MY PROPERTIES
  // =========================================================

  async findMine(
    userId: string,
  ) {
    const landlordProfile =
      await this.getLandlordProfile(
        userId,
      );

    const properties =
      await this.prisma.property.findMany({
        where: {
          landlordProfileId:
            landlordProfile.id,
        },

        orderBy: {
          createdAt: "desc",
        },
      });

    return properties.map(
      (property) =>
        this.withPhotoUrls(property),
    );
  }

  // =========================================================
  // GET ONE PROPERTY
  // =========================================================

  async findOneMine(
    userId: string,
    propertyId: string,
  ) {
    const landlordProfile =
      await this.getLandlordProfile(
        userId,
      );

    const property =
      await this.prisma.property.findFirst({
        where: {
          id: propertyId,

          landlordProfileId:
            landlordProfile.id,
        },
      });

    if (!property) {
      throw new NotFoundException(
        "Property was not found.",
      );
    }

    return property;
  }

  // =========================================================
  // UPDATE PROPERTY
  // =========================================================

  async updateMine(
    userId: string,
    propertyId: string,
    dto: UpdatePropertyDto,
  ) {
    const current =
      await this.findOneMine(
        userId,
        propertyId,
      );

    this.validateBusinessRules({
      propertyStatus:
        dto.propertyStatus ??
        current.propertyStatus,

      tenantName:
        dto.tenantName ??
        current.tenantName ??
        undefined,

      emergencyRepairPermission:
        dto.emergencyRepairPermission ??
        current.emergencyRepairPermission,

      emergencySpendingLimit:
        dto.emergencySpendingLimit ??
        (
          current.emergencySpendingLimit
            ? Number(
                current.emergencySpendingLimit,
              )
            : undefined
        ),

      advertisingAllowed:
        dto.advertisingAllowed ??
        current.advertisingAllowed,

      advertisingTitle:
        dto.advertisingTitle ??
        current.advertisingTitle ??
        undefined,
    });

    const data:
      Record<string, unknown> = {};

    const directFields = [
      "propertyType",
      "bedrooms",
      "bathrooms",
      "receptionRooms",
      "monthlyRent",
      "depositAmount",
      "furnishingStatus",
      "propertyStatus",
      "petsAllowed",
      "smokingAllowed",
      "childrenAllowed",
      "hasParking",
      "hasGarden",
      "hasLift",
      "hasWheelchairAccess",
      "maintenanceRoute",
      "emergencyRepairPermission",
      "emergencySpendingLimit",
      "advertisingAllowed",
      "photoNames",
    ] as const;

    for (
      const field of directFields
    ) {
      if (
        dto[field] !== undefined
      ) {
        data[field] =
          dto[field];
      }
    }

    const textFields = [
      "addressLine1",
      "addressLine2",
      "townCity",
      "county",
      "councilTaxBand",
      "tenantName",
      "tenantPhone",
      "description",
      "specialNotes",
      "gasSupplier",
      "electricitySupplier",
      "waterSupplier",
      "councilName",
      "preferredContractor",
      "advertisingTitle",
    ] as const;

    for (
      const field of textFields
    ) {
      if (
        dto[field] !== undefined
      ) {
        data[field] =
          this.clean(
            dto[field],
          );
      }
    }

    if (
      dto.postcode !== undefined
    ) {
      data.postcode =
        dto.postcode
          .trim()
          .toUpperCase();
    }

    if (
      dto.tenantEmail !== undefined
    ) {
      data.tenantEmail =
        this.cleanLower(
          dto.tenantEmail,
        );
    }

    const dateFields = [
      "availableFrom",
      "gasSafetyExpiry",
      "epcExpiry",
      "eicrExpiry",
    ] as const;

    for (
      const field of dateFields
    ) {
      if (
        dto[field] !== undefined
      ) {
        data[field] =
          this.parseOptionalDate(
            dto[field],
          );
      }
    }

    // Any landlord edit returns
    // the property to review.
    data.approvalStatus =
      "PENDING";

    data.submittedForReviewAt =
      new Date();

    data.approvedAt =
      null;

    data.rejectedAt =
      null;

    data.rejectionReason =
      null;

    // Any landlord edit returns the property for estate-agent review.
    // Remove the previous commission/final tenant rent so the agent
    // must set or reconfirm it before approving again.
    data.commissionType =
      null;

    data.commissionValue =
      null;

    data.commissionAmount =
      null;

    data.tenantMonthlyRent =
      null;

    const updated =
      await this.prisma.property.update({
        where: {
          id: propertyId,
        },

        data,
      });

    await this.notifyAgencyOfPendingProperty(await this.getLandlordProfile(userId), updated);

    return this.withPhotoUrls(
      updated,
    );
  }

  // =========================================================
  // DELETE PROPERTY
  // =========================================================

  async removeMine(
    userId: string,
    propertyId: string,
  ) {
    const property =
      await this.findOneMine(
        userId,
        propertyId,
      );

    // Delete stored property photos
    for (
      const photoName
      of property.photoNames ?? []
    ) {
      this.deletePhysicalPhoto(
        photoName,
      );
    }

    await this.prisma.property.delete({
      where: {
        id: propertyId,
      },
    });

    return {
      message:
        "Property deleted successfully.",
    };
  }

  // =========================================================
  // LANDLORD VALIDATION
  // =========================================================

  private async getLandlordProfile(
    userId: string,
  ) {
    const user =
      await this.prisma.user.findUnique({
        where: {
          id: userId,
        },

        include: {
          landlordProfile:
            true,
        },
      });

    if (!user) {
      throw new NotFoundException(
        "User account was not found.",
      );
    }

    if (
      user.userType !==
      "LANDLORD"
    ) {
      throw new ForbiddenException(
        "Only landlords can manage landlord properties.",
      );
    }

    if (
      user.status !==
      "ACTIVE"
    ) {
      throw new ForbiddenException(
        "Your landlord account must be active before you can manage properties.",
      );
    }

    if (
      !user.landlordProfile
    ) {
      throw new NotFoundException(
        "Landlord profile was not found.",
      );
    }

    return user.landlordProfile;
  }

  private async notifyAgencyOfPendingProperty(
    landlordProfile: { id: string },
    property: { addressLine1: string; townCity: string; postcode: string },
  ) {
    const rows = await this.prisma.$queryRawUnsafe<Array<{ contactEmail: string; agencyName: string; firstName: string; lastName: string }>>(
      `SELECT a."contactEmail", a."name" AS "agencyName", u."firstName", u."lastName"
       FROM "LandlordProfile" lp
       JOIN "Agency" a ON a."id" = lp."agencyId"
       JOIN "User" u ON u."id" = lp."userId"
       WHERE lp."id" = $1 LIMIT 1`,
      landlordProfile.id,
    );
    const linked = rows[0];
    if (!linked?.contactEmail) return;
    try {
      await this.mailService.sendAgencyPropertyReviewNotification({
        email: linked.contactEmail,
        agencyName: linked.agencyName,
        landlordName: `${linked.firstName} ${linked.lastName}`.trim(),
        address: `${property.addressLine1}, ${property.townCity}, ${property.postcode}`,
      });
    } catch (error) {
      console.error("Could not send property approval notification email:", error);
    }
  }

  // =========================================================
  // BUSINESS RULES
  // =========================================================

  private validateBusinessRules(
    dto: {
      propertyStatus?: string;
      tenantName?: string;
      emergencyRepairPermission?: boolean;
      emergencySpendingLimit?: number;
      advertisingAllowed?: boolean;
      advertisingTitle?: string;
    },
  ) {
    if (
      dto.propertyStatus ===
        "OCCUPIED" &&
      !dto.tenantName?.trim()
    ) {
      throw new BadRequestException(
        "Tenant name is required for an occupied property.",
      );
    }

    if (
      dto.emergencyRepairPermission &&
      (
        !dto.emergencySpendingLimit ||
        dto.emergencySpendingLimit <= 0
      )
    ) {
      throw new BadRequestException(
        "Enter a valid emergency repair spending limit.",
      );
    }

    if (
      dto.advertisingAllowed &&
      !dto.advertisingTitle?.trim()
    ) {
      throw new BadRequestException(
        "Advertising title is required when advertising is allowed.",
      );
    }
  }

  // =========================================================
  // DATE HELPER
  // =========================================================

  private parseOptionalDate(
    value?: string | null,
  ): Date | null {
    if (!value?.trim()) {
      return null;
    }

    const parsed =
      new Date(value);

    if (
      Number.isNaN(
        parsed.getTime(),
      )
    ) {
      throw new BadRequestException(
        `Invalid date value: ${value}`,
      );
    }

    return parsed;
  }

  // =========================================================
  // TEXT HELPERS
  // =========================================================

  private clean(
    value?: string | null,
  ): string | null {
    const cleaned =
      value?.trim();

    return cleaned
      ? cleaned
      : null;
  }

  private cleanLower(
    value?: string | null,
  ): string | null {
    const cleaned =
      this.clean(value);

    return (
      cleaned?.toLowerCase() ??
      null
    );
  }

  // =========================================================
  // PHOTO HELPERS
  // =========================================================

  private deletePhysicalPhoto(
    photoName: string,
  ) {
    if (!photoName) {
      return;
    }

    const filePath =
      join(
        process.cwd(),
        "uploads",
        "properties",
        photoName,
      );

    if (
      existsSync(filePath)
    ) {
      try {
        unlinkSync(filePath);
      } catch (error) {
        console.error(
          "Could not delete property photo:",
          filePath,
          error,
        );
      }
    }
  }

  private withPhotoUrls<
    T extends {
      photoNames: string[];
    },
  >(
    property: T,
  ) {
    return {
      ...property,

      photoUrls:
        (
          property.photoNames ??
          []
        ).map(
          (photoName) =>
            `/api/v1/uploads/properties/${encodeURIComponent(
              photoName,
            )}`,
        ),
    };
  }
}