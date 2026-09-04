import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import * as argon2 from "argon2";
import { createHash, randomBytes } from "crypto";
import { PrismaService } from "../database/prisma.service";
import { MailService } from "../mail/mail.service";
import {
  CompleteMaintenanceInvitationDto,
  CompleteTenantInvitationDto,
  ConfirmMaintenanceDto,
  CreateMaintenanceRequestDto,
  CreateTenantInquiryDto,
  InviteMaintenanceDto,
  InviteTenantDto,
  ResubmitTenantApplicationDto,
  ReviewMaintenanceProviderDto,
  ReviewTenantApplicationDto,
  UpdateMaintenanceStatusDto,
} from "./dto/workflow.dto";

@Injectable()
export class PropertyWorkflowsService {
  private readonly db: any;

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {
    // `any` intentionally keeps this source compilable against the currently
    // generated Prisma client before the production `prisma generate` step.
    this.db = prisma as any;
  }

  private normaliseEmail(email: string) { return email.trim().toLowerCase(); }
  private tokenHash(token: string) { return createHash("sha256").update(token).digest("hex"); }
  private newToken() { return randomBytes(32).toString("hex"); }
  private clean(value?: string | null) { const v = value?.trim(); return v ? v : null; }

  private buildTenantAgreement(property: any) {
    const rent = String(property.tenantMonthlyRent ?? property.monthlyRent);
    const deposit = property.depositAmount ? String(property.depositAmount) : null;
    const address = [property.addressLine1, property.addressLine2, property.townCity, property.county, property.postcode].filter(Boolean).join(", ");
    return {
      title: `Tenancy Agreement - ${property.addressLine1}`,
      version: "1.0",
      propertyId: property.id,
      propertyAddress: address,
      monthlyRent: rent,
      depositAmount: deposit,
      availableFrom: property.availableFrom ?? null,
      terms: [
        `The tenancy relates to ${address}.`,
        `The monthly rent is £${rent}${deposit ? ` and the recorded deposit is £${deposit}` : ""}.`,
        "The tenant agrees to pay rent when due, use the property as their home, take reasonable care of it and promptly report repairs or safety concerns.",
        "The tenant must not deliberately damage the property and must follow the recorded property rules relating to smoking, pets, occupants and communal areas.",
        "The landlord remains responsible for landlord repair and safety duties required by the tenancy and applicable law. The Estate Agent may administer the tenancy on the landlord's behalf where authorised.",
        "Maintenance requests may be managed through TenureEx. The tenant can provide one or more suitable appointment windows and should provide reasonable access for an agreed visit.",
        "Maintenance providers may upload before-and-after evidence. A maintenance job is not finally completed in TenureEx until the tenant confirms that the reported issue has been resolved.",
        "Personal information and uploaded documents are used for tenancy administration, verification, property management and maintenance in accordance with the TenureEx privacy process.",
        "Submitting this application and electronic signature records the tenant's acceptance of these displayed tenancy terms. Estate Agent approval is still required before tenant dashboard/property access is activated.",
      ],
      propertyRules: {
        petsAllowed: Boolean(property.petsAllowed),
        smokingAllowed: Boolean(property.smokingAllowed),
        childrenAllowed: Boolean(property.childrenAllowed),
        furnishingStatus: property.furnishingStatus ?? null,
      },
    };
  }

  private async propertyContext(propertyId: string) {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
      include: {
        landlordProfile: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true } },
            agency: { select: { id: true, name: true, contactEmail: true } },
          },
        },
      },
    });
    if (!property) throw new NotFoundException("Property was not found.");
    if (!property.landlordProfile.agencyId || !property.landlordProfile.agency) {
      throw new BadRequestException("This property is not currently linked to an estate agency.");
    }
    return property;
  }

  private async agentForProperty(userId: string, propertyId: string) {
    const property = await this.propertyContext(propertyId);
    const membership = await this.prisma.agencyUser.findFirst({
      where: { userId, agencyId: property.landlordProfile.agencyId! },
      include: { user: true },
    });
    if (!membership) throw new ForbiddenException("Only an Estate Agent for this property can perform this action.");
    return { property, membership };
  }

  private async actorRoleForProperty(userId: string, propertyId: string, preferredRole?: "ESTATE_AGENT" | "LANDLORD" | "TENANT") {
    const property = await this.propertyContext(propertyId);
    const isLandlord = property.landlordProfile.userId === userId;
    const agent = await this.prisma.agencyUser.findFirst({ where: { userId, agencyId: property.landlordProfile.agencyId! } });
    const tenantLink = await this.db.propertyTenant.findFirst({ where: { propertyId, tenantUserId: userId, status: "ACTIVE" } });

    if (preferredRole) {
      if (preferredRole === "LANDLORD" && isLandlord) return { role: "LANDLORD", property };
      if (preferredRole === "ESTATE_AGENT" && agent) return { role: "ESTATE_AGENT", property };
      if (preferredRole === "TENANT" && tenantLink) return { role: "TENANT", property };
      throw new ForbiddenException(`You cannot act as ${preferredRole.replaceAll("_", " ")} for this property.`);
    }

    if (isLandlord) return { role: "LANDLORD", property };
    if (agent) return { role: "ESTATE_AGENT", property };
    if (tenantLink) return { role: "TENANT", property };
    throw new ForbiddenException("You are not linked to this property.");
  }

  private async addRole(tx: any, userId: string, code: string, name: string) {
    const role = await tx.role.upsert({
      where: { code },
      update: { enabled: true, name },
      create: { code, name, description: `TenureEx ${name} account role.`, scope: "GLOBAL", isSystem: true, enabled: true },
    });
    await tx.userRole.upsert({
      where: { userId_roleId: { userId, roleId: role.id } },
      update: {},
      create: { userId, roleId: role.id },
    });
  }

  private async notify(userId: string | null | undefined, type: string, title: string, message: string, entityType?: string, entityId?: string) {
    if (!userId) return;
    await this.db.notification.create({ data: { recipientUserId: userId, type, title, message, entityType: entityType || null, entityId: entityId || null } });
  }

  // ---------------- PUBLIC PROPERTY ENQUIRY ----------------
  async createTenantInquiry(dto: CreateTenantInquiryDto) {
    const property = await this.prisma.property.findFirst({ where: { id: dto.propertyId, approvalStatus: "APPROVED", propertyStatus: { not: "OCCUPIED" } }, include: { landlordProfile: true } });
    if (!property) throw new NotFoundException("This rental property is not available.");
    const email = this.normaliseEmail(dto.email);
    const user = await this.prisma.user.findUnique({ where: { email } });
    const inquiry = await this.db.tenantPropertyInquiry.create({
      data: { propertyId: property.id, userId: user?.id || null, firstName: dto.firstName.trim(), lastName: dto.lastName.trim(), email, phone: this.clean(dto.phone), message: this.clean(dto.message) },
    });
    return { message: "Your property enquiry has been sent to the Estate Agent.", inquiry };
  }

  // ---------------- TENANT INVITATION / APPLICATION ----------------
  async inviteTenant(agentUserId: string, dto: InviteTenantDto) {
    const { property, membership } = await this.agentForProperty(agentUserId, dto.propertyId);
    if (property.approvalStatus !== "APPROVED") throw new BadRequestException("Only an approved property can receive tenant invitations.");
    const email = this.normaliseEmail(dto.email);
    const existingActive = await this.db.propertyTenant.findFirst({ where: { propertyId: property.id, status: "ACTIVE", tenantUserId: (await this.prisma.user.findUnique({ where: { email } }))?.id || "__none__" } });
    if (existingActive) throw new ConflictException("This tenant is already active for this property.");

    await this.db.tenantInvitation.updateMany({ where: { propertyId: property.id, email, status: "PENDING" }, data: { status: "CANCELLED" } });
    const rawToken = this.newToken();
    const invitation = await this.db.tenantInvitation.create({
      data: { propertyId: property.id, agencyId: property.landlordProfile.agencyId, invitedByUserId: agentUserId, email, firstName: this.clean(dto.firstName), lastName: this.clean(dto.lastName), tokenHash: this.tokenHash(rawToken), expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    });
    await this.mailService.sendTenantPropertyInvitation({
      email,
      firstName: dto.firstName || "Tenant",
      propertyAddress: `${property.addressLine1}, ${property.townCity}, ${property.postcode}`,
      agencyName: property.landlordProfile.agency!.name,
      token: rawToken,
    });
    await this.db.tenantPropertyInquiry.updateMany({
      where: { propertyId: property.id, email, status: "NEW" },
      data: { status: "INVITED" },
    });
    await this.notify(property.landlordProfile.userId, "TENANT_INVITED", "Tenant invited", `${membership.user.firstName} invited ${email} for ${property.addressLine1}.`, "TenantInvitation", invitation.id);
    return { message: "Tenant invitation sent successfully.", invitationId: invitation.id };
  }

  async inspectTenantInvitation(token: string) {
    const invitation = await this.db.tenantInvitation.findUnique({ where: { tokenHash: this.tokenHash(token) } });
    if (!invitation || invitation.status !== "PENDING" || new Date(invitation.expiresAt) <= new Date()) throw new BadRequestException("This tenant invitation is invalid or expired.");
    const property = await this.propertyContext(invitation.propertyId);
    return {
      invitationId: invitation.id,
      email: invitation.email,
      firstName: invitation.firstName,
      lastName: invitation.lastName,
      property: { id: property.id, addressLine1: property.addressLine1, addressLine2: property.addressLine2, townCity: property.townCity, county: property.county, postcode: property.postcode, monthlyRent: property.tenantMonthlyRent ?? property.monthlyRent, depositAmount: property.depositAmount },
      agency: property.landlordProfile.agency,
      agreement: this.buildTenantAgreement(property),
    };
  }

  async completeTenantInvitation(dto: CompleteTenantInvitationDto) {
    if (!dto.acceptedAgreement) throw new BadRequestException("The tenancy agreement must be accepted before submission.");
    const invitation = await this.db.tenantInvitation.findUnique({ where: { tokenHash: this.tokenHash(dto.token) } });
    if (!invitation || invitation.status !== "PENDING" || new Date(invitation.expiresAt) <= new Date()) throw new BadRequestException("This tenant invitation is invalid or expired.");
    const property = await this.propertyContext(invitation.propertyId);
    const email = this.normaliseEmail(invitation.email);
    let user = await this.prisma.user.findUnique({ where: { email }, include: { tenantProfile: true } });
    const existingAccount = !!user;
    if (user?.passwordHash) {
      if (!(await argon2.verify(user.passwordHash, dto.password))) throw new BadRequestException("Enter the existing TenureEx account password to add the Tenant role.");
    }
    const passwordHash = user?.passwordHash || await argon2.hash(dto.password);
    const now = new Date();

    const result = await this.prisma.$transaction(async (tx: any) => {
      if (!user) {
        user = await tx.user.create({ data: { firstName: dto.firstName.trim(), lastName: dto.lastName.trim(), email, phone: this.clean(dto.phone), passwordHash, userType: "TENANT", status: "PENDING_REVIEW", emailVerified: true, phoneVerified: false } });
      } else {
        await tx.user.update({ where: { id: user.id }, data: { firstName: dto.firstName.trim(), lastName: dto.lastName.trim(), phone: this.clean(dto.phone) ?? user.phone } });
      }
      const tenantUser = user!;
      let profile = await tx.tenantProfile.findUnique({ where: { userId: tenantUser.id } });
      if (!profile) {
        profile = await tx.tenantProfile.create({ data: { userId: tenantUser.id, dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : null, currentAddress: this.clean(dto.currentAddress), postcode: dto.postcode?.trim().toUpperCase() || null } });
      } else {
        profile = await tx.tenantProfile.update({ where: { id: profile.id }, data: { dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : profile.dateOfBirth, currentAddress: this.clean(dto.currentAddress) ?? profile.currentAddress, postcode: dto.postcode?.trim().toUpperCase() || profile.postcode } });
      }
      await this.addRole(tx, tenantUser.id, "GLOBAL_TENANT", "Tenant");
      const existingApplication = await (tx as any).tenantPropertyApplication.findFirst({ where: { propertyId: property.id, tenantProfileId: profile.id } });
      if (existingApplication) throw new ConflictException("A tenant application already exists for this property.");
      const application = await (tx as any).tenantPropertyApplication.create({
        data: {
          propertyId: property.id, tenantUserId: tenantUser.id, tenantProfileId: profile.id, invitationId: invitation.id, agencyId: property.landlordProfile.agencyId, landlordUserId: property.landlordProfile.userId,
          status: "PENDING_REVIEW", dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : null, currentAddress: this.clean(dto.currentAddress), postcode: dto.postcode?.trim().toUpperCase() || null, phone: this.clean(dto.phone), identificationType: this.clean(dto.identificationType), identificationFileUrl: this.clean(dto.identificationFileUrl), emergencyContactName: this.clean(dto.emergencyContactName), emergencyContactPhone: this.clean(dto.emergencyContactPhone), additionalNotes: this.clean(dto.additionalNotes),
          agreementTitle: `Tenancy Agreement - ${property.addressLine1}`, agreementVersion: "1.0", agreementTerms: { ...this.buildTenantAgreement(property), accepted: true }, agreementSignedAt: now, signatureName: dto.signatureName.trim(), submittedAt: now,
        },
      });
      await (tx as any).tenantInvitation.update({ where: { id: invitation.id }, data: { status: "ACCEPTED", acceptedAt: now } });
      return { application, profile, userId: tenantUser.id };
    });

    const agents = await this.prisma.agencyUser.findMany({ where: { agencyId: property.landlordProfile.agencyId! }, include: { user: true } });
    for (const a of agents) await this.notify(a.userId, "TENANT_APPLICATION_SUBMITTED", "Tenant application submitted", `${dto.firstName} ${dto.lastName} submitted tenant details and signed the agreement for ${property.addressLine1}.`, "TenantPropertyApplication", result.application.id);
    await this.notify(property.landlordProfile.userId, "TENANT_APPLICATION_SUBMITTED", "Tenant application submitted", `${dto.firstName} ${dto.lastName} submitted an application for your property ${property.addressLine1}.`, "TenantPropertyApplication", result.application.id);
    await this.mailService.sendTenantApplicationSubmittedToAgent({ email: property.landlordProfile.agency!.contactEmail, tenantName: `${dto.firstName} ${dto.lastName}`, propertyAddress: `${property.addressLine1}, ${property.townCity}, ${property.postcode}` });
    return { message: existingAccount ? "Tenant application added to your existing TenureEx account and sent for Estate Agent approval." : "Tenant registration submitted. Estate Agent approval is required before dashboard access.", applicationId: result.application.id, status: "PENDING_REVIEW" };
  }

  async listTenantInquiriesForAgent(agentUserId: string) {
    const memberships = await this.prisma.agencyUser.findMany({ where: { userId: agentUserId } });
    if (!memberships.length) throw new ForbiddenException("Estate Agent access is required.");
    const agencyIds = memberships.map((m) => m.agencyId);
    const properties = await this.prisma.property.findMany({
      where: { landlordProfile: { agencyId: { in: agencyIds } } },
      select: { id: true, addressLine1: true, townCity: true, postcode: true, propertyStatus: true, approvalStatus: true },
    });
    if (!properties.length) return [];
    const propertyIds = properties.map((property) => property.id);
    const inquiries = await this.db.tenantPropertyInquiry.findMany({
      where: { propertyId: { in: propertyIds } },
      orderBy: { createdAt: "desc" },
    });
    return inquiries.map((inquiry: any) => ({
      ...inquiry,
      property: properties.find((property) => property.id === inquiry.propertyId) || null,
    }));
  }

  async listTenantApplicationsForAgent(agentUserId: string) {
    const memberships = await this.prisma.agencyUser.findMany({
      where: { userId: agentUserId },
    });
    if (!memberships.length) {
      throw new ForbiddenException("Estate Agent access is required.");
    }

    const agencyIds: string[] = memberships.map(
      (membership) => membership.agencyId,
    );

    const applications = await this.db.tenantPropertyApplication.findMany({
      where: { agencyId: { in: agencyIds } },
      orderBy: { createdAt: "desc" },
    });

    const tenantIds: string[] = [
      ...new Set<string>(
        applications
          .map((item: any) => item.tenantUserId)
          .filter((id: unknown): id is string => typeof id === "string"),
      ),
    ];

    const propertyIds: string[] = [
      ...new Set<string>(
        applications
          .map((item: any) => item.propertyId)
          .filter((id: unknown): id is string => typeof id === "string"),
      ),
    ];

    const [tenants, properties] = await Promise.all([
      this.prisma.user.findMany({
        where: { id: { in: tenantIds } },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
        },
      }),
      this.prisma.property.findMany({
        where: { id: { in: propertyIds } },
        select: {
          id: true,
          addressLine1: true,
          townCity: true,
          postcode: true,
        },
      }),
    ]);

    return applications.map((application: any) => ({
      ...application,
      tenant:
        tenants.find(
          (tenant) => tenant.id === application.tenantUserId,
        ) || null,
      property:
        properties.find(
          (property) => property.id === application.propertyId,
        ) || null,
    }));
  }

  async listActiveTenantsForAgent(agentUserId: string) {
    const memberships = await this.prisma.agencyUser.findMany({
      where: { userId: agentUserId },
    });
    if (!memberships.length) {
      throw new ForbiddenException("Estate Agent access is required.");
    }

    const agencyIds: string[] = memberships.map(
      (membership) => membership.agencyId,
    );

    const properties = await this.prisma.property.findMany({
      where: {
        landlordProfile: {
          agencyId: { in: agencyIds },
        },
      },
      select: {
        id: true,
        addressLine1: true,
        addressLine2: true,
        townCity: true,
        county: true,
        postcode: true,
      },
    });

    if (!properties.length) return [];

    const propertyIds: string[] = properties.map(
      (property) => property.id,
    );

    const links = await this.db.propertyTenant.findMany({
      where: {
        propertyId: { in: propertyIds },
        status: "ACTIVE",
      },
      orderBy: { startedAt: "desc" },
    });

    const tenantIds: string[] = [
      ...new Set<string>(
        links
          .map((link: any) => link.tenantUserId)
          .filter((id: unknown): id is string => typeof id === "string"),
      ),
    ];

    const tenants = await this.prisma.user.findMany({
      where: { id: { in: tenantIds } },
      include: { tenantProfile: true },
    });

    return links.map((link: any) => ({
      ...link,
      tenant:
        tenants.find(
          (tenant) => tenant.id === link.tenantUserId,
        ) || null,
      property:
        properties.find(
          (property) => property.id === link.propertyId,
        ) || null,
    }));
  }

  async getTenantApplicationForAgent(agentUserId: string, applicationId: string) {
    const application = await this.db.tenantPropertyApplication.findUnique({ where: { id: applicationId } });
    if (!application) throw new NotFoundException("Tenant application was not found.");
    await this.agentForProperty(agentUserId, application.propertyId);
    const tenant = await this.prisma.user.findUnique({ where: { id: application.tenantUserId }, include: { tenantProfile: true } });
    const property = await this.propertyContext(application.propertyId);
    return { ...application, tenant, property };
  }

  async reviewTenantApplication(agentUserId: string, applicationId: string, dto: ReviewTenantApplicationDto) {
    const application = await this.db.tenantPropertyApplication.findUnique({ where: { id: applicationId } });
    if (!application) throw new NotFoundException("Tenant application was not found.");
    const { property } = await this.agentForProperty(agentUserId, application.propertyId);
    const now = new Date();
    if (dto.action === "REQUEST_MORE_INFORMATION") {
      if (!dto.message?.trim()) throw new BadRequestException("Enter the information required from the tenant.");
      const rawToken = this.newToken();
      const updated = await this.db.tenantPropertyApplication.update({
        where: { id: applicationId },
        data: {
          status: "MORE_INFORMATION_REQUIRED",
          moreInformationRequest: dto.message.trim(),
          moreInformationResponse: null,
          moreInformationTokenHash: this.tokenHash(rawToken),
          moreInformationTokenExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          reviewedAt: now,
          reviewedByUserId: agentUserId,
        },
      });
      await this.notify(application.tenantUserId, "TENANT_MORE_INFORMATION", "More information required", dto.message.trim(), "TenantPropertyApplication", applicationId);
      const tenant = await this.prisma.user.findUnique({ where: { id: application.tenantUserId } });
      if (tenant) {
        await this.mailService.sendTenantMoreInformationRequest({
          email: tenant.email,
          firstName: tenant.firstName,
          propertyAddress: `${property.addressLine1}, ${property.townCity}, ${property.postcode}`,
          message: dto.message.trim(),
          token: rawToken,
        });
      }
      return updated;
    }
    if (dto.action === "REJECT") {
      const updated = await this.db.tenantPropertyApplication.update({ where: { id: applicationId }, data: { status: "REJECTED", rejectionReason: this.clean(dto.message), reviewedAt: now, reviewedByUserId: agentUserId, moreInformationTokenHash: null, moreInformationTokenExpiresAt: null } });
      await this.notify(application.tenantUserId, "TENANT_APPLICATION_REJECTED", "Tenant application not approved", dto.message?.trim() || "Your tenant application was not approved.", "TenantPropertyApplication", applicationId);
      return updated;
    }
    const updated = await this.prisma.$transaction(async (tx: any) => {
      const app = await (tx as any).tenantPropertyApplication.update({ where: { id: applicationId }, data: { status: "APPROVED", reviewedAt: now, reviewedByUserId: agentUserId, approvedAt: now, moreInformationTokenHash: null, moreInformationTokenExpiresAt: null } });
      await (tx as any).propertyTenant.upsert({ where: { propertyId_tenantProfileId: { propertyId: application.propertyId, tenantProfileId: application.tenantProfileId } }, update: { status: "ACTIVE", endedAt: null }, create: { propertyId: application.propertyId, tenantUserId: application.tenantUserId, tenantProfileId: application.tenantProfileId, applicationId, status: "ACTIVE" } });
      await tx.property.update({ where: { id: application.propertyId }, data: { propertyStatus: "OCCUPIED", tenantEmail: (await tx.user.findUnique({ where: { id: application.tenantUserId } }))?.email || null, tenantName: null } });
      const tenantUser = await tx.user.findUnique({ where: { id: application.tenantUserId } });
      if (tenantUser?.userType === "TENANT" && tenantUser.status !== "ACTIVE") await tx.user.update({ where: { id: tenantUser.id }, data: { status: "ACTIVE", activatedAt: tenantUser.activatedAt || now } });
      return app;
    });
    await this.notify(application.tenantUserId, "TENANT_APPLICATION_APPROVED", "Tenant application approved", `Your tenancy for ${property.addressLine1} has been approved. Your tenant dashboard is now available.`, "TenantPropertyApplication", applicationId);
    await this.notify(property.landlordProfile.userId, "TENANT_APPLICATION_APPROVED", "Tenant approved", `The Estate Agent approved the tenant for ${property.addressLine1}.`, "TenantPropertyApplication", applicationId);
    const tenant = await this.prisma.user.findUnique({ where: { id: application.tenantUserId } });
    if (tenant) await this.mailService.sendTenantApplicationDecision({ email: tenant.email, approved: true, propertyAddress: `${property.addressLine1}, ${property.townCity}, ${property.postcode}` });
    return updated;
  }

  async inspectTenantApplicationUpdate(token: string) {
    const application = await this.db.tenantPropertyApplication.findUnique({ where: { moreInformationTokenHash: this.tokenHash(token) } });
    if (!application || application.status !== "MORE_INFORMATION_REQUIRED" || !application.moreInformationTokenExpiresAt || new Date(application.moreInformationTokenExpiresAt) <= new Date()) {
      throw new BadRequestException("This tenant information-update link is invalid or expired.");
    }
    const [tenant, property] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: application.tenantUserId }, select: { firstName: true, lastName: true, email: true } }),
      this.propertyContext(application.propertyId),
    ]);
    return {
      applicationId: application.id,
      status: application.status,
      request: application.moreInformationRequest,
      tenant,
      property: { id: property.id, addressLine1: property.addressLine1, townCity: property.townCity, postcode: property.postcode },
      values: {
        phone: application.phone,
        dateOfBirth: application.dateOfBirth,
        currentAddress: application.currentAddress,
        postcode: application.postcode,
        identificationType: application.identificationType,
        identificationFileUrl: application.identificationFileUrl,
        emergencyContactName: application.emergencyContactName,
        emergencyContactPhone: application.emergencyContactPhone,
        additionalNotes: application.additionalNotes,
      },
    };
  }

  async resubmitTenantApplication(token: string, dto: ResubmitTenantApplicationDto) {
    const application = await this.db.tenantPropertyApplication.findUnique({ where: { moreInformationTokenHash: this.tokenHash(token) } });
    if (!application || application.status !== "MORE_INFORMATION_REQUIRED" || !application.moreInformationTokenExpiresAt || new Date(application.moreInformationTokenExpiresAt) <= new Date()) {
      throw new BadRequestException("This tenant information-update link is invalid or expired.");
    }
    const property = await this.propertyContext(application.propertyId);
    const now = new Date();
    const updated = await this.prisma.$transaction(async (tx: any) => {
      await tx.tenantProfile.update({
        where: { id: application.tenantProfileId },
        data: {
          dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : application.dateOfBirth,
          currentAddress: this.clean(dto.currentAddress) ?? application.currentAddress,
          postcode: dto.postcode?.trim().toUpperCase() || application.postcode,
        },
      });
      if (dto.phone) await tx.user.update({ where: { id: application.tenantUserId }, data: { phone: this.clean(dto.phone) } });
      return (tx as any).tenantPropertyApplication.update({
        where: { id: application.id },
        data: {
          status: "PENDING_REVIEW",
          phone: this.clean(dto.phone) ?? application.phone,
          dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : application.dateOfBirth,
          currentAddress: this.clean(dto.currentAddress) ?? application.currentAddress,
          postcode: dto.postcode?.trim().toUpperCase() || application.postcode,
          identificationType: this.clean(dto.identificationType) ?? application.identificationType,
          identificationFileUrl: this.clean(dto.identificationFileUrl) ?? application.identificationFileUrl,
          emergencyContactName: this.clean(dto.emergencyContactName) ?? application.emergencyContactName,
          emergencyContactPhone: this.clean(dto.emergencyContactPhone) ?? application.emergencyContactPhone,
          additionalNotes: this.clean(dto.additionalNotes) ?? application.additionalNotes,
          moreInformationResponse: dto.responseNote.trim(),
          moreInformationTokenHash: null,
          moreInformationTokenExpiresAt: null,
          resubmittedAt: now,
          reviewedAt: null,
          reviewedByUserId: null,
        },
      });
    });
    const tenant = await this.prisma.user.findUnique({ where: { id: application.tenantUserId } });
    const agents = await this.prisma.agencyUser.findMany({ where: { agencyId: application.agencyId } });
    for (const a of agents) await this.notify(a.userId, "TENANT_INFORMATION_RESUBMITTED", "Tenant information resubmitted", `${tenant?.firstName || "Tenant"} ${tenant?.lastName || ""} provided the requested information for ${property.addressLine1}.`, "TenantPropertyApplication", application.id);
    await this.notify(application.landlordUserId, "TENANT_INFORMATION_RESUBMITTED", "Tenant information resubmitted", `The tenant provided the requested information for ${property.addressLine1}.`, "TenantPropertyApplication", application.id);
    await this.mailService.sendTenantApplicationSubmittedToAgent({ email: property.landlordProfile.agency!.contactEmail, tenantName: `${tenant?.firstName || "Tenant"} ${tenant?.lastName || ""}`.trim(), propertyAddress: `${property.addressLine1}, ${property.townCity}, ${property.postcode}` });
    return { message: "Your additional information has been submitted to the Estate Agent for review.", applicationId: application.id, status: updated.status };
  }

  async listTenantProperties(userId: string) {
    const links = await this.db.propertyTenant.findMany({ where: { tenantUserId: userId, status: "ACTIVE" }, orderBy: { createdAt: "desc" } });
    const ids = links.map((x: any) => x.propertyId);
    const properties = ids.length ? await this.prisma.property.findMany({ where: { id: { in: ids } } }) : [];
    return links.map((l: any) => ({ ...l, property: properties.find((p) => p.id === l.propertyId) }));
  }

  // ---------------- MAINTENANCE PROVIDERS ----------------
  async inviteMaintenance(userId: string, dto: InviteMaintenanceDto) {
    const { role, property } = await this.actorRoleForProperty(userId, dto.propertyId, dto.actingRole);
    const email = this.normaliseEmail(dto.email);
    const rawToken = this.newToken();
    await this.db.maintenanceInvitation.updateMany({ where: { propertyId: property.id, email, status: "PENDING" }, data: { status: "CANCELLED" } });
    const invitation = await this.db.maintenanceInvitation.create({ data: { propertyId: property.id, invitedByUserId: userId, invitedByRole: role, email, firstName: this.clean(dto.firstName), lastName: this.clean(dto.lastName), tradeType: this.clean(dto.tradeType), tokenHash: this.tokenHash(rawToken), expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) } });
    await this.mailService.sendMaintenancePropertyInvitation({ email, firstName: dto.firstName || "Maintenance provider", propertyAddress: `${property.addressLine1}, ${property.townCity}, ${property.postcode}`, invitedByRole: role, token: rawToken });
    if (role !== "LANDLORD") await this.notify(property.landlordProfile.userId, "MAINTENANCE_PROVIDER_INVITED", "Maintenance provider invited", `${email} was invited for ${property.addressLine1} by ${role.replaceAll("_", " ")}.`, "MaintenanceInvitation", invitation.id);
    const agents = await this.prisma.agencyUser.findMany({ where: { agencyId: property.landlordProfile.agencyId! } });
    for (const a of agents) if (a.userId !== userId) await this.notify(a.userId, "MAINTENANCE_PROVIDER_INVITED", "Maintenance provider invited", `${email} was invited for ${property.addressLine1} by ${role.replaceAll("_", " ")}.`, "MaintenanceInvitation", invitation.id);
    return { message: "Maintenance provider invitation sent successfully.", invitationId: invitation.id, approvalRequired: role === "TENANT" };
  }

  async inspectMaintenanceInvitation(token: string) {
    const invitation = await this.db.maintenanceInvitation.findUnique({ where: { tokenHash: this.tokenHash(token) } });
    if (!invitation || invitation.status !== "PENDING" || new Date(invitation.expiresAt) <= new Date()) throw new BadRequestException("This maintenance invitation is invalid or expired.");
    const property = await this.propertyContext(invitation.propertyId);
    return { invitationId: invitation.id, email: invitation.email, firstName: invitation.firstName, lastName: invitation.lastName, tradeType: invitation.tradeType, invitedByRole: invitation.invitedByRole, property: { id: property.id, addressLine1: property.addressLine1, townCity: property.townCity, postcode: property.postcode } };
  }

  async completeMaintenanceInvitation(dto: CompleteMaintenanceInvitationDto) {
    const invitation = await this.db.maintenanceInvitation.findUnique({ where: { tokenHash: this.tokenHash(dto.token) } });
    if (!invitation || invitation.status !== "PENDING" || new Date(invitation.expiresAt) <= new Date()) throw new BadRequestException("This maintenance invitation is invalid or expired.");
    const property = await this.propertyContext(invitation.propertyId);
    const email = this.normaliseEmail(invitation.email);
    let user = await this.prisma.user.findUnique({ where: { email }, include: { maintenanceProfile: true } });
    if (user?.passwordHash && !(await argon2.verify(user.passwordHash, dto.password))) throw new BadRequestException("Enter your existing TenureEx password to add the Maintenance Provider role.");
    const passwordHash = user?.passwordHash || await argon2.hash(dto.password);
    const autoApproved = invitation.invitedByRole !== "TENANT";
    const result = await this.prisma.$transaction(async (tx: any) => {
      if (!user) user = await tx.user.create({ data: { firstName: dto.firstName.trim(), lastName: dto.lastName.trim(), email, phone: this.clean(dto.phone), passwordHash, userType: "MAINTENANCE_PROVIDER", status: autoApproved ? "ACTIVE" : "PENDING_REVIEW", emailVerified: true, phoneVerified: false, activatedAt: autoApproved ? new Date() : null } });
      const maintenanceUser = user!;
      let profile = await tx.maintenanceProviderProfile.findUnique({ where: { userId: maintenanceUser.id } });
      if (!profile) profile = await tx.maintenanceProviderProfile.create({ data: { userId: maintenanceUser.id, businessName: this.clean(dto.businessName), tradeType: this.clean(dto.tradeType) || invitation.tradeType, registrationNumber: this.clean(dto.registrationNumber), insuranceExpiry: dto.insuranceExpiry ? new Date(dto.insuranceExpiry) : null, approved: autoApproved } });
      else if (autoApproved && !profile.approved) profile = await tx.maintenanceProviderProfile.update({ where: { id: profile.id }, data: { approved: true } });
      await this.addRole(tx, maintenanceUser.id, "GLOBAL_MAINTENANCE_PROVIDER", "Maintenance Provider");
      const association = await (tx as any).propertyMaintenanceProvider.upsert({ where: { propertyId_maintenanceProfileId: { propertyId: property.id, maintenanceProfileId: profile.id } }, update: { addedByUserId: invitation.invitedByUserId, addedByRole: invitation.invitedByRole, status: autoApproved ? "APPROVED" : "PENDING_APPROVAL", approvedAt: autoApproved ? new Date() : null }, create: { propertyId: property.id, maintenanceUserId: maintenanceUser.id, maintenanceProfileId: profile.id, addedByUserId: invitation.invitedByUserId, addedByRole: invitation.invitedByRole, status: autoApproved ? "APPROVED" : "PENDING_APPROVAL", approvedAt: autoApproved ? new Date() : null } });
      await (tx as any).maintenanceInvitation.update({ where: { id: invitation.id }, data: { status: "ACCEPTED", acceptedAt: new Date() } });
      return association;
    });
    const agents = await this.prisma.agencyUser.findMany({ where: { agencyId: property.landlordProfile.agencyId! } });
    for (const a of agents) await this.notify(a.userId, autoApproved ? "MAINTENANCE_PROVIDER_ADDED" : "MAINTENANCE_PROVIDER_APPROVAL_REQUIRED", autoApproved ? "Maintenance provider added" : "Maintenance provider approval required", `${dto.firstName} ${dto.lastName} registered for ${property.addressLine1}.`, "PropertyMaintenanceProvider", result.id);
    await this.notify(property.landlordProfile.userId, "MAINTENANCE_PROVIDER_REGISTERED", "Maintenance provider registered", `${dto.firstName} ${dto.lastName} is ${autoApproved ? "available" : "awaiting Estate Agent approval"} for ${property.addressLine1}.`, "PropertyMaintenanceProvider", result.id);
    return { message: autoApproved ? "Maintenance provider registration completed." : "Registration completed and sent to the Estate Agent for approval.", status: result.status, associationId: result.id };
  }

  async listMaintenanceProperties(userId: string) {
    const profile = await this.prisma.maintenanceProviderProfile.findUnique({ where: { userId } });
    if (!profile) return [];
    const links = await this.db.propertyMaintenanceProvider.findMany({
      where: { maintenanceProfileId: profile.id, status: "APPROVED" },
      orderBy: { createdAt: "desc" },
    });
    if (!links.length) return [];
    const properties = await this.prisma.property.findMany({
      where: { id: { in: links.map((link: any) => link.propertyId) } },
    });
    return links.map((link: any) => ({
      ...link,
      property: properties.find((property) => property.id === link.propertyId) || null,
    }));
  }

  async listPropertyMaintenanceProviders(userId: string, propertyId: string) {
    await this.actorRoleForProperty(userId, propertyId);
    const links = await this.db.propertyMaintenanceProvider.findMany({ where: { propertyId }, orderBy: { createdAt: "desc" } });
    const users = await this.prisma.user.findMany({ where: { id: { in: links.map((l: any) => l.maintenanceUserId) } }, include: { maintenanceProfile: true } });
    return links.map((l: any) => ({ ...l, user: users.find((u) => u.id === l.maintenanceUserId) }));
  }

  async reviewMaintenanceProvider(agentUserId: string, associationId: string, dto: ReviewMaintenanceProviderDto) {
    const link = await this.db.propertyMaintenanceProvider.findUnique({ where: { id: associationId } });
    if (!link) throw new NotFoundException("Maintenance provider assignment was not found.");
    const { property } = await this.agentForProperty(agentUserId, link.propertyId);
    const approved = dto.action === "APPROVE";
    const updated = await this.prisma.$transaction(async (tx: any) => {
      const row = await (tx as any).propertyMaintenanceProvider.update({ where: { id: associationId }, data: { status: approved ? "APPROVED" : "REJECTED", approvedByUserId: approved ? agentUserId : null, approvedAt: approved ? new Date() : null, rejectedAt: approved ? null : new Date(), rejectionReason: approved ? null : this.clean(dto.message) } });
      if (approved) {
        const otherPending = await (tx as any).propertyMaintenanceProvider.count({ where: { maintenanceProfileId: link.maintenanceProfileId, status: "APPROVED" } });
        if (otherPending >= 1) await tx.maintenanceProviderProfile.update({ where: { id: link.maintenanceProfileId }, data: { approved: true } });
        const u = await tx.user.findUnique({ where: { id: link.maintenanceUserId } });
        if (u?.userType === "MAINTENANCE_PROVIDER" && u.status !== "ACTIVE") await tx.user.update({ where: { id: u.id }, data: { status: "ACTIVE", activatedAt: u.activatedAt || new Date() } });
      }
      return row;
    });
    await this.notify(link.maintenanceUserId, approved ? "MAINTENANCE_PROVIDER_APPROVED" : "MAINTENANCE_PROVIDER_REJECTED", approved ? "Maintenance provider approved" : "Maintenance provider not approved", approved ? `You are approved for ${property.addressLine1}.` : (dto.message?.trim() || `You were not approved for ${property.addressLine1}.`), "PropertyMaintenanceProvider", associationId);
    return updated;
  }

  // ---------------- MAINTENANCE REQUESTS ----------------
  async createMaintenanceRequest(userId: string, dto: CreateMaintenanceRequestDto) {
    const tenantLink = await this.db.propertyTenant.findFirst({ where: { propertyId: dto.propertyId, tenantUserId: userId, status: "ACTIVE" } });
    if (!tenantLink) throw new ForbiddenException("Only an approved tenant for this property can create a maintenance request.");
    for (const slot of dto.slots) if (new Date(slot.endAt) <= new Date(slot.startAt)) throw new BadRequestException("Each availability slot must end after it starts.");
    const request = await this.prisma.$transaction(async (tx: any) => {
      const row = await (tx as any).maintenanceRequest.create({ data: { propertyId: dto.propertyId, tenantUserId: userId, tenantProfileId: tenantLink.tenantProfileId, title: dto.title.trim(), description: dto.description.trim(), category: dto.category.trim(), roomLocation: this.clean(dto.roomLocation), priority: dto.priority || "MEDIUM", accessPermission: dto.accessPermission || false, status: "OPEN" } });
      for (const slot of dto.slots) await (tx as any).maintenanceTimeSlot.create({ data: { maintenanceRequestId: row.id, proposedBy: "TENANT", startAt: new Date(slot.startAt), endAt: new Date(slot.endAt), status: "AVAILABLE" } });
      return row;
    });
    const property = await this.propertyContext(dto.propertyId);
    const providers = await this.db.propertyMaintenanceProvider.findMany({ where: { propertyId: dto.propertyId, status: "APPROVED" } });
    const providerUsers = await this.prisma.user.findMany({ where: { id: { in: providers.map((p: any) => p.maintenanceUserId) } } });
    for (const provider of providerUsers) {
      await this.notify(provider.id, "MAINTENANCE_JOB_AVAILABLE", "New maintenance work available", `${dto.title} at ${property.addressLine1}. Open the job to review the tenant's available times.`, "MaintenanceRequest", request.id);
      await this.mailService.sendMaintenanceJobAvailable({ email: provider.email, title: dto.title, propertyAddress: `${property.addressLine1}, ${property.townCity}, ${property.postcode}`, requestId: request.id });
    }
    await this.notify(property.landlordProfile.userId, "MAINTENANCE_REQUEST_CREATED", "Tenant reported maintenance", `${dto.title} was reported at ${property.addressLine1}.`, "MaintenanceRequest", request.id);
    const agents = await this.prisma.agencyUser.findMany({ where: { agencyId: property.landlordProfile.agencyId! } });
    for (const a of agents) await this.notify(a.userId, "MAINTENANCE_REQUEST_CREATED", "Tenant reported maintenance", `${dto.title} was reported at ${property.addressLine1}.`, "MaintenanceRequest", request.id);
    return { message: "Maintenance request created and approved maintenance providers have been notified.", request };
  }

  async addMaintenancePhotos(userId: string, requestId: string, phase: "REPORTED" | "BEFORE" | "AFTER", files: Express.Multer.File[]) {
    if (!files.length) throw new BadRequestException("Select at least one photo.");
    const request = await this.db.maintenanceRequest.findUnique({ where: { id: requestId } });
    if (!request) throw new NotFoundException("Maintenance request was not found.");
    if (phase === "REPORTED" && request.tenantUserId !== userId) throw new ForbiddenException("Only the tenant can upload reported issue photos.");
    if ((phase === "BEFORE" || phase === "AFTER") && request.assignedProviderUserId !== userId) throw new ForbiddenException("Only the assigned maintenance provider can upload work photos.");
    const rows = [];
    for (const file of files) rows.push(await this.db.maintenanceRequestPhoto.create({ data: { maintenanceRequestId: requestId, uploadedByUserId: userId, phase, fileName: file.filename } }));
    return { message: `${phase.toLowerCase()} photos uploaded successfully.`, photos: rows };
  }

  async listMaintenanceRequests(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, include: { landlordProfile: true, maintenanceProfile: true } });
    if (!user) throw new NotFoundException("User was not found.");
    const filters: any[] = [{ tenantUserId: userId }, { assignedProviderUserId: userId }];
    const providerLinks = user.maintenanceProfile ? await this.db.propertyMaintenanceProvider.findMany({ where: { maintenanceProfileId: user.maintenanceProfile.id, status: "APPROVED" } }) : [];
    if (providerLinks.length) filters.push({ propertyId: { in: providerLinks.map((x: any) => x.propertyId) }, status: "OPEN" });
    if (user.landlordProfile) {
      const props = await this.prisma.property.findMany({ where: { landlordProfileId: user.landlordProfile.id }, select: { id: true } });
      if (props.length) filters.push({ propertyId: { in: props.map((p) => p.id) } });
    }
    const memberships = await this.prisma.agencyUser.findMany({ where: { userId } });
    if (memberships.length) {
      const props = await this.prisma.property.findMany({ where: { landlordProfile: { agencyId: { in: memberships.map((m) => m.agencyId) } } }, select: { id: true } });
      if (props.length) filters.push({ propertyId: { in: props.map((p) => p.id) } });
    }
    if (!filters.length) return [];
    const requests = await this.db.maintenanceRequest.findMany({ where: { OR: filters }, orderBy: { createdAt: "desc" } });
    return Promise.all(requests.map((r: any) => this.presentMaintenanceRequest(r)));
  }

  async getMaintenanceRequest(userId: string, requestId: string) {
    const request = await this.db.maintenanceRequest.findUnique({ where: { id: requestId } });
    if (!request) throw new NotFoundException("Maintenance request was not found.");
    await this.ensureMaintenanceRequestAccess(userId, request);
    return this.presentMaintenanceRequest(request);
  }

  private async presentMaintenanceRequest(request: any) {
    const [slots, photos, property, tenant, assignedProvider] = await Promise.all([
      this.db.maintenanceTimeSlot.findMany({ where: { maintenanceRequestId: request.id }, orderBy: { startAt: "asc" } }),
      this.db.maintenanceRequestPhoto.findMany({ where: { maintenanceRequestId: request.id }, orderBy: { createdAt: "asc" } }),
      this.prisma.property.findUnique({ where: { id: request.propertyId } }),
      this.prisma.user.findUnique({ where: { id: request.tenantUserId }, select: { id: true, firstName: true, lastName: true, email: true, phone: true } }),
      request.assignedProviderUserId
        ? this.prisma.user.findUnique({ where: { id: request.assignedProviderUserId }, select: { id: true, firstName: true, lastName: true, email: true, phone: true } })
        : Promise.resolve(null),
    ]);
    return {
      ...request,
      property,
      tenant,
      assignedProvider,
      slots,
      photos: photos.map((p: any) => ({ ...p, url: `/api/v1/uploads/maintenance/${encodeURIComponent(p.fileName)}` })),
    };
  }

  private async ensureMaintenanceRequestAccess(userId: string, request: any) {
    if (request.tenantUserId === userId || request.assignedProviderUserId === userId) return;
    const { role } = await this.actorRoleForProperty(userId, request.propertyId);
    if (["LANDLORD", "ESTATE_AGENT"].includes(role)) return;
    const provider = await this.db.propertyMaintenanceProvider.findFirst({ where: { propertyId: request.propertyId, maintenanceUserId: userId, status: "APPROVED" } });
    if (!provider) throw new ForbiddenException("You do not have access to this maintenance request.");
  }

  async addTenantMaintenanceSlots(tenantUserId: string, requestId: string, slots: { startAt: string; endAt: string }[]) {
    const request = await this.db.maintenanceRequest.findUnique({ where: { id: requestId } });
    if (!request) throw new NotFoundException("Maintenance request was not found.");
    if (request.tenantUserId !== tenantUserId) throw new ForbiddenException("Only the tenant for this maintenance request can add availability.");
    if (!slots.length) throw new BadRequestException("Add at least one available date and time slot.");
    for (const slot of slots) {
      const start = new Date(slot.startAt); const end = new Date(slot.endAt);
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) throw new BadRequestException("Each availability slot must have a valid start and end time.");
    }
    await this.prisma.$transaction(async (tx: any) => {
      await (tx as any).maintenanceTimeSlot.deleteMany({ where: { maintenanceRequestId: requestId, proposedBy: "TENANT", status: "AVAILABLE" } });
      for (const slot of slots) await (tx as any).maintenanceTimeSlot.create({ data: { maintenanceRequestId: requestId, proposedBy: "TENANT", startAt: new Date(slot.startAt), endAt: new Date(slot.endAt), status: "AVAILABLE" } });
      await (tx as any).maintenanceRequest.update({ where: { id: requestId }, data: { status: "OPEN" } });
    });
    const property = await this.propertyContext(request.propertyId);
    const providers = await this.db.propertyMaintenanceProvider.findMany({ where: { propertyId: request.propertyId, status: "APPROVED" } });
    const providerUsers = await this.prisma.user.findMany({ where: { id: { in: providers.map((p: any) => p.maintenanceUserId) } } });
    for (const provider of providerUsers) {
      await this.notify(provider.id, "MAINTENANCE_JOB_AVAILABLE", "Council-required maintenance available", `${request.title} at ${property.addressLine1}. The tenant has added available visit times.`, "MaintenanceRequest", requestId);
      await this.mailService.sendMaintenanceJobAvailable({ email: provider.email, title: request.title, propertyAddress: `${property.addressLine1}, ${property.townCity}, ${property.postcode}`, requestId });
    }
    return this.getMaintenanceRequest(tenantUserId, requestId);
  }

  async acceptMaintenanceSlot(providerUserId: string, requestId: string, slotId: string) {
    const request = await this.db.maintenanceRequest.findUnique({ where: { id: requestId } });
    if (!request) throw new NotFoundException("Maintenance request was not found.");
    if (request.status !== "OPEN" && request.status !== "REOPENED") throw new ConflictException("This maintenance request is no longer available for scheduling.");
    const provider = await this.db.propertyMaintenanceProvider.findFirst({ where: { propertyId: request.propertyId, maintenanceUserId: providerUserId, status: "APPROVED" } });
    if (!provider) throw new ForbiddenException("You are not an approved maintenance provider for this property.");
    const slot = await this.db.maintenanceTimeSlot.findFirst({ where: { id: slotId, maintenanceRequestId: requestId, proposedBy: "TENANT", status: "AVAILABLE" } });
    if (!slot) throw new BadRequestException("The selected tenant availability slot is not available.");
    const updated = await this.prisma.$transaction(async (tx: any) => {
      await (tx as any).maintenanceTimeSlot.updateMany({ where: { maintenanceRequestId: requestId, status: "AVAILABLE" }, data: { status: "NOT_SELECTED" } });
      await (tx as any).maintenanceTimeSlot.update({ where: { id: slot.id }, data: { status: "SELECTED", providerUserId } });
      return (tx as any).maintenanceRequest.update({ where: { id: requestId }, data: { status: "SCHEDULED", assignedProviderUserId: providerUserId, assignedProviderProfileId: provider.maintenanceProfileId, scheduledStart: slot.startAt, scheduledEnd: slot.endAt } });
    });
    await this.notify(request.tenantUserId, "MAINTENANCE_SCHEDULED", "Maintenance visit scheduled", "A maintenance provider selected one of your available time slots.", "MaintenanceRequest", requestId);
    return updated;
  }

  async startMaintenanceJob(providerUserId: string, requestId: string, dto: UpdateMaintenanceStatusDto) {
    const request = await this.db.maintenanceRequest.findUnique({ where: { id: requestId } });
    if (!request) throw new NotFoundException("Maintenance request was not found.");
    if (request.assignedProviderUserId !== providerUserId) throw new ForbiddenException("Only the assigned maintenance provider can start this job.");
    if (request.status !== "SCHEDULED") throw new ConflictException("This job must be scheduled before it can be started.");
    return this.db.maintenanceRequest.update({ where: { id: requestId }, data: { status: "IN_PROGRESS", providerNotes: this.clean(dto.providerNotes) } });
  }

  async finishMaintenanceJob(providerUserId: string, requestId: string, dto: UpdateMaintenanceStatusDto) {
    const request = await this.db.maintenanceRequest.findUnique({ where: { id: requestId } });
    if (!request) throw new NotFoundException("Maintenance request was not found.");
    if (request.assignedProviderUserId !== providerUserId) throw new ForbiddenException("Only the assigned maintenance provider can finish this job.");
    if (request.status !== "IN_PROGRESS") throw new ConflictException("The job must be in progress before it can be marked as finished.");
    const beforeCount = await this.db.maintenanceRequestPhoto.count({ where: { maintenanceRequestId: requestId, phase: "BEFORE" } });
    const afterCount = await this.db.maintenanceRequestPhoto.count({ where: { maintenanceRequestId: requestId, phase: "AFTER" } });
    if (!beforeCount || !afterCount) throw new BadRequestException("Upload at least one before photo and one after photo before finishing the job.");
    const updated = await this.db.maintenanceRequest.update({ where: { id: requestId }, data: { status: "AWAITING_TENANT_CONFIRMATION", completionNotes: this.clean(dto.completionNotes), completedByProviderAt: new Date() } });
    await this.notify(request.tenantUserId, "MAINTENANCE_AWAITING_CONFIRMATION", "Confirm maintenance completion", "The maintenance provider has finished the work. Review the result and confirm whether the issue is resolved.", "MaintenanceRequest", requestId);
    return updated;
  }

  async confirmMaintenanceCompletion(tenantUserId: string, requestId: string, dto: ConfirmMaintenanceDto) {
    const request = await this.db.maintenanceRequest.findUnique({ where: { id: requestId } });
    if (!request) throw new NotFoundException("Maintenance request was not found.");
    if (request.tenantUserId !== tenantUserId) throw new ForbiddenException("Only the tenant who reported this issue can confirm completion.");
    if (request.status !== "AWAITING_TENANT_CONFIRMATION") throw new ConflictException("This request is not awaiting tenant confirmation.");
    const updated = await this.db.maintenanceRequest.update({ where: { id: requestId }, data: dto.completed ? { status: "COMPLETED", tenantCompletionNote: this.clean(dto.note), tenantConfirmedAt: new Date() } : { status: "REOPENED", tenantCompletionNote: this.clean(dto.note), reopenedAt: new Date(), assignedProviderUserId: null, assignedProviderProfileId: null, scheduledStart: null, scheduledEnd: null } });
    if (request.assignedProviderUserId) await this.notify(request.assignedProviderUserId, dto.completed ? "MAINTENANCE_COMPLETED" : "MAINTENANCE_REOPENED", dto.completed ? "Maintenance confirmed complete" : "Maintenance issue reopened", dto.completed ? "The tenant confirmed that the work is complete." : (dto.note?.trim() || "The tenant says the issue is not resolved."), "MaintenanceRequest", requestId);
    return updated;
  }

  // ---------------- NOTIFICATIONS ----------------
  async listNotifications(userId: string) { return this.db.notification.findMany({ where: { recipientUserId: userId }, orderBy: { createdAt: "desc" }, take: 100 }); }
  async markNotificationRead(userId: string, id: string) {
    const notification = await this.db.notification.findFirst({ where: { id, recipientUserId: userId } });
    if (!notification) throw new NotFoundException("Notification was not found.");
    return this.db.notification.update({ where: { id }, data: { readAt: new Date() } });
  }
}
